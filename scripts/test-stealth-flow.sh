#!/bin/bash
# Test complete stealth transfer flow

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║      STEALTH TRANSFER INTEGRATION TEST SUITE             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Running comprehensive stealth address tests...${NC}"
echo ""

# 1. Smart Contract Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  CONTRACT TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Testing StealthPayment contract..."
forge test --match-path "test/StealthPayment.t.sol" -vv

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contract tests passed${NC}"
else
    echo "❌ Contract tests failed"
    exit 1
fi
echo ""

# 2. Cryptography Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  CRYPTOGRAPHY TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Testing stealth address cryptography..."
pnpm test --silent

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cryptography tests passed${NC}"
else
    echo "❌ Cryptography tests failed"
    exit 1
fi
echo ""

# 3. Integration Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  INTEGRATION TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Testing complete stealth transfer flow..."
echo ""

echo -e "${YELLOW}Test: Complete Stealth Transfer Flow${NC}"
forge test --match-test "testCompleteStealthTransferFlow" -vvvv
if [ $? -ne 0 ]; then exit 1; fi
echo ""

echo -e "${YELLOW}Test: Multiple Stealth Payments${NC}"
forge test --match-test "testMultipleStealthPayments" -vvv
if [ $? -ne 0 ]; then exit 1; fi
echo ""

echo -e "${YELLOW}Test: Privacy Properties${NC}"
forge test --match-test "testPrivacyProperties" -vvv
if [ $? -ne 0 ]; then exit 1; fi
echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                  ALL TESTS PASSED ✅                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Test Summary:"
echo "  ✅ Smart contract tests (5 tests)"
echo "  ✅ Cryptography tests (17 tests)"
echo "  ✅ Integration tests (3 tests)"
echo ""
echo "Verified Functionality:"
echo "  • Stealth address generation"
echo "  • Payment to stealth addresses"
echo "  • Event emission for scanning"
echo "  • Private key derivation"
echo "  • Multi-payment support"
echo "  • Privacy properties"
echo ""
echo "Next Steps:"
echo "  1. Deploy to local Anvil: make test-anvil"
echo "  2. Deploy to Anvil fork: make test-fork"
echo "  3. Deploy to Sepolia: make deploy"
echo ""
