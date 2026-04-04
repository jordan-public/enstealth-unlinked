# Testing Guide

This project includes comprehensive tests for both smart contracts and cryptography.

## Test Suites

### 1. Smart Contract Tests (Foundry)

Tests the StealthPayment.sol contract.

```bash
# Run contract tests
make test

# Or directly with forge
forge test -vvv
```

**What's tested:**
- ✅ Sending funds to stealth addresses
- ✅ Event emissions with correct parameters
- ✅ Input validation (zero amounts, zero addresses)
- ✅ Announcement function
- ✅ ENS node computation

### 2. Cryptography Tests (Jest)

Tests the stealth address cryptography implementation.

```bash
# Run crypto tests
make test-crypto

# Or with npm
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**What's tested:**

#### Key Generation
- ✅ Generates valid elliptic curve key pairs
- ✅ Produces unique keys each time
- ✅ Correct format for private/public keys

#### Stealth Address Derivation
- ✅ Creates valid Ethereum addresses
- ✅ Each derivation produces unique address (unlinkability)
- ✅ Proper ephemeral key generation

#### Private Key Recovery ⭐ CRITICAL
- ✅ **Derived private key controls the stealth address**
- ✅ Private key can sign transactions from stealth address
- ✅ Multiple payments can all be recovered
- ✅ Each private key matches its corresponding address

#### Round-Trip Flow
- ✅ Complete sender → recipient flow works
- ✅ Merchant can discover and spend payments
- ✅ Multiple merchants work independently
- ✅ Privacy properties maintained

#### Cryptographic Properties
- ✅ Stealth addresses are unlinkable
- ✅ Privacy guarantees hold
- ✅ Different merchants produce different addresses

#### Error Handling
- ✅ Invalid inputs handled gracefully
- ✅ Empty lists handled correctly
- ✅ Partial failures continue processing

### 3. Run All Tests

```bash
make test-all
```

## Key Test: Private Key Verification

The most critical test verifies that the derived private key actually controls the stealth address:

```typescript
it('should derive private key that controls the stealth address', () => {
  // Merchant generates keys
  const merchantKeys = generateStealthKeys();

  // Sender derives stealth address
  const stealth = deriveStealthAddress(
    merchantKeys.spendPublicKey,
    merchantKeys.viewPublicKey
  );

  // Recipient scans and derives private key
  const scanned = scanStealthPayments(
    merchantKeys.viewPrivateKey,
    merchantKeys.spendPrivateKey,
    [stealth.ephemeralPublicKey]
  );

  // VERIFY: Private key → Address matches stealth address
  const derivedAddress = privateKeyToAddress(scanned[0].privateKey);
  expect(derivedAddress).toBe(stealth.address);
});
```

This ensures that:
1. The cryptography math is correct
2. Merchants can actually spend received funds
3. The stealth address and private key correspond

## Test Coverage

Target: 80% coverage for crypto library

```bash
npm run test:coverage
```

Coverage includes:
- `src/lib/crypto.ts` - All stealth address functions
- Branch coverage for error handling
- Edge cases and validation

## Manual Testing Flow

### End-to-End Test

1. **Generate Keys**
   ```bash
   npm run dev
   # Visit /merchant/create
   # Generate and save keys
   ```

2. **Create Payment**
   ```bash
   # Visit /pay/test.enstealth.eth
   # Derive stealth address
   # Note the address and ephemeral key
   ```

3. **Verify Recovery**
   ```bash
   # Visit /merchant/withdraw
   # Upload saved keys
   # Scan for payments
   # Verify derived address matches payment
   ```

4. **Check Private Key**
   ```typescript
   // In browser console
   import { privateKeyToAddress } from './helpers';
   const addr = privateKeyToAddress(derivedPrivateKey);
   console.log(addr === stealthAddress); // Should be true
   ```

## Debugging Tests

### View Test Output

```bash
# Verbose output
forge test -vvv

# Very verbose (shows traces)
forge test -vvvv

# Run specific test
forge test --match-test testSendFunds -vvv
npm test -- crypto.test.ts
```

### Common Issues

**"Test failed: addresses don't match"**
- Check elliptic curve math
- Verify keccak256 hashing
- Ensure proper point addition

**"Cannot derive stealth address"**
- Check public key format
- Verify key compression/decompression
- Ensure valid curve points

**"Private key doesn't control address"**
- Verify private key derivation: `sk = x + h`
- Check that `h` computation matches
- Ensure shared secret `S` is computed correctly

## Continuous Integration

Add to GitHub Actions:

```yaml
- name: Run Tests
  run: |
    make test-all
```

## Test Data

Test vectors are generated randomly for each run to ensure robustness. For deterministic testing, you can use fixed seeds (not recommended for production).

## Security Considerations

Tests verify:
- ✅ Unlinkability of stealth addresses
- ✅ Privacy of merchant keys
- ✅ Correctness of cryptographic operations
- ✅ No private key leakage
- ✅ Proper randomness in ephemeral keys

## Next Steps

1. Run tests: `make test-all`
2. Check coverage: `npm run test:coverage`
3. Review any failures carefully
4. Add integration tests with deployed contracts
5. Test with real blockchain transactions

---

**Critical**: All crypto tests must pass before deploying to mainnet!
