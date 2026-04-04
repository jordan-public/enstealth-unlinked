# ENS Integration Guide

## Overview

The ENStealth Unlinked app uses a permissionless subdomain registration system under `enstealth.eth`. This allows merchants to automatically register `merchant.enstealth.eth` subdomains with their stealth address public keys stored in ENS text records.

## Architecture

### Contracts

1. **ENStealthRegistrar** (`contracts/ENStealthRegistrar.sol`)
   - Manages subdomain registration for `enstealth.eth`
   - Stores public keys in ENS text records
   - Fully permissionless - anyone can register a subdomain
   - Text records: `stealth:spend` and `stealth:view`

2. **StealthPayment** (`contracts/StealthPayment.sol`)
   - Handles stealth payments
   - Emits `StealthAnnouncement` events indexed by ENS node

### Deployed Addresses (Local/Anvil)

```
StealthPayment: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
ENStealthRegistrar: 0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
MockENS: 0x0165878A594ca255338adfa4d48449f69242Eb8F
MockResolver: 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
```

## Registration Flow

1. **Generate Keys** - Merchant creates spend/view key pairs locally
2. **Register Subdomain** - Call `registerSubdomain(label, spendKey, viewKey)` on registrar
3. **On-Chain Storage** - Public keys stored in ENS text records
4. **Discovery** - Payers query `getPublicKeys(label)` to get keys
5. **Payment** - Payer derives stealth address and sends funds

## Setting Up the Root Domain

### For Testing (Local/Anvil)

✅ **Already configured!** Mock ENS contracts are deployed automatically.

### For Sepolia Testnet

1. **Register `enstealth.eth` on Sepolia ENS**
   ```bash
   # Visit https://app.ens.domains and register on Sepolia
   # Cost: ~0.0001 ETH per year on testnet
   ```

2. **Set Registrar as Controller**
   ```bash
   # In ENS Manager, add the registrar contract as a controller
   # Controller address: <DEPLOYED_REGISTRAR_ADDRESS>
   ```

3. **Deploy Contracts**
   ```bash
   make deploy  # Uses SEPOLIA_PRIVATE_KEY from .env
   ```

4. **Update .env**
   ```env
   NEXT_PUBLIC_ENS_REGISTRAR_ADDRESS=<deployed_address>
   NEXT_PUBLIC_STEALTH_PAYMENT_ADDRESS=<deployed_address>
   ```

### For Mainnet

Same process as Sepolia, but:
- Domain costs ~$5 USD per year
- Gas costs for deployment and registration are real ETH
- Requires mainnet RPC URL and funded account

## ENS Text Records Format

The registrar stores public keys as hex strings with `0x` prefix:

```
stealth:spend = 0x0485a48d82f8b2c3e71d9f61e6c8a72b4d5e3f9a1c2b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r
stealth:view  = 0x04b2c3e71d9f61e6c8a72b4d5e3f9a1c2b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w
```

These are the full secp256k1 public keys (65 bytes / 130 hex chars).

## Frontend Integration

### Creating a Merchant

```typescript
import { useWriteContract } from 'wagmi';
import { ENS_REGISTRAR_ABI } from '@/lib/abi';

// Generate keys
const keys = generateStealthKeys();

// Register subdomain
writeContract({
  address: CONTRACTS.ENS_REGISTRAR,
  abi: ENS_REGISTRAR_ABI,
  functionName: 'registerSubdomain',
  args: [merchantName, keys.spendPublicKey, keys.viewPublicKey],
});
```

### Resolving ENS Keys

```typescript
import { resolveENSKeys } from '@/lib/blockchain';

const keys = await resolveENSKeys('merchant.enstealth.eth');
// Returns: { spendPublicKey, viewPublicKey }
```

## Testing

### Run Contract Tests

```bash
# Test ENS registrar
forge test --match-path "test/ENStealthRegistrar.t.sol" -vvv

# Test stealth payments
forge test --match-path "test/StealthPayment.t.sol" -vvv

# Test full integration
make test-integration
```

### Test UI Flow (Local)

1. Start Anvil: `make test-anvil`
2. Start UI: `pnpm dev`
3. Visit: http://localhost:3000/merchant/create
4. Generate keys and register subdomain
5. Check registration in console logs

## Gas Costs

- Subdomain registration: ~300k gas (~$3-10 on mainnet depending on gas price)
- Public key update: ~150k gas
- Stealth payment: ~100k gas

## Security Considerations

1. **Private Key Storage**: Merchants must securely store spend/view private keys offline
2. **Subdomain Ownership**: First-come-first-served (no one can override existing subdomains)
3. **Public Key Backup**: Keys stored on-chain are permanent and immutable
4. **Front-Running**: Registration is permissionless but not vulnerable to meaningful front-running

## Limitations

1. **Name Squatting**: Anyone can register any available subdomain
2. **No Transfers**: Subdomains cannot be transferred to new owners (future enhancement)
3. **Single Record**: Each subdomain can only have one set of public keys
4. **Gas Costs**: On-chain registration requires transaction fees

## Future Enhancements

- [ ] Add subdomain transfer functionality
- [ ] Implement subdomain expiry/renewal
- [ ] Add reverse resolution (address → ENS name)
- [ ] Support multiple key pairs per merchant
- [ ] Add subdomain metadata (name, description, logo)
- [ ] Implement name reservation/auction system

## Resources

- [ENS Documentation](https://docs.ens.domains/)
- [ENS Registry Contract](https://docs.ens.domains/contract-api-reference/ens)
- [Public Resolver](https://docs.ens.domains/contract-api-reference/publicresolver)
- [Stealth Address Spec](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-5564.md)
