import { createPublicClient, http, parseAbi } from 'viem';
import { sepolia } from 'viem/chains';
import { CONTRACTS } from './config';
import { STEALTH_PAYMENT_ABI } from './abi';

/**
 * Create a public client for reading blockchain data
 */
export function getPublicClient() {
  return createPublicClient({
    chain: sepolia,
    transport: http(),
  });
}

/**
 * Fetch stealth announcement events from the contract
 */
export async function fetchStealthAnnouncements(
  merchantName?: string,
  fromBlock: bigint = BigInt(0)
) {
  const client = getPublicClient();

  const logs = await client.getLogs({
    address: CONTRACTS.STEALTH_PAYMENT as `0x${string}`,
    event: parseAbi([
      'event StealthAnnouncement(bytes32 indexed ensNode, bytes32 ephemeralPubKey, address indexed stealthAddress, uint256 amount, address indexed sender)',
    ])[0],
    fromBlock,
  });

  return logs.map((log) => ({
    ensNode: log.args.ensNode,
    ephemeralPubKey: log.args.ephemeralPubKey,
    stealthAddress: log.args.stealthAddress,
    amount: log.args.amount,
    sender: log.args.sender,
    blockNumber: log.blockNumber,
    transactionHash: log.transactionHash,
  }));
}

/**
 * Get balance at an address
 */
export async function getBalance(address: string): Promise<bigint> {
  const client = getPublicClient();
  return await client.getBalance({ address: address as `0x${string}` });
}

/**
 * Compute ENS node hash (simplified)
 */
export function computeENSNode(name: string): `0x${string}` {
  // This matches the Solidity implementation
  const encoder = new TextEncoder();
  const data = encoder.encode(name);
  
  // Simple keccak256 - in production use proper ENS namehash
  return `0x${Array.from(data)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`;
}

/**
 * Format an Ethereum address for display
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format a transaction hash for display
 */
export function formatTxHash(hash: string): string {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

/**
 * Get Etherscan URL for address
 */
export function getEtherscanAddressUrl(address: string, chainId: number = 11155111): string {
  const baseUrl = chainId === 1 
    ? 'https://etherscan.io' 
    : 'https://sepolia.etherscan.io';
  return `${baseUrl}/address/${address}`;
}

/**
 * Get Etherscan URL for transaction
 */
export function getEtherscanTxUrl(hash: string, chainId: number = 11155111): string {
  const baseUrl = chainId === 1 
    ? 'https://etherscan.io' 
    : 'https://sepolia.etherscan.io';
  return `${baseUrl}/tx/${hash}`;
}

/**
 * Mock ENS resolution (replace with real ENS in production)
 */
export async function resolveENSKeys(name: string): Promise<{
  spendPublicKey: string;
  viewPublicKey: string;
} | null> {
  // In production, fetch from ENS text records
  // For now, return mock data or null
  
  // Example integration with ENS:
  // const client = getPublicClient();
  // const resolver = await client.getEnsResolver({ name });
  // const spendKey = await client.getEnsText({ name, key: 'stealth:spend' });
  // const viewKey = await client.getEnsText({ name, key: 'stealth:view' });
  
  console.warn('Mock ENS resolution - integrate real ENS in production');
  return null;
}
