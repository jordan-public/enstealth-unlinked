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

export const ENS_REGISTRAR_ABI = [
  {
    type: 'function',
    name: 'registerSubdomain',
    inputs: [
      { name: 'label', type: 'string', internalType: 'string' },
      { name: 'spendPublicKey', type: 'bytes32', internalType: 'bytes32' },
      { name: 'viewPublicKey', type: 'bytes32', internalType: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'updatePublicKeys',
    inputs: [
      { name: 'label', type: 'string', internalType: 'string' },
      { name: 'spendPublicKey', type: 'bytes32', internalType: 'bytes32' },
      { name: 'viewPublicKey', type: 'bytes32', internalType: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPublicKeys',
    inputs: [{ name: 'label', type: 'string', internalType: 'string' }],
    outputs: [
      { name: 'spendKey', type: 'string', internalType: 'string' },
      { name: 'viewKey', type: 'string', internalType: 'string' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'computeNode',
    inputs: [{ name: 'label', type: 'string', internalType: 'string' }],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'subdomainExists',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'subdomainOwner',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'SubdomainRegistered',
    inputs: [
      {
        name: 'label',
        type: 'string',
        indexed: true,
        internalType: 'string',
      },
      {
        name: 'node',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'owner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'spendPublicKey',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
      {
        name: 'viewPublicKey',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'PublicKeysUpdated',
    inputs: [
      {
        name: 'node',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'spendPublicKey',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
      {
        name: 'viewPublicKey',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
] as const;
