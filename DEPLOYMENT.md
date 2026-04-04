# Deployment Guide

## Prerequisites

1. **Foundry** installed
2. **Node.js** v18+
3. **pnpm** installed (`npm install -g pnpm`)
4. **Sepolia ETH** for gas
4. **WalletConnect Project ID** from https://cloud.walletconnect.com/
5. **RPC URL** from Alchemy or Infura

## Installing pnpm

If you don't have pnpm installed:

```bash
npm install -g pnpm
```

See [PNPM.md](PNPM.md) for more details.

## Step 1: Setup Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# FOR LOCAL TESTING (already configured, safe to use)
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# FOR SEPOLIA DEPLOYMENT (use YOUR testnet key!)
# Option 1: Mnemonic (recommended - more secure)
SEPOLIA_MNEMONIC="your twelve word testnet mnemonic phrase here"

# Option 2: Private key directly
# SEPOLIA_PRIVATE_KEY=0xyour_actual_testnet_private_key

# RPC URLs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Etherscan API key (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key

# WalletConnect Project ID (REQUIRED for frontend)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Unlink API (optional)
UNLINK_API_KEY=your_unlink_api_key
```

**Important:** This project uses **separate keys** for local and testnet deployment:
- `PRIVATE_KEY` = Local Anvil testing (default test key is safe)
- `SEPOLIA_MNEMONIC` or `SEPOLIA_PRIVATE_KEY` = Real Sepolia deployment (**your key**)

See [KEY_MANAGEMENT.md](KEY_MANAGEMENT.md) for detailed security guidance.

**Check Your Configuration:**
```bash
make check-accounts
```

## Step 2: Install Dependencies

```bash
make install
```

This will:
- Install Foundry dependencies (forge-std)
- Install Node.js dependencies

## Step 3: Build Contracts

```bash
make build
```

Verify no compilation errors.

## Step 4: Run Tests

```bash
make test
```

All tests should pass.

## Step 5: Deploy Contracts

### To Sepolia Testnet

```bash
make deploy
```

This will:
1. Deploy StealthPayment contract
2. Verify on Etherscan
3. Output the contract address

Example output:
```
StealthPayment deployed at: 0x1234567890123456789012345678901234567890
```

### To Local Network (for development)

#### Option A: Local Anvil (fresh state)

```bash
# Terminal 1: Start local blockchain
make anvil

# Terminal 2: Deploy
make deploy-local
```

#### Option B: Anvil Fork (with Sepolia state)

**Recommended for testing** - Forks Sepolia so you get real ENS contracts and state, but can reset/iterate quickly without gas costs.

```bash
# Terminal 1: Start Anvil forking Sepolia
make anvil-fork

# Terminal 2: Deploy to the fork
make deploy-fork
```

**Benefits:**
- ✅ No testnet ETH needed (Anvil gives you unlimited ETH)
- ✅ Instant transactions (no waiting for block confirmations)
- ✅ Can reset state anytime (just restart Anvil)
- ✅ Access real Sepolia contracts (ENS, tokens, etc.)
- ✅ Test with realistic state without re-deploying

**Usage Tips:**
- Deploy your contracts once to the fork
- Update `.env` with the local address: `NEXT_PUBLIC_STEALTH_PAYMENT_ADDRESS=0x...`
- Run `pnpm dev` to test against fork
- Restart Anvil anytime to reset state (you'll need to re-deploy)

## Step 6: Configure Frontend

Update `.env` with deployed contract address:

```bash
NEXT_PUBLIC_STEALTH_PAYMENT_ADDRESS=0x1234567890123456789012345678901234567890
```

## Step 7: Run Frontend

```bash
make dev
```

Open http://localhost:3000

## Step 8: Test E2E Flow

### Create Merchant

1. Go to `/merchant/create`
2. Enter name: "testmerchant"
3. Click "Generate Keys"
4. Download keys JSON
5. Copy public keys

### Configure ENS (Optional)

If you have an ENS name:
1. Go to https://app.ens.domains
2. Manage your name
3. Add text records:
   - `stealth:spend` = (spend public key)
   - `stealth:view` = (view public key)

### Make Payment

1. Go to `/pay/testmerchant.enstealth.eth`
2. Choose WalletConnect method
3. Connect wallet (MetaMask on Sepolia)
4. Enter amount (e.g., 0.01 ETH)
5. Click "Send Payment"
6. Confirm transaction

### Withdraw Funds

1. Go to `/merchant/withdraw`
2. Upload keys JSON file
3. Click "Scan Blockchain"
4. View detected payments
5. Click "Withdraw to Connected Wallet"

## Production Deployment

### Frontend (Vercel/Netlify)

1. Push to GitHub
2. Connect to Vercel/Netlify
3. Add environment variables:
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - `NEXT_PUBLIC_STEALTH_PAYMENT_ADDRESS`
4. Deploy

### Contracts (Mainnet)

⚠️ **WARNING**: Audit code before mainnet deployment!

1. Get mainnet ETH for gas
2. Update `.env` with mainnet RPC
3. Deploy:
   ```bash
   forge script script/Deploy.s.sol:DeployScript \
     --rpc-url mainnet \
     --broadcast \
     --verify
   ```

## Troubleshooting

### "Invalid API key"
- Verify Alchemy/Infura API key
- Check RPC URL format

### "Insufficient funds"
- Get Sepolia ETH from faucet
- Ensure wallet has enough for gas

### "Contract verification failed"
- Check Etherscan API key
- Wait a few minutes and verify manually

### Verification Manual Steps

```bash
forge verify-contract \
  --chain-id 11155111 \
  --num-of-optimizations 200 \
  --compiler-version v0.8.24 \
  <CONTRACT_ADDRESS> \
  contracts/StealthPayment.sol:StealthPayment \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## Monitoring

### View Contract

- Sepolia: https://sepolia.etherscan.io/address/<CONTRACT_ADDRESS>
- Mainnet: https://etherscan.io/address/<CONTRACT_ADDRESS>

### View Events

```bash
# Get events from contract
cast logs --address <CONTRACT_ADDRESS> \
  --rpc-url sepolia \
  "StealthAnnouncement(bytes32,bytes32,address,uint256,address)"
```

## Updating Contracts

If you need to update the contract:

1. Make changes to `contracts/StealthPayment.sol`
2. Run tests: `make test`
3. Deploy new version: `make deploy`
4. Update frontend `.env` with new address
5. Redeploy frontend

## Security Checklist

- [ ] Never commit `.env` file
- [ ] Use hardware wallet for production deployments
- [ ] Audit contract code before mainnet
- [ ] Test thoroughly on testnet
- [ ] Document all contract addresses
- [ ] Backup deployment keys
- [ ] Monitor contract for unexpected behavior
- [ ] Set up alerting for large transactions

## Support

For issues:
1. Check console logs
2. View Etherscan transaction
3. Run tests locally
4. Review contract events

Happy deploying! 🚀
