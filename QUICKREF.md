# Quick Reference - ENStealth Unlinked

## Commands

```bash
# Setup
make install              # Install all dependencies
make build               # Build contracts
make test                # Run tests

# Deployment
make deploy              # Deploy to Sepolia
make deploy-local        # Deploy to local network
make anvil               # Start local blockchain

# Frontend
make dev                 # Start dev server (http://localhost:3000)
npm run build           # Build for production
npm start               # Start production server

# Smart Contract
forge build              # Compile contracts
forge test -vvv         # Run tests with verbose output
forge coverage          # Test coverage
```

## API Reference

### StealthPayment Contract

#### Functions

```solidity
function sendFunds(
    string calldata ensName,
    bytes32 ephemeralPubKey,
    address stealthAddress
) external payable

function announce(
    string calldata ensName,
    bytes32 ephemeralPubKey,
    address stealthAddress,
    uint256 amount
) external

function computeENSNode(
    string calldata name
) public pure returns (bytes32)
```

#### Events

```solidity
event StealthAnnouncement(
    bytes32 indexed ensNode,
    bytes32 ephemeralPubKey,
    address indexed stealthAddress,
    uint256 amount,
    address indexed sender
)
```

### Crypto Library

```typescript
// Generate new stealth keys
function generateStealthKeys(): StealthKeys

// Derive stealth address for payment
function deriveStealthAddress(
  spendPublicKey: string,
  viewPublicKey: string
): StealthAddress

// Scan for payments
function scanStealthPayments(
  viewPrivateKey: string,
  spendPrivateKey: string,
  ephemeralPublicKeys: string[]
): Array<{ address: string; privateKey: string }>
```

## Cryptography Formulas

### Stealth Address Generation (Sender)

```
r ← random scalar
R = r·G                    (ephemeral public key)
S = r·P_view               (shared secret)
h = H(S)                   (hash of shared secret)
P_stealth = P_spend + h·G  (stealth public key)
addr = keccak256(P_stealth)[12:]  (Ethereum address)
```

### Payment Discovery (Recipient)

```
S' = y·R                   (recover shared secret)
h = H(S')                  (same hash)
P_stealth = P_spend + h·G  (same stealth public key)
sk = x + h                 (stealth private key)
```

Where:
- `x` = spend private key
- `y` = view private key
- `P_spend = x·G` = spend public key
- `P_view = y·G` = view public key
- `G` = generator point (secp256k1)

## ENS Records

```
stealth:spend = <spend_public_key>
stealth:view = <view_public_key>
```

Example:
```
stealth:spend = 0x04c8b8c8e8...
stealth:view = 0x04d9d9d9d9...
```

## File Structure

```
enstealth-unlinked/
├── contracts/               # Solidity contracts
│   └── StealthPayment.sol
├── script/                  # Deployment scripts
│   └── Deploy.s.sol
├── test/                    # Contract tests
│   └── StealthPayment.t.sol
├── src/
│   ├── app/                # Next.js pages
│   │   ├── page.tsx        # Home
│   │   ├── merchant/
│   │   │   ├── create/     # Create merchant
│   │   │   └── withdraw/   # Withdraw funds
│   │   └── pay/[merchant]/ # Payment page
│   ├── components/         # React components
│   │   └── Web3Provider.tsx
│   └── lib/                # Utilities
│       ├── crypto.ts       # Stealth crypto
│       ├── abi.ts          # Contract ABIs
│       └── config.ts       # Configuration
├── foundry.toml            # Foundry config
├── package.json            # Node dependencies
└── Makefile                # Build automation
```

## URLs

- **Homepage**: `/`
- **Create Merchant**: `/merchant/create`
- **Withdraw Funds**: `/merchant/withdraw`
- **Make Payment**: `/pay/{merchant}.enstealth.eth`
- **Unlink Payment**: `/pay/{merchant}.enstealth.eth?method=unlink`

## Environment Variables

### Required
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=xxx  # WalletConnect ID
NEXT_PUBLIC_STEALTH_PAYMENT_ADDRESS=0xxx  # Deployed contract
```

### Optional
```bash
PRIVATE_KEY=xxx              # For deployment
SEPOLIA_RPC_URL=xxx         # Sepolia RPC
ETHERSCAN_API_KEY=xxx       # For verification
UNLINK_API_KEY=xxx          # Unlink integration
```

## Key Storage Format (JSON)

```json
{
  "merchantName": "merchant.enstealth.eth",
  "spendPrivateKey": "xxx",
  "viewPrivateKey": "xxx",
  "spendPublicKey": "0x04xxx",
  "viewPublicKey": "0x04xxx",
  "createdAt": "2026-04-04T..."
}
```

## Testing Addresses (Sepolia)

After deployment, you'll get:
- **Contract**: StealthPayment address
- **Merchant**: Generated stealth keys
- **Payment**: Unique stealth addresses

## Common Issues

| Issue | Solution |
|-------|----------|
| Wallet won't connect | Check WalletConnect Project ID |
| Transaction fails | Ensure Sepolia network & ETH |
| No payments found | Check contract address & keys |
| Build fails | Run `make clean && make build` |
| ENS not resolving | Use mock keys or setup ENS records |

## Security Best Practices

1. ✅ Never share private keys
2. ✅ Download and backup key files
3. ✅ Use hardware wallet in production
4. ✅ Test on Sepolia before mainnet
5. ✅ Verify contract on Etherscan
6. ✅ Audit code before production
7. ✅ Monitor for unusual activity

## Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [Vitalik on Stealth Addresses](https://vitalik.ca/general/2023/01/20/stealth.html)
- [ENS Docs](https://docs.ens.domains/)
- [WalletConnect](https://docs.walletconnect.com/)

---

For detailed guides, see:
- [README.md](README.md) - Overview
- [GETTING_STARTED.md](GETTING_STARTED.md) - Setup guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
