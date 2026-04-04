#!/bin/bash
# Test Anvil deployment with Sepolia fork

set -e

echo "🧪 Testing Anvil Deployment (Sepolia Fork)"
echo "=========================================="
echo ""

# Check if .env exists and source it
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "   Copy .env.example to .env and add your SEPOLIA_RPC_URL"
    exit 1
fi

# Source .env
export $(grep -v '^#' .env | xargs)

# Check if SEPOLIA_RPC_URL is set
if [ -z "$SEPOLIA_RPC_URL" ] || [ "$SEPOLIA_RPC_URL" = "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY" ]; then
    echo "❌ Error: SEPOLIA_RPC_URL not configured in .env"
    echo ""
    echo "To use Anvil fork, you need a Sepolia RPC URL:"
    echo "1. Get a free API key from https://www.alchemy.com/"
    echo "2. Update SEPOLIA_RPC_URL in .env"
    echo ""
    echo "Alternatively, use plain Anvil (no fork):"
    echo "  ./scripts/test-anvil.sh"
    exit 1
fi

# Check if Anvil is already running
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 8545 already in use. Stopping existing process..."
    kill $(lsof -t -i:8545) 2>/dev/null || true
    sleep 2
fi

# Start Anvil with fork
echo "🚀 Starting Anvil (forking Sepolia)..."
echo "   This may take a moment to download chain state..."
anvil --fork-url "$SEPOLIA_RPC_URL" --chain-id 11155111 > /tmp/anvil-fork.log 2>&1 &
ANVIL_PID=$!
sleep 5

# Deploy contract
echo "📦 Deploying StealthPayment contract to fork..."
forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast --silent

echo ""
echo "✅ Deployment Successful!"
echo "📍 Contract Address: Check the logs above"
echo "🔗 RPC URL: http://localhost:8545"
echo "🌐 Forked from: Sepolia"
echo "🔑 Test Account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo ""
echo "💡 Benefits of fork:"
echo "   • Access real Sepolia contracts (ENS, etc.)"
echo "   • No testnet ETH needed"
echo "   • Instant transactions"
echo "   • Can reset anytime"
echo ""
echo "To stop Anvil fork:"
echo "  kill $ANVIL_PID"
echo ""
echo "Anvil fork is running in background (PID: $ANVIL_PID)"
