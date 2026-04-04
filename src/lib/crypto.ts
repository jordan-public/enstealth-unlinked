import * as elliptic from 'elliptic';
import BN from 'bn.js';
import keccak from 'keccak';

const ec = new elliptic.ec('secp256k1');

export interface StealthKeys {
  spendPrivateKey: string;
  viewPrivateKey: string;
  spendPublicKey: string;
  viewPublicKey: string;
}

export interface StealthAddress {
  address: string;
  ephemeralPublicKey: string;
  ephemeralPrivateKey: string;
}

/**
 * Generate a new pair of stealth keys for a merchant
 */
export function generateStealthKeys(): StealthKeys {
  // Generate spend key
  const spendKey = ec.genKeyPair();
  const spendPrivateKey = spendKey.getPrivate('hex');
  const spendPublicKey = '0x' + spendKey.getPublic('hex');

  // Generate view key
  const viewKey = ec.genKeyPair();
  const viewPrivateKey = viewKey.getPrivate('hex');
  const viewPublicKey = '0x' + viewKey.getPublic('hex');

  return {
    spendPrivateKey,
    viewPrivateKey,
    spendPublicKey,
    viewPublicKey,
  };
}

/**
 * Derive a stealth address from recipient's public keys
 * @param spendPublicKey Recipient's spend public key (P_spend)
 * @param viewPublicKey Recipient's view public key (P_view)
 * @returns Stealth address and ephemeral key
 */
export function deriveStealthAddress(
  spendPublicKey: string,
  viewPublicKey: string
): StealthAddress {
  // Remove 0x prefix if present
  const cleanSpendPub = spendPublicKey.replace('0x', '');
  const cleanViewPub = viewPublicKey.replace('0x', '');

  // Parse public keys
  const P_spend = ec.keyFromPublic(cleanSpendPub, 'hex').getPublic();
  const P_view = ec.keyFromPublic(cleanViewPub, 'hex').getPublic();

  // Generate random ephemeral key r
  const ephemeralKey = ec.genKeyPair();
  const r = ephemeralKey.getPrivate();
  const R = ephemeralKey.getPublic(); // R = r·G

  // Compute shared secret: S = r·P_view
  const S = P_view.mul(r);

  // Hash the shared secret: h = H(S)
  const h = hashPoint(S);

  // Compute stealth public key: P_stealth = P_spend + h·G
  const hG = ec.g.mul(new BN(h, 16));
  const P_stealth = P_spend.add(hG);

  // Derive Ethereum address from public key
  const address = publicKeyToAddress(P_stealth);

  return {
    address,
    ephemeralPublicKey: '0x' + R.encodeCompressed('hex'),
    ephemeralPrivateKey: r.toString('hex'),
  };
}

/**
 * Scan for stealth payments and derive private keys
 * @param viewPrivateKey Recipient's view private key
 * @param spendPrivateKey Recipient's spend private key
 * @param ephemeralPublicKeys Array of ephemeral public keys from events
 * @returns Array of stealth addresses with their private keys
 */
export function scanStealthPayments(
  viewPrivateKey: string,
  spendPrivateKey: string,
  ephemeralPublicKeys: string[]
): Array<{ address: string; privateKey: string }> {
  const y = new BN(viewPrivateKey, 16);
  const x = new BN(spendPrivateKey, 16);

  const results: Array<{ address: string; privateKey: string }> = [];

  for (const ephemeralPubKey of ephemeralPublicKeys) {
    try {
      // Parse ephemeral public key R
      const cleanR = ephemeralPubKey.replace('0x', '');
      let R;
      
      // Handle both compressed and uncompressed formats
      if (cleanR.length === 66) {
        // Compressed format
        R = ec.keyFromPublic(cleanR, 'hex').getPublic();
      } else {
        // Assume it's a 32-byte x-coordinate, decompress it
        const xCoord = new BN(cleanR.slice(0, 64), 16);
        R = ec.curve.pointFromX(xCoord, false);
      }

      // Compute shared secret: S = y·R
      const S = R.mul(y);

      // Hash the shared secret: h = H(S)
      const h = hashPoint(S);

      // Compute stealth public key: P_stealth = P_spend + h·G
      const P_spend = ec.keyFromPrivate(x.toString(16), 'hex').getPublic();
      const hG = ec.g.mul(new BN(h, 16));
      const P_stealth = P_spend.add(hG);

      // Derive address
      const address = publicKeyToAddress(P_stealth);

      // Compute private key: sk = x + h
      const sk = x.add(new BN(h, 16)).umod(ec.curve.n);

      results.push({
        address,
        privateKey: '0x' + sk.toString(16, 64),
      });
    } catch (error) {
      console.error('Error processing ephemeral key:', ephemeralPubKey, error);
    }
  }

  return results;
}

/**
 * Hash an elliptic curve point for stealth address derivation
 */
function hashPoint(point: elliptic.curve.base.BasePoint): string {
  const encoded = point.encode('hex', false);
  const hash = keccak('keccak256').update(Buffer.from(encoded, 'hex')).digest('hex');
  return hash;
}

/**
 * Convert a public key to an Ethereum address
 */
function publicKeyToAddress(publicKey: elliptic.curve.base.BasePoint): string {
  // Get uncompressed public key (without 0x04 prefix)
  const pubKeyHex = publicKey.encode('hex', false).slice(2);
  
  // Keccak256 hash
  const hash = keccak('keccak256').update(Buffer.from(pubKeyHex, 'hex')).digest();
  
  // Take last 20 bytes
  const address = '0x' + hash.slice(-20).toString('hex');
  
  return address;
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/**
 * Validate public key format
 */
export function isValidPublicKey(pubKey: string): boolean {
  const clean = pubKey.replace('0x', '');
  // Uncompressed (130 chars) or compressed (66 chars)
  return clean.length === 130 || clean.length === 66;
}
