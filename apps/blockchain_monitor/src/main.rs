use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    pubkey::Pubkey,
    signature::Signature,
};
use solana_transaction_status::UiTransactionEncoding;
use serde::{Deserialize, Serialize};
use borsh::{BorshDeserialize, BorshSerialize};
use redis::Commands;
use std::str::FromStr;
use std::sync::Arc;
use tokio::time::{sleep, Duration};
use base64::Engine;
use anyhow::{Result, anyhow};
use std::collections::HashSet;
use sha2::{Sha256, Digest};
use dotenv::dotenv;
use std::env;
use bs58;

const PROGRAM_ID: &str = "98g9uR7WZqinAnSeUgB5nUw3pbR6sNwFuYWW78yPHtva";

const DEFAULT_REDIS_QUEUE: &str = "solana_auto_sol_events";
const DEFAULT_SOLANA_RPC_URL: &str = "http://127.0.0.1:8899";
const DEFAULT_POLL_INTERVAL_MS: u64 = 1000;

const PAYMENT_SCHEDULE_CREATED_DISCRIMINATOR: [u8; 8] = [43, 244, 87, 216, 27, 10, 99, 229];
const PAYMENT_EXECUTED_DISCRIMINATOR: [u8; 8] = [71, 65, 49, 77, 198, 22, 227, 182];
const PAYMENT_SCHEDULE_CANCELLED_DISCRIMINATOR: [u8; 8] = [87, 114, 182, 97, 125, 1, 183, 110];
const FEES_WITHDRAWN_DISCRIMINATOR: [u8; 8] = [93, 177, 0, 69, 15, 156, 73, 194];
const FEE_PERCENTAGE_UPDATED_DISCRIMINATOR: [u8; 8] = [159, 56, 203, 216, 111, 194, 177, 206];

#[derive(Debug, Clone)]
pub struct Config {
    pub redis_url: String,
    pub redis_queue: String,
    pub solana_rpc_url: String,
    pub poll_interval_ms: u64,
}

impl Config {
    pub fn from_env() -> Result<Self> {
       
        dotenv().ok(); 
        
        let redis_url = env::var("REDIS_URL")
            .map_err(|_| anyhow!("REDIS_URL environment variable is required"))?;
        
        let redis_queue = env::var("REDIS_QUEUE")
            .unwrap_or_else(|_| DEFAULT_REDIS_QUEUE.to_string());
        
        let solana_rpc_url = env::var("SOLANA_RPC_URL")
            .unwrap_or_else(|_| DEFAULT_SOLANA_RPC_URL.to_string());
        
        let poll_interval_ms = env::var("POLL_INTERVAL_MS")
            .unwrap_or_else(|_| DEFAULT_POLL_INTERVAL_MS.to_string())
            .parse::<u64>()
            .map_err(|_| anyhow!("POLL_INTERVAL_MS must be a valid number"))?;
        
        Ok(Self {
            redis_url,
            redis_queue,
            solana_rpc_url,
            poll_interval_ms,
        })
    }
}

fn calculate_event_discriminator(event_name: &str) -> [u8; 8] {
    let preimage = format!("event:{}", event_name);
    let mut hasher = Sha256::new();
    hasher.update(preimage.as_bytes());
    let hash = hasher.finalize();
    
    let mut discriminator = [0u8; 8];
    discriminator.copy_from_slice(&hash[..8]);
    discriminator
}

// Custom serializer for Pubkey as base58 string
fn pubkey_as_base58<S>(pk: &Pubkey, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    serializer.serialize_str(&pk.to_string())
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize, Clone, Debug)]
pub struct PaymentScheduleCreatedEvent {
    #[serde(serialize_with = "pubkey_as_base58")]
    pub schedule_id: Pubkey,
    #[serde(serialize_with = "pubkey_as_base58")]
    pub owner: Pubkey,
    #[serde(serialize_with = "pubkey_as_base58")]
    pub recipient: Pubkey,
    pub total_amount: u64,
    pub payment_amount: u64,
    pub payment_count: u64,
    pub created_at: i64,
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize, Clone, Debug)]
pub struct PaymentExecutedEvent {
    #[serde(serialize_with = "pubkey_as_base58")]
    pub schedule_id: Pubkey,
    pub payment_index: u64,
    pub amount: u64,
    #[serde(serialize_with = "pubkey_as_base58")]
    pub recipient: Pubkey,
    pub executed_at: i64,
    #[serde(serialize_with = "pubkey_as_base58")]
    pub executed_by: Pubkey,
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize, Clone, Debug)]
pub struct PaymentScheduleCancelledEvent {
    #[serde(serialize_with = "pubkey_as_base58")]
    pub schedule_id: Pubkey,
    #[serde(serialize_with = "pubkey_as_base58")]
    pub owner: Pubkey,
    pub refund_amount: u64,
    pub cancelled_at: i64,
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize, Clone, Debug)]
pub struct FeesWithdrawnEvent {
    pub amount: u64,
    #[serde(serialize_with = "pubkey_as_base58")]
    pub withdrawn_by: Pubkey,
    pub withdrawn_at: i64,
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize, Clone, Debug)]
pub struct FeePercentageUpdatedEvent {
    pub old_percentage: u16,
    pub new_percentage: u16,
    pub updated_at: i64,
}

#[derive(Serialize, Debug)]
struct EventWrapper {
    event_type: String,
    event_data: serde_json::Value,
    signature: String,
    slot: u64,
    timestamp: i64,
}

pub struct BlockchainMonitor {
    rpc_client: Arc<RpcClient>,
    redis_client: redis::Client,
    program_id: Pubkey,
    processed_signatures: HashSet<String>,
    config: Config,
}

impl BlockchainMonitor {
    pub fn new(config: Config) -> Result<Self> {
        let rpc_client = Arc::new(RpcClient::new_with_commitment(
            config.solana_rpc_url.clone(),
            CommitmentConfig::confirmed(),
        ));
        
        let redis_client = redis::Client::open(config.redis_url.as_str())
            .map_err(|e| anyhow!("Failed to create Redis client: {}", e))?;
        
        let program_id = Pubkey::from_str(PROGRAM_ID)
            .map_err(|e| anyhow!("Invalid program ID: {}", e))?;
        
        Ok(Self {
            rpc_client,
            redis_client,
            program_id,
            processed_signatures: HashSet::new(),
            config,
        })
    }

    pub async fn start_monitoring(&mut self) -> Result<()> {
        println!("Starting blockchain monitor for program: {}", PROGRAM_ID);
        println!("Redis URL: {}", self.config.redis_url);
        println!("Redis Queue: {}", self.config.redis_queue);
        println!("Solana RPC URL: {}", self.config.solana_rpc_url);
        println!("Monitoring interval: {}ms", self.config.poll_interval_ms);
        

        self.verify_discriminators();

        let mut redis_con = self.redis_client.get_connection()
            .map_err(|e| anyhow!("Failed to connect to Redis: {}", e))?;
        
        let _: String = redis::cmd("PING").query(&mut redis_con)
            .map_err(|e| anyhow!("Redis ping failed: {}", e))?;
        
        println!("Connected to Redis successfully");
        
        loop {
            match self.check_for_new_transactions().await {
                Ok(count) => {
                    if count > 0 {
                        println!("Processed {} new transactions", count);
                    }
                }
                Err(e) => {
                    eprintln!("Error checking transactions: {}", e);
                }
            }
            
            sleep(Duration::from_millis(self.config.poll_interval_ms)).await;
        }
    }

    fn verify_discriminators(&self) {
        println!("Verifying event discriminators:");
        
        let events = vec![
            ("PaymentScheduleCreatedEvent", PAYMENT_SCHEDULE_CREATED_DISCRIMINATOR),
            ("PaymentExecutedEvent", PAYMENT_EXECUTED_DISCRIMINATOR),
            ("PaymentScheduleCancelledEvent", PAYMENT_SCHEDULE_CANCELLED_DISCRIMINATOR),
            ("FeesWithdrawnEvent", FEES_WITHDRAWN_DISCRIMINATOR),
            ("FeePercentageUpdatedEvent", FEE_PERCENTAGE_UPDATED_DISCRIMINATOR),
        ];
        
        for (event_name, expected_discriminator) in events {
            let calculated = calculate_event_discriminator(event_name);
            if calculated == expected_discriminator {
                println!("✓ {} discriminator matches", event_name);
            } else {
                println!("✗ {} discriminator mismatch!", event_name);
                println!("  Expected: {:?}", expected_discriminator);
                println!("  Calculated: {:?}", calculated);
            }
        }
    }

    async fn check_for_new_transactions(&mut self) -> Result<usize> {
        
        let signatures = self.rpc_client
            .get_signatures_for_address(&self.program_id)
            .map_err(|e| anyhow!("Failed to get signatures: {}", e))?;
        
        let mut processed_count = 0;
        
        for signature_info in signatures.iter().take(10) {
            let signature_str = signature_info.signature.clone();
            
            // Skip if already processed
            if self.processed_signatures.contains(&signature_str) {
                continue;
            }
            
            match self.process_transaction(&signature_str).await {
                Ok(true) => {
                    processed_count += 1;
                    self.processed_signatures.insert(signature_str);
                }
                Ok(false) => {
                    self.processed_signatures.insert(signature_str);
                }
                Err(e) => {
                    eprintln!("Error processing transaction {}: {}", signature_str, e);
                }
            }
        }
        
        // Clean up old signatures to prevent memory growth
        if self.processed_signatures.len() > 1000 {
            let mut sigs_vec: Vec<_> = self.processed_signatures.drain().collect();
            sigs_vec.truncate(500);
            self.processed_signatures.extend(sigs_vec);
        }
        
        Ok(processed_count)
    }

    async fn process_transaction(&self, signature_str: &str) -> Result<bool> {
        let signature = Signature::from_str(signature_str)
            .map_err(|e| anyhow!("Invalid signature: {}", e))?;
        
        let transaction = self.rpc_client
            .get_transaction(&signature, UiTransactionEncoding::Json)
            .map_err(|e| anyhow!("Failed to get transaction: {}", e))?;
        
        let mut found_events = false;
        
        if let Some(meta) = &transaction.transaction.meta {
            let log_messages = match &meta.log_messages {
                solana_transaction_status::option_serializer::OptionSerializer::Some(logs) => logs,
                solana_transaction_status::option_serializer::OptionSerializer::None => return Ok(false),
                solana_transaction_status::option_serializer::OptionSerializer::Skip => return Ok(false),
            };
            
            for log in log_messages {
                if log.starts_with("Program data: ") {
                    if let Some(data_str) = log.strip_prefix("Program data: ") {
                        if let Ok(data_bytes) = base64::engine::general_purpose::STANDARD.decode(data_str) {
                            if self.process_event_data(&data_bytes, signature_str, transaction.slot)? {
                                found_events = true;
                            }
                        }
                    }
                }
            }
        }
        
        Ok(found_events)
    }

    fn process_event_data(&self, data: &[u8], signature: &str, slot: u64) -> Result<bool> {
        if data.len() < 8 {
            return Ok(false);
        }

        let discriminator = &data[0..8];
        let event_data = &data[8..];
        
        let mut redis_con = self.redis_client.get_connection()
            .map_err(|e| anyhow!("Failed to get Redis connection: {}", e))?;
        
        let timestamp = chrono::Utc::now().timestamp();
        
  
        let event_wrapper = if discriminator == PAYMENT_SCHEDULE_CREATED_DISCRIMINATOR {
            match PaymentScheduleCreatedEvent::try_from_slice(event_data) {
                Ok(event) => {
                    println!("Found PaymentScheduleCreatedEvent: {:#?}", event);
                    Some(EventWrapper {
                        event_type: "PaymentScheduleCreatedEvent".to_string(),
                        event_data: serde_json::to_value(&event)?,
                        signature: signature.to_string(),
                        slot,
                        timestamp,
                    })
                }
                Err(e) => {
                    println!("Failed to deserialize PaymentScheduleCreatedEvent: {}", e);
                    None
                }
            }
        } else if discriminator == PAYMENT_EXECUTED_DISCRIMINATOR {
            match PaymentExecutedEvent::try_from_slice(event_data) {
                Ok(event) => {
                    println!("Found PaymentExecutedEvent: {:#?}", event);
                    Some(EventWrapper {
                        event_type: "PaymentExecutedEvent".to_string(),
                        event_data: serde_json::to_value(&event)?,
                        signature: signature.to_string(),
                        slot,
                        timestamp,
                    })
                }
                Err(e) => {
                    println!("Failed to deserialize PaymentExecutedEvent: {}", e);
                    None
                }
            }
        } else if discriminator == PAYMENT_SCHEDULE_CANCELLED_DISCRIMINATOR {
            match PaymentScheduleCancelledEvent::try_from_slice(event_data) {
                Ok(event) => {
                    println!("Found PaymentScheduleCancelledEvent: {:#?}", event);
                    Some(EventWrapper {
                        event_type: "PaymentScheduleCancelledEvent".to_string(),
                        event_data: serde_json::to_value(&event)?,
                        signature: signature.to_string(),
                        slot,
                        timestamp,
                    })
                }
                Err(e) => {
                    println!("Failed to deserialize PaymentScheduleCancelledEvent: {}", e);
                    None
                }
            }
        } else if discriminator == FEES_WITHDRAWN_DISCRIMINATOR {
            match FeesWithdrawnEvent::try_from_slice(event_data) {
                Ok(event) => {
                    println!("Found FeesWithdrawnEvent: {:#?}", event);
                    Some(EventWrapper {
                        event_type: "FeesWithdrawnEvent".to_string(),
                        event_data: serde_json::to_value(&event)?,
                        signature: signature.to_string(),
                        slot,
                        timestamp,
                    })
                }
                Err(e) => {
                    println!("Failed to deserialize FeesWithdrawnEvent: {}", e);
                    None
                }
            }
        } else if discriminator == FEE_PERCENTAGE_UPDATED_DISCRIMINATOR {
            match FeePercentageUpdatedEvent::try_from_slice(event_data) {
                Ok(event) => {
                    println!("Found FeePercentageUpdatedEvent: {:#?}", event);
                    Some(EventWrapper {
                        event_type: "FeePercentageUpdatedEvent".to_string(),
                        event_data: serde_json::to_value(&event)?,
                        signature: signature.to_string(),
                        slot,
                        timestamp,
                    })
                }
                Err(e) => {
                    println!("Failed to deserialize FeePercentageUpdatedEvent: {}", e);
                    None
                }
            }
        } else {
         
            println!("Unknown event discriminator: {:?}", discriminator);
            None
        };
        
        if let Some(wrapper) = event_wrapper {
            let json_data = serde_json::to_string(&wrapper)?;
            println!("json_data: {}", json_data);
            let _: () = redis_con.lpush(&self.config.redis_queue, json_data)
                .map_err(|e| anyhow!("Failed to push to Redis: {}", e))?;
            
            println!("Event pushed to Redis queue: {}", self.config.redis_queue);
            return Ok(true);
        }
        
        Ok(false)
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    println!("AutoSol Blockchain Monitor Service");
    
  
    let config = Config::from_env().map_err(|e| {
        eprintln!("Configuration error: {}", e);
        eprintln!("Please ensure the following environment variables are set:");
        eprintln!("  REDIS_URL (required)");
        eprintln!("  REDIS_QUEUE (optional, defaults to '{}')", DEFAULT_REDIS_QUEUE);
        eprintln!("  SOLANA_RPC_URL (optional, defaults to '{}')", DEFAULT_SOLANA_RPC_URL);
        eprintln!("  POLL_INTERVAL_MS (optional, defaults to {})", DEFAULT_POLL_INTERVAL_MS);
        e
    })?;
    
    println!("Program ID: {}", PROGRAM_ID);
    
    let mut monitor = BlockchainMonitor::new(config)?;
    
  
    monitor.start_monitoring().await?;
    
    Ok(())
}