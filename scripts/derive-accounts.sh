#!/bin/bash
# Derive accounts from a mnemonic phrase
# Usage: ./derive-accounts.sh "your twelve word mnemonic" [count]

if [ -z "$1" ]; then
    echo "Usage: ./scripts/derive-accounts.sh \"your mnemonic phrase\" [count]"
    echo ""
    echo "Example:"
    echo "  ./scripts/derive-accounts.sh \"test test test test test test test test test test test junk\" 5"
    echo ""
    echo "This will show the first 5 accounts derived from the mnemonic."
    exit 1
fi

MNEMONIC="$1"
COUNT="${2:-3}"  # Default to 3 accounts

echo "🔑 Deriving Accounts from Mnemonic"
echo "=================================="
echo ""

for i in $(seq 0 $((COUNT - 1))); do
    echo "Account $i:"
    
    # Derive private key
    PRIVATE_KEY=$(cast wallet derive-private-key "$MNEMONIC" $i 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        echo "  ❌ Error: Invalid mnemonic"
        exit 1
    fi
    
    # Get address
    ADDRESS=$(cast wallet address "$PRIVATE_KEY")
    
    echo "  Address:     $ADDRESS"
    echo "  Private Key: $PRIVATE_KEY"
    
    # Check if this is the Anvil default
    if [ "$PRIVATE_KEY" = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" ]; then
        echo "  ⚠️  This is the Anvil default test account"
    fi
    
    echo ""
done

echo "💡 To use account 0 for Sepolia deployment, add to .env:"
echo "   SEPOLIA_MNEMONIC=\"$MNEMONIC\""
echo ""
echo "⚠️  Never commit real mnemonics to version control!"
