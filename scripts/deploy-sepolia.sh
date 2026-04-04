#!/bin/bash
# Deploy to Sepolia testnet

set -e

echo "🚀 Deploying to Sepolia Testnet"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "   Copy .env.example to .env and configure it"
    exit 1
fi

# Source .env
export $(grep -v '^#' .env | xargs)

# Validate configuration
ERRORS=0

# Determine which key to use (SEPOLIA_PRIVATE_KEY or SEPOLIA_MNEMONIC)
if [ ! -z "$SEPOLIA_MNEMONIC" ] && [ "$SEPOLIA_MNEMONIC" != "your twelve word mnemonic phrase here" ]; then
    # Derive private key from mnemonic (account 0)
    echo "🔑 Deriving key from mnemonic..."
    DEPLOY_KEY=$(cast wallet derive-private-key "$SEPOLIA_MNEMONIC" 0)
    KEY_SOURCE="mnemonic (account 0)"
elif [ ! -z "$SEPOLIA_PRIVATE_KEY" ] && [ "$SEPOLIA_PRIVATE_KEY" != "your_sepolia_private_key_here" ]; then
    # Use explicit private key
    DEPLOY_KEY="$SEPOLIA_PRIVATE_KEY"
    KEY_SOURCE="SEPOLIA_PRIVATE_KEY"
else
    echo "❌ Error: No Sepolia key configured"
    echo "   Set either SEPOLIA_PRIVATE_KEY or SEPOLIA_MNEMONIC in .env"
    echo ""
    echo "   Option 1 - Private Key:"
    echo "     SEPOLIA_PRIVATE_KEY=0x..."
    echo ""
    echo "   Option 2 - Mnemonic (more secure):"
    echo "     SEPOLIA_MNEMONIC=\"word1 word2 ... word12\""
    echo ""
    echo "   ⚠️  DO NOT use the default Anvil test key!"
    ERRORS=$((ERRORS + 1))
fi

# Validate that we're not using the Anvil default key
if [ "$DEPLOY_KEY" = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" ]; then
    echo "❌ Error: Cannot use Anvil default test key for Sepolia!"
    echo "   This key is public and shared by all developers."
    echo "   Use your own testnet key or mnemonic."
    ERRORS=$((ERRORS + 1))
fi

if [ -z "$SEPOLIA_RPC_URL" ] || [ "$SEPOLIA_RPC_URL" = "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY" ]; then
    echo "❌ Error: SEPOLIA_RPC_URL not configured"
    echo "   Get a free API key from https://www.alchemy.com/ or https://infura.io/"
    ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo "Please fix the errors above and try again."
    exit 1
fi

# Show wallet address
WALLET_ADDRESS=$(cast wallet address "$DEPLOY_KEY")
echo "📍 Deploying from: $WALLET_ADDRESS"
echo "🔑 Key source: $KEY_SOURCE"

# Check balance
BALANCE=$(cast balance "$WALLET_ADDRESS" --rpc-url "$SEPOLIA_RPC_URL")
BALANCE_ETH=$(cast --to-unit "$BALANCE" ether)
echo "💰 Balance: $BALANCE_ETH ETH"

if [ "$(echo "$BALANCE_ETH < 0.01" | bc)" -eq 1 ]; then
    echo ""
    echo "⚠️  Warning: Low balance!"
    echo "   You may need testnet ETH from:"
    echo "   • https://sepoliafaucet.com/"
    echo "   • https://www.alchemy.com/faucets/ethereum-sepolia"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🔨 Building contracts..."
forge build --silent

echo "📦 Deploying to Sepolia..."
echo ""

# Deploy with verification if ETHERSCAN_API_KEY is set
if [ ! -z "$ETHERSCAN_API_KEY" ] && [ "$ETHERSCAN_API_KEY" != "your_etherscan_api_key" ]; then
    echo "   (with Etherscan verification)"
    PRIVATE_KEY="$DEPLOY_KEY" forge script script/Deploy.s.sol:DeployScript \
        --rpc-url "$SEPOLIA_RPC_URL" \
        --broadcast \
        --verify \
        --etherscan-api-key "$ETHERSCAN_API_KEY"
else
    echo "   (without verification - set ETHERSCAN_API_KEY to verify)"
    PRIVATE_KEY="$DEPLOY_KEY" forge script script/Deploy.s.sol:DeployScript \
        --rpc-url "$SEPOLIA_RPC_URL" \
        --broadcast
fi

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "Next steps:"
echo "1. Copy the contract address from above"
echo "2. Update .env:"
echo "   NEXT_PUBLIC_STEALTH_PAYMENT_ADDRESS=0x..."
echo "3. Run the frontend:"
echo "   pnpm dev"
echo ""
