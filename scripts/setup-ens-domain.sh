#!/bin/bash

# Setup ENS domain for ENStealthRegistrar
# This script configures enstealth.eth and transfers it to the registrar

set -e

echo "🔧 Setting up enstealth.eth for ENStealthRegistrar"
echo "=================================================="
echo ""

# Check required env vars
if [ -z "$SEPOLIA_PRIVATE_KEY" ]; then
    echo "❌ Error: SEPOLIA_PRIVATE_KEY not set in .env"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_ENS_REGISTRAR_ADDRESS" ]; then
    echo "❌ Error: NEXT_PUBLIC_ENS_REGISTRAR_ADDRESS not set in .env"
    exit 1
fi

echo "📋 Configuration:"
echo "  Network: Sepolia"
echo "  Owner Address: 0x823eF872d97f3Cffd1e3D491c9560EB0D3886D56"
echo "  Registrar: $NEXT_PUBLIC_ENS_REGISTRAR_ADDRESS"
echo ""

# Deploy and run setup script
forge script script/SetupENS.s.sol:SetupENSScript \
    --rpc-url $SEPOLIA_RPC_URL \
    --broadcast \
    --verify \
    -vvvv

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update .env with deployed registrar address"
echo "  2. Run: pnpm dev"
echo "  3. Test merchant creation: http://localhost:3000/merchant/create"
