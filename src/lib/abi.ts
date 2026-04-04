export const STEALTH_PAYMENT_ABI = [
  {
    type: 'function',
    name: 'sendFunds',
    inputs: [
      { name: 'ensName', type: 'string', internalType: 'string' },
      { name: 'ephemeralPubKey', type: 'bytes32', internalType: 'bytes32' },
      { name: 'stealthAddress', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'announce',
    inputs: [
      { name: 'ensName', type: 'string', internalType: 'string' },
      { name: 'ephemeralPubKey', type: 'bytes32', internalType: 'bytes32' },
      { name: 'stealthAddress', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'computeENSNode',
    inputs: [{ name: 'name', type: 'string', internalType: 'string' }],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'event',
    name: 'StealthAnnouncement',
    inputs: [
      {
        name: 'ensNode',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'ephemeralPubKey',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
      {
        name: 'stealthAddress',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'sender',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'receive',
    stateMutability: 'payable',
  },
] as const;
