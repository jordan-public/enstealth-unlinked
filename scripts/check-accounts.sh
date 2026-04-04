#!/bin/bash
# Show which accounts will be used for deployment

echo "🔑 Account Configuration"
echo "========================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

# Source .env
export $(grep -v '^#' .env | xargs)

# Show local Anvil account
echo "📍 LOCAL ANVIL TESTING:"
if [ ! -z "$PRIVATE_KEY" ]; then
    LOCAL_ADDR=$(cast wallet address "$PRIVATE_KEY" 2>/dev/null || echo "Invalid key")
    if [ "$PRIVATE_KEY" = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" ]; then
        echo "   Address: $LOCAL_ADDR ✅"
        echo "   Source:  Default Anvil test account (safe for local use)"
    else
        echo "   Address: $LOCAL_ADDR"
        echo "   Source:  PRIVATE_KEY"
    fi
else
    echo "   ❌ PRIVATE_KEY not set"
fi

echo ""
echo "📍 SEPOLIA TESTNET DEPLOYMENT:"

# Determine Sepolia key
if [ ! -z "$SEPOLIA_MNEMONIC" ] && [ "$SEPOLIA_MNEMONIC" != "your twelve word mnemonic phrase here" ]; then
    # Derive from mnemonic
    SEPOLIA_KEY=$(cast wallet derive-private-key "$SEPOLIA_MNEMONIC" 0 2>/dev/null)
    if [ $? -eq 0 ]; then
        SEPOLIA_ADDR=$(cast wallet address "$SEPOLIA_KEY")
        echo "   Address: $SEPOLIA_ADDR ✅"
        echo "   Source:  SEPOLIA_MNEMONIC (account 0)"
        
        # Show balance if RPC URL is configured
        if [ ! -z "$SEPOLIA_RPC_URL" ] && [ "$SEPOLIA_RPC_URL" != "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY" ]; then
            BALANCE=$(cast balance "$SEPOLIA_ADDR" --rpc-url "$SEPOLIA_RPC_URL" 2>/dev/null || echo "0")
            BALANCE_ETH=$(cast --to-unit "$BALANCE" ether 2>/dev/null || echo "0")
            echo "   Balance: $BALANCE_ETH ETH"
        fi
    else
        echo "   ❌ Invalid SEPOLIA_MNEMONIC"
    fi
elif [ ! -z "$SEPOLIA_PRIVATE_KEY" ] && [ "$SEPOLIA_PRIVATE_KEY" != "your_sepolia_private_key_here" ]; then
    # Use private key
    SEPOLIA_ADDR=$(cast wallet address "$SEPOLIA_PRIVATE_KEY" 2>/dev/null || echo "Invalid key")
    if [ "$SEPOLIA_ADDR" != "Invalid key" ]; then
        echo "   Address: $SEPOLIA_ADDR ✅"
        echo "   Source:  SEPOLIA_PRIVATE_KEY"
        
        # Check if using Anvil default (bad!)
        if [ "$SEPOLIA_PRIVATE_KEY" = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" ]; then
            echo "   ⚠️  WARNING: Using Anvil default key for Sepolia!"
            echo "      This is UNSAFE - use your own testnet key!"
        fi
        
        # Show balance if RPC URL is configured
        if [ ! -z "$SEPOLIA_RPC_URL" ] && [ "$SEPOLIA_RPC_URL" != "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY" ]; then
            BALANCE=$(cast balance "$SEPOLIA_ADDR" --rpc-url "$SEPOLIA_RPC_URL" 2>/dev/null || echo "0")
            BALANCE_ETH=$(cast --to-unit "$BALANCE" ether 2>/dev/null || echo "0")
            echo "   Balance: $BALANCE_ETH ETH"
        fi
    else
        echo "   ❌ Invalid SEPOLIA_PRIVATE_KEY"
    fi
else
    echo "   ❌ No Sepolia key configured"
    echo "      Set SEPOLIA_PRIVATE_KEY or SEPOLIA_MNEMONIC in .env"
fi

echo ""
echo "💡 Tips:"
echo "   • Always use separate keys for local and testnet"
echo "   • Never commit real private keys to git"
echo "   • Use mnemonic for better security (can derive multiple accounts)"
echo ""
