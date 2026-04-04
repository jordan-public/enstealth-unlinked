#!/bin/bash
# Test Anvil deployment (no fork)

set -e

echo "🧪 Testing Anvil Deployment (No Fork)"
echo "======================================"
echo ""

# Check if Anvil is already running
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 8545 already in use. Stopping existing process..."
    kill $(lsof -t -i:8545) 2>/dev/null || true
    sleep 2
fi

# Start Anvil
echo "🚀 Starting Anvil..."
anvil > /tmp/anvil.log 2>&1 &
ANVIL_PID=$!
sleep 3

# Deploy contract
echo "📦 Deploying StealthPayment contract..."
forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast --silent

# Extract deployed address
CONTRACT_ADDRESS=$(grep "StealthPayment deployed at:" /tmp/anvil.log || forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 | grep "deployed at:" | awk '{print $NF}')

echo ""
echo "✅ Deployment Successful!"
echo "📍 Contract Address: Check the logs above"
echo "🔗 RPC URL: http://localhost:8545"
echo "🔑 Test Account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo ""
echo "To stop Anvil:"
echo "  kill $ANVIL_PID"
echo ""
echo "Anvil is running in background (PID: $ANVIL_PID)"
