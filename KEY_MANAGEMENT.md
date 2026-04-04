# Key Management Guide

## Overview

This project uses **separate keys** for local development and testnet deployment to ensure security and avoid conflicts with other developers.

## Key Separation Strategy

| Purpose | Key Variable | Usage | Security Level |
|---------|--------------|-------|----------------|
| **Local Anvil** | `PRIVATE_KEY` | Local testing only | ✅ Public test key (safe) |
| **Sepolia Testnet** | `SEPOLIA_PRIVATE_KEY` or `SEPOLIA_MNEMONIC` | Real testnet deployment | ⚠️ Your private key (SECURE!) |

## Why Separate Keys?

### ❌ Bad Practice (Single Key)
```bash
# DON'T do this:
PRIVATE_KEY=0xac0974...  # Anvil default
# Then deploy to Sepolia with same key
```

**Problems:**
- Anvil's default keys are **publicly known** and shared by all developers
- Anyone can drain funds from these addresses on real networks
- Creates security vulnerabilities
- Can conflict with other developers using the same keys

### ✅ Good Practice (Separate Keys)
```bash
# For local testing - Anvil default is fine
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# For Sepolia - YOUR testnet key
SEPOLIA_MNEMONIC="your unique twelve word mnemonic phrase here"
```

**Benefits:**
- Local testing uses safe, disposable keys
- Testnet keys are private and secure
- No risk of key conflicts
- Better security isolation

---

## Configuration

### 1. Local Anvil Testing (Already Set Up ✅)

Your `.env` already has this configured:

```bash
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

This is the **standard Anvil test account** that owns:
- Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Balance: 10,000 ETH (on local Anvil)
- Safe to use for local development

### 2. Sepolia Testnet (Need to Configure)

You have **two options** for Sepolia deployment:

#### Option A: Use Mnemonic (Recommended) 🌟

**Advantages:**
- More secure (can derive multiple accounts)
- Common standard (most wallets use mnemonics)
- Easier to backup
- Can use the same mnemonic for multiple projects

**Setup:**
```bash
# In .env, add your testnet mnemonic:
SEPOLIA_MNEMONIC="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
```

The deploy script will automatically derive account 0 from this mnemonic.

#### Option B: Use Private Key Directly

**Setup:**
```bash
# In .env, add your private key:
SEPOLIA_PRIVATE_KEY=0xyour_actual_sepolia_private_key_here
```

---

## Helper Scripts

### Check Current Configuration

See which accounts are configured:

```bash
./scripts/check-accounts.sh
```

**Output:**
```
🔑 Account Configuration
========================

📍 LOCAL ANVIL TESTING:
   Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 ✅
   Source:  Default Anvil test account (safe for local use)

📍 SEPOLIA TESTNET DEPLOYMENT:
   Address: 0xYourSepoliaAddress ✅
   Source:  SEPOLIA_MNEMONIC (account 0)
   Balance: 0.5 ETH
```

### Derive Accounts from Mnemonic

If you have a mnemonic, see which accounts it generates:

```bash
./scripts/derive-accounts.sh "your twelve word phrase" 5
```

This shows the first 5 accounts (with addresses and private keys) derived from your mnemonic.

---

## Step-by-Step: Setting Up Your Testnet Key

### If You Have a Testnet Wallet (MetaMask, etc.)

1. **Export Your Mnemonic**:
   - MetaMask: Settings → Security & Privacy → Reveal Secret Recovery Phrase
   - Write it down securely

2. **Add to `.env`**:
   ```bash
   SEPOLIA_MNEMONIC="your actual twelve word phrase here"
   ```

3. **Verify**:
   ```bash
   ./scripts/check-accounts.sh
   ```

4. **Get Testnet ETH**:
   - Visit [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
   - Send to the address shown by check-accounts.sh

### If You Need a New Testnet Key

1. **Generate a New Mnemonic**:
   ```bash
   cast wallet new-mnemonic
   ```

2. **Save It Securely** (write it down!)

3. **Add to `.env`**:
   ```bash
   SEPOLIA_MNEMONIC="the generated mnemonic phrase"
   ```

4. **Check the Address**:
   ```bash
   ./scripts/check-accounts.sh
   ```

5. **Fund It**:
   - Get testnet ETH from faucet
   - Send to the displayed address

---

## Security Best Practices

### ✅ Do:
- Use separate keys for local and testnet
- Use mnemonics when possible (more flexible)
- Keep real private keys in `.env` (which is gitignored)
- Write down your mnemonic on paper (backup)
- Use hardware wallets for mainnet
- Regularly check account balances

### ❌ Don't:
- Use Anvil default keys on Sepolia/mainnet
- Commit real private keys to git
- Share your mnemonic with anyone
- Use the same key across multiple projects (if possible)
- Store mnemonics in cloud services without encryption

---

## How It Works

### Local Testing
```bash
make test-anvil
# Uses: PRIVATE_KEY (Anvil default)
# Address: 0xf39Fd...
# Network: Local Anvil
```

### Anvil Fork Testing
```bash
make anvil-fork    # Terminal 1
make deploy-fork   # Terminal 2
# Uses: PRIVATE_KEY (Anvil default)
# Address: 0xf39Fd...
# Network: Forked Sepolia (local)
```

### Sepolia Deployment
```bash
make deploy
# Uses: SEPOLIA_PRIVATE_KEY or SEPOLIA_MNEMONIC
# Address: Your testnet address
# Network: Real Sepolia testnet
```

The deployment script **automatically**:
1. Checks if you're using a Sepolia-specific key
2. Rejects Anvil default keys for Sepolia
3. Derives key from mnemonic if provided
4. Validates balance before deploying

---

## Troubleshooting

### "Cannot use Anvil default key for Sepolia"

You tried to deploy to Sepolia without setting a Sepolia key.

**Fix:**
```bash
# Add to .env:
SEPOLIA_MNEMONIC="your testnet mnemonic"
# OR
SEPOLIA_PRIVATE_KEY=0xyour_sepolia_key
```

### "No Sepolia key configured"

Neither `SEPOLIA_PRIVATE_KEY` nor `SEPOLIA_MNEMONIC` is set in `.env`.

**Fix:**
```bash
# Check what's configured:
./scripts/check-accounts.sh

# Add one of these to .env:
SEPOLIA_MNEMONIC="..."
# or
SEPOLIA_PRIVATE_KEY=0x...
```

### "Invalid mnemonic"

The mnemonic phrase is malformed.

**Fix:**
- Ensure it's exactly 12 or 24 words
- Check for typos
- Surround with quotes: `"word1 word2 ..."`

---

## Example Configurations

### Development Only (No Testnet)
```bash
# .env
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

### Ready for Testnet (With Mnemonic)
```bash
# .env
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
SEPOLIA_MNEMONIC="your twelve word testnet phrase here"
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

### Ready for Testnet (With Private Key)
```bash
# .env
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
SEPOLIA_PRIVATE_KEY=0xyour_actual_testnet_private_key
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

---

## Quick Reference

```bash
# Check account configuration
./scripts/check-accounts.sh

# Derive accounts from mnemonic
./scripts/derive-accounts.sh "mnemonic phrase" 3

# Test local deployment (uses PRIVATE_KEY)
make test-anvil

# Deploy to Sepolia (uses SEPOLIA_PRIVATE_KEY/SEPOLIA_MNEMONIC)
make deploy
```

---

## Next Steps

1. ✅ Verify local testing works: `./scripts/check-accounts.sh`
2. 📝 Add your testnet mnemonic to `.env`
3. 💰 Get testnet ETH from faucet
4. ✅ Verify Sepolia config: `./scripts/check-accounts.sh`
5. 🚀 Deploy: `make deploy`

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment guide.
