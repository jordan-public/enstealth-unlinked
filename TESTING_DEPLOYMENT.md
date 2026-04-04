# Testing Deployment - Quick Guide

## ✅ What We Just Tested

Successfully deployed StealthPayment contract to local Anvil:
- **Contract Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Network**: Local Anvil (Chain ID: 31337)
- **Status**: ✅ Working

## 🚀 Three Deployment Options

### 1. Test with Anvil (No Fork) - TESTED ✅

**Best for**: Quick local testing without external dependencies

```bash
# Automated test script
make test-anvil

# Manual steps
make anvil                    # Terminal 1
make deploy-local             # Terminal 2
```

**Features**:
- ✅ No external RPC needed
- ✅ Instant setup (<5 seconds)
- ✅ 10,000 ETH test accounts
- ⚠️ No access to real Sepolia contracts (ENS, etc.)

---

### 2. Test with Anvil Fork - READY TO TEST

**Best for**: Realistic testing with Sepolia state

```bash
# Automated test script (checks .env configuration)
make test-fork

# Manual steps
make anvil-fork               # Terminal 1: requires SEPOLIA_RPC_URL in .env
make deploy-fork              # Terminal 2
```

**Requirements**:
1. Get free Sepolia RPC URL from [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)
2. Update `.env`:
   ```bash
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   ```

**Features**:
- ✅ Access real Sepolia contracts (ENS!)
- ✅ No testnet ETH needed
- ✅ Instant transactions
- ✅ Can reset/iterate quickly

---

### 3. Deploy to Sepolia Testnet - READY

**Best for**: Final testing before mainnet

```bash
# Automated deployment script (validates configuration)
make deploy
# or
./scripts/deploy-sepolia.sh
```

**Requirements**:

1. **Get Testnet ETH** (0.01+ ETH recommended):
   - [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
   - [Sepolia Faucet](https://sepoliafaucet.com/)

2. **Update `.env`** with your wallet:
   ```bash
   PRIVATE_KEY=0xyour_actual_private_key_here  # ⚠️ Replace Anvil test key!
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   ETHERSCAN_API_KEY=your_key  # Optional, for verification
   ```

3. **Deploy**:
   ```bash
   make deploy
   ```

The script will:
- ✅ Validate your configuration
- ✅ Check your wallet balance
- ✅ Deploy and verify on Etherscan (if API key provided)
- ✅ Show next steps

**Features**:
- ✅ Real testnet environment
- ✅ Persistent deployment
- ✅ Etherscan verification
- ⚠️ Requires testnet ETH
- ⚠️ ~12 second block times

---

## 📝 Configuration Checklist

### For Local Testing (Option 1 - No Fork)
- [x] Nothing needed - works out of the box!

### For Anvil Fork (Option 2)
- [ ] Get Sepolia RPC URL from Alchemy/Infura
- [ ] Update `SEPOLIA_RPC_URL` in `.env`
- [ ] Run `make test-fork`

### For Sepolia Deployment (Option 3)
- [ ] Get testnet ETH from faucet
- [ ] Replace `PRIVATE_KEY` in `.env` with your real wallet
- [ ] Set `SEPOLIA_RPC_URL` in `.env`
- [ ] (Optional) Set `ETHERSCAN_API_KEY` for verification
- [ ] Run `make deploy`

---

## 🔍 Current .env Status

Your `.env` is configured for **local testing**:

```bash
# Currently set for local Anvil testing (safe)
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Need to configure for Sepolia deployment:
SEPOLIA_MNEMONIC="your testnet mnemonic"  # Recommended
# OR
SEPOLIA_PRIVATE_KEY=0x...  # Alternative

# Need RPC URL for fork/Sepolia:
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

**Check Your Configuration:**
```bash
make check-accounts
# or
./scripts/check-accounts.sh
```

This shows:
- ✅ Which account will be used for local testing
- ✅ Which account will be used for Sepolia
- ✅ Current balances (if RPC configured)
- ⚠️ Warnings if using unsafe keys

**Important:** The project uses **separate keys** for local and testnet to avoid security issues. See [KEY_MANAGEMENT.md](KEY_MANAGEMENT.md) for details.

---

## 🎯 Recommended Next Steps

1. **Test Anvil Fork** (if you have RPC URL):
   ```bash
   # Setup
   # 1. Get free Alchemy API key
   # 2. Update SEPOLIA_RPC_URL in .env
   
   # Test
   make test-fork
   ```

2. **Run Frontend** against local deployment:
   ```bash
   # Update .env with contract address
   echo "NEXT_PUBLIC_STEALTH_PAYMENT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3" >> .env
   
   # Start frontend
   pnpm dev
   ```

3. **Deploy to Sepolia** when ready:
   ```bash
   # Verify configuration
   ./scripts/deploy-sepolia.sh
   ```

---

## 📚 Additional Resources

- [LOCAL_DEV.md](LOCAL_DEV.md) - Detailed Anvil fork guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [QUICKREF.md](QUICKREF.md) - Command reference

---

## ❓ Troubleshooting

### "Error: SEPOLIA_RPC_URL not set"
- Get free API key from [Alchemy](https://www.alchemy.com/)
- Update `.env` with your RPC URL

### "Error: insufficient funds"
- Get testnet ETH from faucets (see requirements above)
- Check balance: `cast balance YOUR_ADDRESS --rpc-url $SEPOLIA_RPC_URL`

### "Port 8545 already in use"
- Kill existing Anvil: `kill $(lsof -t -i:8545)`
- Restart with fresh instance

### Contract not verified on Etherscan
- Make sure `ETHERSCAN_API_KEY` is set in `.env`
- Get free key from [Etherscan](https://etherscan.io/apis)
