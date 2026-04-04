export const CONTRACTS = {
  STEALTH_PAYMENT: process.env.NEXT_PUBLIC_STEALTH_PAYMENT_ADDRESS || '0x0000000000000000000000000000000000000000',
  ENS_REGISTRAR: process.env.NEXT_PUBLIC_ENS_REGISTRAR_ADDRESS || '0x0000000000000000000000000000000000000000',
};

export const ENS_SUFFIX = '.enstealth.eth';

export const CHAIN_CONFIG = {
  sepolia: {
    id: 11155111,
    name: 'Sepolia',
    network: 'sepolia',
    nativeCurrency: {
      decimals: 18,
      name: 'Sepolia Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: ['https://rpc.sepolia.org'],
      },
      public: {
        http: ['https://rpc.sepolia.org'],
      },
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
    },
    testnet: true,
  },
};

// Unlink API configuration (placeholder - adjust based on actual Unlink SDK)
export const UNLINK_CONFIG = {
  apiUrl: process.env.NEXT_PUBLIC_UNLINK_API_URL || 'https://api.unlink.network',
  apiKey: process.env.UNLINK_API_KEY,
};
