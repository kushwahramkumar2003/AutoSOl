#!/bin/bash

echo "🚀 Setting up Solana environment for testing..."

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install it first:"
    echo "sh -c \"\$(curl -sSfL https://release.solana.com/v1.17.0/install)\""
    exit 1
fi

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI not found. Please install it first:"
    echo "cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    echo "avm install latest"
    echo "avm use latest"
    exit 1
fi

echo "✅ Solana and Anchor CLI found"

# Set Solana to devnet
echo "🌐 Setting Solana cluster to devnet..."
solana config set --url https://api.devnet.solana.com

# Check if wallet exists, if not create one
if [ ! -f ~/.config/solana/id.json ]; then
    echo "🔑 Creating new Solana wallet..."
    solana-keygen new --outfile ~/.config/solana/id.json --no-bip39-passphrase
else
    echo "✅ Solana wallet found"
fi

# Show wallet address
WALLET_ADDRESS=$(solana address)
echo "💳 Your wallet address: $WALLET_ADDRESS"

# Check wallet balance
BALANCE=$(solana balance)
echo "💰 Current balance: $BALANCE"

# Airdrop SOL if balance is low
if [[ "$BALANCE" == "0 SOL" ]]; then
    echo "💸 Requesting airdrop..."
    solana airdrop 2
    sleep 5
    echo "💰 New balance: $(solana balance)"
fi

echo "📋 Setup checklist:"
echo "✅ Solana CLI configured for devnet"
echo "✅ Wallet created/found: $WALLET_ADDRESS"
echo "✅ SOL balance: $(solana balance)"

echo ""
echo "🔧 Next steps:"
echo "1. Build your program: anchor build"
echo "2. Deploy to devnet: anchor deploy"
echo "3. Run tests: anchor test --skip-local-validator"
echo ""
echo "📚 Important notes:"
echo "- Make sure your program ID in lib.rs matches Anchor.toml"
echo "- Update HTTP_BACKEND_WALLET in your program to a test wallet you control"
echo "- For USDC testing, get devnet USDC from: https://spl-token-faucet.com/"
echo "- Your wallet needs SOL for transaction fees and rent"

echo ""
echo "🎯 To test with tokens:"
echo "1. Go to https://spl-token-faucet.com/"
echo "2. Select 'Devnet' and 'USDC'"
echo "3. Enter your wallet address: $WALLET_ADDRESS"
echo "4. Request tokens"