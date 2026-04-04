# ENStealth Unlinked

Privacy-focused payment system combining ENS, stealth addresses, WalletConnect, and Unlink.

## Features

- **Stealth Addresses**: Hide payment destinations using cryptographic stealth addresses
- **ENS Integration**: Store stealth address keys in ENS records
- **WalletConnect**: Accept payments via WalletConnect
- **Unlink**: Private sender payments to hide transaction origin
- **Merchant Tools**: Create stealth recipients and withdraw funds

## Architecture

- **Smart Contracts**: Foundry-based Solidity contracts
- **Frontend**: Next.js with TypeScript
- **Crypto**: Off-chain elliptic curve cryptography for stealth addresses

## Quick Start

> **Note**: This project uses **pnpm** for package management. See [PNPM.md](PNPM.md) for installation and usage.

### 1. Clone Repository

```bash
# Clone with submodules
git clone --recursive https://github.com/jordan-public/enstealth-unlinked.git
cd enstealth-unlinked

# Or if already cloned without --recursive:
git submodule update --init --recursive
```

### 2. Install Dependencies

```bash
# In3tall Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install pnpm (if not already installed)
npm install -g pnpm

# Install Node dependencies
pnpm install
```

### 2. Build Contracts

```bash
forge build
```

### 4. Run Tests

```bash
forge test
pnpm test
```

### 5. Deploy Contracts

```bash
# Set up .env file first
cp .env.example .env
# Edit .env with your values

# Deploy to Sepolia
pnpm contract:deploy
```

### 5. Run Frontend

```bash
pnpm dev
```
6
Visit `http://localhost:3000`

## Testing

### Smart Contract Tests

```bash
make test
# or
forge test -vvv
```

### Cryptography Tests

```bash
make test-crypto
# or
pnpm test
```

The crypto tests verify the most critical functionality:
- ✅ Stealth addresses are generated correctly
- ✅ Private keys derived by recipients can spend from stealth addresses
- ✅ Round-trip sender→recipient flow works perfectly
- ✅ Privacy properties are maintained

### Run All Tests

```bash
make test-all
```

See [TESTING.md](TESTING.md) for detailed testing guide.

## Project Structure

```
├── contracts/          # Solidity smart contracts
├── script/            # Deployment scripts
├── test/              # Contract tests
├── src/               # Next.js frontend
│   ├── app/          # App router pages
│   ├── components/   # React components
│   └── lib/          # Utilities and crypto
└── public/           # Static assets
```

## How It Works

### Stealth Address Generation

1. Merchant generates spend key (x) and view key (y)
2. Public keys P_spend and P_view stored in ENS
3. Sender derives stealth address: P_stealth = P_spend + H(r·P_view)·G
4. Payment sent to stealth address with ephemeral key R published

### Payment Flow

**Option 1: WalletConnect**
- User connects wallet
- Sends payment to stealth address via smart contract
- Event emitted with ephemeral key R

**Option 2: Unlink**
- Private transaction hides sender
- Payment to stealth address
- Optional announcement via contract

### Withdrawal

1. Merchant scans events for ephemeral keys R
2. Derives stealth addresses using view key
3. Computes private keys for addresses with funds
4. Withdraws funds

## License

MIT
