# Local Development with Anvil Fork

This guide shows how to develop and test locally using Anvil's Sepolia fork feature, which gives you the best of both worlds:
- Real Sepolia contract state (ENS, tokens, etc.)
- Instant transactions with no gas costs
- Ability to reset and iterate quickly

## Quick Start

### 1. Setup Environment

Make sure `.env` has your Sepolia RPC URL:

```bash
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_here
```

### 2. Start Anvil Fork

```bash
make anvil-fork
```

This starts a local Ethereum node at `http://localhost:8545` that forks Sepolia.

**What you'll see:**
```
Starting Anvil forking Sepolia...
This gives you a local blockchain with Sepolia state

Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000.000000000000000000 ETH)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000.000000000000000000 ETH)
...

Listening on 127.0.0.1:8545
```

### 3. Deploy Contracts

In a **new terminal**:

```bash
make deploy-fork
```

**Output:**
```
Deploying to Anvil fork...
StealthPayment deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 4. Update Environment

Add the deployed address to `.env`:

```bash
NEXT_PUBLIC_STEALTH_PAYMENT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 5. Run Frontend

```bash
pnpm dev
```

### 6. Connect MetaMask to Local Fork

1. **Add Network** to MetaMask:
   - Network Name: `Anvil Sepolia Fork`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `11155111` (same as Sepolia)
   - Currency Symbol: `ETH`

2. **Import Test Account**:
   - Use one of Anvil's test accounts (from step 2 output)
   - Private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - This account has 10,000 ETH

## Development Workflow

### Testing a Change

1. **Make code changes** to contracts or frontend
2. **Rebuild**: `forge build`
3. **Restart Anvil** (Ctrl+C, then `make anvil-fork`)
4. **Re-deploy**: `make deploy-fork`
5. **Update `.env`** with new address
6. **Test** in browser

### Resetting State

To start fresh:

1. Stop Anvil (Ctrl+C)
2. Restart: `make anvil-fork`
3. Re-deploy: `make deploy-fork`

### Debugging

#### See Transaction Details

Anvil logs all transactions in the terminal:

```
Transaction: 0xabc...
Gas used: 123456
Block: 1234567
```

#### Inspect State

Use `cast` commands against fork:

```bash
# Check balance
cast balance 0xYourAddress --rpc-url http://localhost:8545

# Read contract
cast call 0xContractAddress "functionName()" --rpc-url http://localhost:8545

# Send transaction
cast send 0xContractAddress "functionName()" --private-key 0x... --rpc-url http://localhost:8545
```

## Advantages Over Real Testnet

| Feature | Sepolia Testnet | Anvil Fork |
|---------|----------------|------------|
| **Transaction Speed** | ~12 seconds | Instant |
| **Needs Testnet ETH** | Yes (from faucet) | No (unlimited) |
| **Can Reset State** | No | Yes (restart) |
| **Has Real Contracts** | Yes | Yes (forked) |
| **Etherscan** | Yes | No |
| **Gas Costs** | Yes (testnet) | No |
| **Persistence** | Permanent | Lost on restart |

## Common Issues

### "Error: SEPOLIA_RPC_URL not set"

Make sure `.env` exists and has:
```bash
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

Load it:
```bash
source .env
```

Or use `dotenv`:
```bash
npx dotenv-cli -e .env -- make anvil-fork
```

### "Connection refused" in Frontend

Make sure:
1. Anvil is running (`make anvil-fork`)
2. Frontend is configured to use `http://localhost:8545`
3. MetaMask is connected to the local network

### Transactions Failing

Check that:
1. Contract is deployed to the fork
2. `.env` has correct contract address
3. Account has ETH (Anvil gives 10,000 ETH to test accounts)

## Advanced: Fork from Specific Block

To fork from a specific block (for reproducible tests):

```bash
anvil --fork-url $SEPOLIA_RPC_URL --fork-block-number 5000000 --chain-id 11155111
```

## Next Steps

Once your local testing is complete:

1. **Deploy to real Sepolia**: `make deploy`
2. **Update `.env`** with Sepolia contract address
3. **Test on Sepolia** for final validation
4. **Consider mainnet** deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment guide.
