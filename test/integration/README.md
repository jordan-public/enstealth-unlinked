# Integration Tests

End-to-end tests for stealth transfers without the frontend.

## Running Tests

### All Integration Tests
```bash
forge test --match-path "test/integration/*.sol" -vvv
```

### Complete Flow Test (Detailed Output)
```bash
forge test --match-test "testCompleteStealthTransferFlow" -vvvv
```

### Quick Run
```bash
forge test --match-path "test/integration/*.sol" -vv
```

## What's Tested

### ✅ On-Chain (Actually Executed)
- Payment transactions via `sendFunds()`
- ETH transfers to stealth addresses
- `StealthAnnouncement` event emissions
- Balance changes verification
- Multiple payment support
- Privacy properties (addresses unlinkable)

### 📝 Off-Chain (Simulated)
- Key generation (tested separately in crypto.test.ts)
- Stealth address derivation (tested in crypto.test.ts)
- Event scanning
- Private key derivation (tested in crypto.test.ts)

## Test Suite

1. **testCompleteStealthTransferFlow** - Full end-to-end flow
2. **testMultipleStealthPayments** - Multiple payments to same merchant
3. **testPrivacyProperties** - Privacy guarantees

## Complete Test Coverage

```bash
# 1. Contract tests
forge test --match-path "test/StealthPayment.t.sol" -vv

# 2. Crypto tests
pnpm test

# 3. Integration tests
forge test --match-path "test/integration/*.sol" -vvv
```

This verifies:
- ✅ Smart contract correctness
- ✅ Cryptography correctness  
- ✅ Complete stealth transfer flow
- ✅ Privacy properties
