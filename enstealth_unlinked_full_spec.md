# ENStealth Unlinked — Full Technical Copilot Spec

## 0. Project Goal

Build a working prototype of ENStealth Unlinked:
- ENS for identity
- Stealth addresses for receiver privacy
- WalletConnect (Reown) for payments
- Unlink for private sender payments

---

## 1. Core Cryptography (CRITICAL)

### Stealth Address Derivation

Sender computes:

r ← random scalar  
R = rG  
S = r · P_view  
h = H(S)  
P_stealth = P_spend + hG  
addr = keccak256(P_stealth)[12:]

---

### Recipient Recovery

S' = y · R  
h = H(S')  
P_stealth = P_spend + hG  
sk = x + h  

---

## 2. ENS Structure

Root:
enstealth.eth

Merchant:
<merchant>.enstealth.eth

Records:
- stealth:spend = P_spend
- stealth:view  = P_view

---

## 3. Smart Contract

Contract: StealthPayment.sol

Function:

sendFunds(string name, bytes32 R, address addr) payable

Behavior:
- emit event
- forward ETH to addr

Event:

StealthAnnouncement(
  bytes32 node,
  bytes32 R,
  address addr,
  uint256 amount
)

---

## 4. Payment Flow

### Flow 1 — WalletConnect

1. Resolve ENS → P_spend, P_view  
2. Generate stealth address (above formulas)  
3. Call contract with:
   sendFunds(name, R, addr)  

---

### Flow 2 — Unlink

1. Same stealth derivation  
2. Call Unlink:
   send_private_tx(addr, amount)  
3. Optionally:
   announce(name, R, addr)

---

## 5. Merchant Creation

- Generate:
  x, y
- Compute:
  P_spend = xG
  P_view = yG
- Store in ENS

---

## 6. Merchant Withdrawal

1. Scan events  
2. For each R:
   S = y · R  
   derive addr  
3. Match balances  
4. Compute sk and spend  

---

## 7. Frontend Pages

- /merchant/create
- /merchant/withdraw
- /pay/[merchant]

---

## 8. Constraints

- No elliptic curve math on-chain
- All crypto off-chain

---

## 9. Mental Model

ENS → keys  
Sender → derive stealth addr  
Contract → emit R  
Recipient → derive sk  
