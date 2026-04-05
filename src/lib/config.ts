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
  apiUrl: process.env.NEXT_PUBLIC_UNLINK_API_URL || 'https://staging-api.unlink.xyz',
  apiKey: process.env.UNLINK_API_KEY,
  useSdk: process.env.UNLINK_USE_SDK === 'true',
  chainId: 84532,
  tokenAddress: process.env.UNLINK_TOKEN_ADDRESS,
  tokenDecimals: Number(process.env.UNLINK_TOKEN_DECIMALS || '18'),
};

export const UNLINK_PUBLIC_CONFIG = {
  enabled: process.env.NEXT_PUBLIC_UNLINK_ENABLED === 'true',
  chainId: Number(process.env.NEXT_PUBLIC_UNLINK_CHAIN_ID || '84532'),
  rpcUrl: process.env.NEXT_PUBLIC_UNLINK_RPC_URL || 'https://sepolia.base.org',
  tokenAddress: process.env.NEXT_PUBLIC_UNLINK_TOKEN_ADDRESS || '',
  tokenDecimals: Number(process.env.NEXT_PUBLIC_UNLINK_TOKEN_DECIMALS || '18'),
  tokenSymbol: process.env.NEXT_PUBLIC_UNLINK_TOKEN_SYMBOL || 'TOKEN',
};
