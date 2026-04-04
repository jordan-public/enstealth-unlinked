# ENStealth Unlinked

Welcome to ENStealth Unlinked! This guide will help you get started quickly.

## Prerequisites

- Node.js (v18 or higher)
- Foundry (for smart contract development)
- A wallet (MetaMask or similar)
- Some Sepolia ETH for testing

## Quick Start

### 1. Installation

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Clone and install
git clone <your-repo-url>
cd enstealth-unlinked
make install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add:
# - Your private key (for deploying contracts)
# - Sepolia RPC URL (Alchemy/Infura)
# - WalletConnect Project ID (get from https://cloud.walletconnect.com/)
```

### 3. Build and Test Contracts

```bash
# Build contracts
make build

# Run tests
make test
```

### 4. Deploy Contracts

```bash
# Deploy to Sepolia testnet
make deploy

# Copy the deployed contract address and update:
# .env -> NEXT_PUBLIC_STEALTH_PAYMENT_ADDRESS=<deployed-address>
```

### 5. Run Frontend

```bash
# Start development server
make dev

# Open http://localhost:3000
```

## Usage Guide

### For Merchants (Receiving Payments)

1. **Create Merchant Account**
   - Go to `/merchant/create`
   - Choose a name (e.g., "mystore")
   - Generate stealth keys
   - Download keys (KEEP SAFE!)
   - Configure ENS records

2. **Accept Payments**
   - Share your ENS name: `mystore.enstealth.eth`
   - Customers send payments to your stealth addresses
   - Each payment goes to a unique address

3. **Withdraw Funds**
   - Go to `/merchant/withdraw`
   - Upload your key file
   - Scan for payments
   - Withdraw to your wallet

### For Customers (Sending Payments)

1. **Via WalletConnect**
   - Go to `/pay/merchant.enstealth.eth`
   - Choose "WalletConnect" method
   - Connect wallet
   - Enter amount and send

2. **Via Unlink (Private Sender)**
   - Go to `/pay/merchant.enstealth.eth?method=unlink`
   - Choose "Unlink" method
   - Enter amount and send
   - Your sender address is hidden

## Architecture

```
┌─────────────┐
│   Frontend  │  Next.js + React
│   (Browser) │  - Stealth crypto (client-side)
└──────┬──────┘  - WalletConnect integration
       │
       ├─────────────────────────────┐
       │                             │
┌──────▼─────┐              ┌────────▼────────┐
│ Blockchain │              │   Unlink API    │
│  (Sepolia) │              │  (Private TX)   │
└──────┬─────┘              └─────────────────┘
       │
┌──────▼─────────────┐
│ StealthPayment.sol │
│ - sendFunds()      │
│ - announce()       │
│ - emit events      │
└────────────────────┘
```

## Key Concepts

### Stealth Addresses

Each payment goes to a unique "stealth" address that only the recipient can spend:
- **Spend Key (x)**: Used to spend funds
- **View Key (y)**: Used to scan for payments
- **Ephemeral Key (r)**: Random per-payment key
- **Stealth Address**: Derived from spend key + ephemeral key

### Privacy Features

1. **Receiver Privacy**: Each payment to unique address
2. **Sender Privacy**: Unlink hides sender identity
3. **Unlinkability**: Payments not linked to each other
4. **Scanning**: View key allows monitoring without spending

## Development

### Project Structure

```
├── contracts/          # Solidity smart contracts
│   └── StealthPayment.sol
├── script/            # Deployment scripts
│   └── Deploy.s.sol
├── test/              # Contract tests
│   └── StealthPayment.t.sol
├── src/
│   ├── app/           # Next.js pages
│   │   ├── merchant/  # Merchant tools
│   │   └── pay/       # Payment pages
│   ├── components/    # React components
│   └── lib/           # Utilities
│       ├── crypto.ts  # Stealth address crypto
│       ├── abi.ts     # Contract ABIs
│       └── config.ts  # Configuration
└── public/            # Static assets
```

### Running Tests

```bash
# Contract tests
make test

# Frontend (add tests as needed)
npm test
```

### Local Development

```bash
# Terminal 1: Run local blockchain
make anvil

# Terminal 2: Deploy contracts
make deploy-local

# Terminal 3: Run frontend
make dev
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Private Keys**: Never share or commit private keys
2. **Production**: This is a hackathon demo - audit before production use
3. **Key Storage**: Use hardware wallets for production merchant keys
4. **Browser**: Crypto operations run client-side - ensure secure environment
5. **ENS**: Verify ENS records before sending payments

## Troubleshooting

### "Cannot connect wallet"
- Ensure you have WalletConnect Project ID in `.env`
- Check that you're on Sepolia network

### "Contract not found"
- Deploy contracts: `make deploy`
- Update contract address in `.env`

### "Transaction failed"
- Ensure you have Sepolia ETH
- Check contract is deployed on Sepolia
- Verify stealth address derivation

### "No payments found"
- Ensure you have correct private keys
- Check events are emitted on-chain
- Verify contract address is correct

## Resources

- [Foundry Documentation](https://book.getfoundry.sh/)
- [Next.js Documentation](https://nextjs.org/docs)
- [WalletConnect](https://docs.walletconnect.com/)
- [ENS Documentation](https://docs.ens.domains/)
- [Stealth Addresses Research](https://vitalik.ca/general/2023/01/20/stealth.html)

## License

MIT

## Support

For issues or questions, please open a GitHub issue.

Happy hacking! 🚀
