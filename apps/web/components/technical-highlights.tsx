"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ExternalLink, Code, Zap, Droplet, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TechnicalHighlights() {
  const [activeTab, setActiveTab] = useState("performance");
  const [isInView, setIsInView] = useState(false);
  const [counters, setCounters] = useState({
    speed: 0,
    cost: 0,
    efficiency: 0,
  });

  // Animate counters when in view
  useEffect(() => {
    if (isInView) {
      const interval = setInterval(() => {
        setCounters((prev) => ({
          speed: prev.speed >= 400 ? 400 : prev.speed + 20,
          cost: prev.cost >= 0.0005 ? 0.0005 : prev.cost + 0.00005,
          efficiency: prev.efficiency >= 99.9 ? 99.9 : prev.efficiency + 5,
        }));
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isInView]);

  const codeSnippets: {
    [key in "performance" | "security" | "scalability"]: string;
  } = {
    performance: `// AutoSOL Smart Contract (simplified)
import { Program } from '@project-serum/anchor';

// Create a recurring payment
async function createRecurringPayment(
  sender: PublicKey,
  recipient: PublicKey,
  amount: number,
  interval: number, // in seconds
  startTime: number, // unix timestamp
) {
  return await program.methods
    .createRecurringPayment(
      recipient,
      new BN(amount),
      new BN(interval),
      new BN(startTime)
    )
    .accounts({
      sender,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}`,
    security: `// AutoSOL Security Implementation
import { verify } from '@solana/web3.js';

// Verify transaction signature
async function verifyPaymentExecution(
  signature: string,
  expectedSender: PublicKey,
  expectedRecipient: PublicKey,
  expectedAmount: number
) {
  const tx = await connection.getTransaction(signature);
  
  // Verify sender and recipient
  const isValid = 
    tx.transaction.message.accountKeys[0].equals(expectedSender) && 
    tx.transaction.message.accountKeys[1].equals(expectedRecipient) &&
    tx.meta.postBalances[1] - tx.meta.preBalances[1] === expectedAmount;
    
  return {
    valid: isValid,
    timestamp: tx.blockTime,
    blockHeight: tx.slot
  };
}`,
    scalability: `// AutoSOL Batching Implementation
import { TransactionInstruction, Transaction } from '@solana/web3.js';

// Process multiple recurring payments in a single transaction
async function batchProcessPayments(
  paymentIds: string[],
  processor: PublicKey
) {
  const instructions = [];
  
  for (const paymentId of paymentIds) {
    instructions.push(
      program.instruction.processPayment(
        new PublicKey(paymentId),
        {
          accounts: {
            processor,
            payment: new PublicKey(paymentId),
            systemProgram: SystemProgram.programId,
          }
        }
      )
    );
  }
  
  // Create and send transaction with all instructions
  const transaction = new Transaction().add(...instructions);
  return await sendAndConfirmTransaction(connection, transaction, [processorKeypair]);
}`,
  };

  const features = {
    performance: [
      "Sub-second confirmation times",
      "Transaction costs under $0.001",
      "Parallel transaction processing",
      "Optimized contract execution",
    ],
    security: [
      "Audited smart contracts",
      "Multi-signature authorizations",
      "Fraud detection algorithms",
      "Secure key management",
    ],
    scalability: [
      "Carbon-neutral blockchain operations",
      "Handles 50,000+ TPS",
      "Automated load balancing",
      "Horizontal scaling architecture",
    ],
  };

  const iconComponents = {
    performance: <Zap className="h-5 w-5" />,
    security: <Shield className="h-5 w-5" />,
    scalability: <Droplet className="h-5 w-5" />,
  };

  return (
    <section
      id="technical"
      className="py-24 bg-gradient-to-b from-dark-200 to-dark-300"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-block mb-4 px-3 py-1 bg-[#6E56CF]/10 rounded-full">
            <span className="text-sm font-medium text-[#6E56CF]">
              Built on Solana
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-space bg-clip-text text-transparent bg-gradient-to-r from-[#6E56CF] to-[#10B981] mb-4 font-bold">
            Technical Excellence
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            Unparalleled speed, security, and cost-efficiency for your recurring
            payments
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-dark-100/40 backdrop-blur-sm p-6 rounded-2xl border border-white/5 shadow-xl"
          >
            <Tabs
              defaultValue="performance"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid grid-cols-3 mb-6 bg-dark-300/50">
                <TabsTrigger
                  value="performance"
                  className="data-[state=active]:bg-[#6E56CF]/20 data-[state=active]:text-[#6E56CF]"
                >
                  Performance
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="data-[state=active]:bg-[#6E56CF]/20 data-[state=active]:text-[#6E56CF]"
                >
                  Security
                </TabsTrigger>
                <TabsTrigger
                  value="scalability"
                  className="data-[state=active]:bg-[#6E56CF]/20 data-[state=active]:text-[#6E56CF]"
                >
                  Scalability
                </TabsTrigger>
              </TabsList>

              {Object.keys(codeSnippets).map((key) => (
                <TabsContent key={key} value={key} className="space-y-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={key}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <div className="absolute top-0 right-0 bg-dark-300/80 px-3 py-1.5 rounded-bl-lg rounded-tr-lg text-white/70 text-xs flex items-center">
                        <Code className="h-3.5 w-3.5 mr-1.5" />
                        TypeScript
                      </div>
                      <div className="glass p-6 rounded-xl bg-dark-400/80 border border-white/5 overflow-hidden">
                        <pre className="text-sm overflow-x-auto text-white/90">
                          <code className="language-typescript">
                            {
                              codeSnippets[
                                key as
                                  | "performance"
                                  | "security"
                                  | "scalability"
                              ]
                            }
                          </code>
                        </pre>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-white font-space flex items-center">
                      {iconComponents[key as keyof typeof iconComponents]}
                      <span className="ml-2">
                        {key.charAt(0).toUpperCase() + key.slice(1)} Optimized
                      </span>
                    </h3>
                    <p className="text-white/70">
                      AutoSOL leverages Solana&apos;s high-performance
                      blockchain to deliver lightning-fast, low-cost recurring
                      payments. Our smart contracts are optimized for efficiency
                      and security.
                    </p>
                    <ul className="space-y-2">
                      {features[key as keyof typeof features].map(
                        (feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#6E56CF] to-[#10B981] flex items-center justify-center mt-1 flex-shrink-0">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M10 3L4.5 8.5L2 6"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                            <span className="text-white/70">{feature}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="mt-6">
              <Button
                variant="outline"
                className="border-[#6E56CF] text-[#6E56CF] hover:bg-[#6E56CF]/20 hover:text-white group"
              >
                View Technical Documentation
                <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onViewportEnter={() => setIsInView(true)}
            className="space-y-8"
          >
            <div className="glass p-6 shadow-xl relative overflow-hidden bg-dark-100/40 backdrop-blur-sm rounded-2xl border border-white/5">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6E56CF] to-[#10B981]"></div>
              <h3 className="text-xl font-bold text-white mb-6 font-space">
                Performance Metrics
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Transaction Speed</span>
                    <motion.span
                      className="font-medium text-white"
                      key={counters.speed}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {counters.speed}ms
                    </motion.span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-[#6E56CF] to-[#6E56CF]/70 h-2.5 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "95%" }}
                      transition={{
                        duration: 1.5,
                        delay: 0.3,
                        ease: "easeOut",
                      }}
                    ></motion.div>
                  </div>
                  <div className="flex justify-between text-xs text-white/50">
                    <span>Solana (AutoSOL)</span>
                    <span>Ethereum (15sec)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Transaction Cost</span>
                    <motion.span
                      className="font-medium text-white"
                      key={counters.cost}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      ${counters.cost.toFixed(4)}
                    </motion.span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-[#10B981] to-[#10B981]/70 h-2.5 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "98%" }}
                      transition={{
                        duration: 1.5,
                        delay: 0.5,
                        ease: "easeOut",
                      }}
                    ></motion.div>
                  </div>
                  <div className="flex justify-between text-xs text-white/50">
                    <span>Solana (AutoSOL)</span>
                    <span>Ethereum ($5-$20)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Energy Efficiency</span>
                    <motion.span
                      className="font-medium text-white"
                      key={counters.efficiency}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {counters.efficiency.toFixed(1)}%
                    </motion.span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-[#6E56CF] to-[#10B981] h-2.5 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "90%" }}
                      transition={{
                        duration: 1.5,
                        delay: 0.7,
                        ease: "easeOut",
                      }}
                    ></motion.div>
                  </div>
                  <div className="flex justify-between text-xs text-white/50">
                    <span>Solana (AutoSOL)</span>
                    <span>Bitcoin</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                className="glass p-6 shadow-md bg-dark-100/40 backdrop-blur-sm rounded-2xl border border-white/5 relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="absolute -right-8 -top-8 w-16 h-16 rounded-full bg-[#6E56CF]/10"></div>
                <div className="text-[#6E56CF] mb-3">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 6V12L16 14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <motion.h4
                  className="font-bold text-3xl text-white font-space"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                >
                  {isInView ? "400ms" : "---"}
                </motion.h4>
                <p className="text-white/70">Average Transaction Time</p>
              </motion.div>

              <motion.div
                className="glass p-6 shadow-md bg-dark-100/40 backdrop-blur-sm rounded-2xl border border-white/5 relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="absolute -right-8 -top-8 w-16 h-16 rounded-full bg-[#10B981]/10"></div>
                <div className="text-[#10B981] mb-3">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 1V23"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <motion.h4
                  className="font-bold text-3xl text-white font-space"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.1 }}
                >
                  {isInView ? "$0.0005" : "---"}
                </motion.h4>
                <p className="text-white/70">Average Transaction Cost</p>
              </motion.div>
            </div>

            <motion.div
              className="glass p-6 shadow-md bg-dark-100/40 backdrop-blur-sm rounded-2xl border border-white/5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h3 className="text-xl font-bold text-white mb-4 font-space">
                Why Choose AutoSOL?
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#6E56CF] to-[#10B981] flex items-center justify-center mt-0.5 flex-shrink-0">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-lg">
                      Lightning Fast
                    </h4>
                    <p className="text-white/70 text-sm">
                      Transactions confirm in milliseconds, not minutes or hours
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#6E56CF] to-[#10B981] flex items-center justify-center mt-0.5 flex-shrink-0">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-lg">
                      Practically Free
                    </h4>
                    <p className="text-white/70 text-sm">
                      Transaction fees are a fraction of a cent, saving you
                      money
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#6E56CF] to-[#10B981] flex items-center justify-center mt-0.5 flex-shrink-0">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-lg">
                      Planet Friendly
                    </h4>
                    <p className="text-white/70 text-sm">
                      Energy-efficient blockchain with minimal environmental
                      impact
                    </p>
                  </div>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
