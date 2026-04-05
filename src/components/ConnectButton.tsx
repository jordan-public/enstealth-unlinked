'use client';

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { baseSepolia, sepolia } from 'wagmi/chains';
import { useEffect, useState } from 'react';

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isOnSepolia = chain?.id === sepolia.id;
  const isOnBaseSepolia = chain?.id === baseSepolia.id;

  // Prevent hydration mismatch by not rendering wallet-specific content until mounted
  if (!mounted) {
    return (
      <div className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-800">
        Loading...
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex flex-wrap gap-2 items-center justify-end">
        <div className="px-3 py-2 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800">
          {isOnBaseSepolia ? 'Base Sepolia' : isOnSepolia ? 'Ethereum Sepolia' : `Chain ${chain?.id ?? 'Unknown'}`}
        </div>
        {!isOnSepolia && (
          <button
            onClick={() => switchChain({ chainId: sepolia.id })}
            className="px-4 py-2 rounded-md text-sm font-medium bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            Use Ethereum Sepolia
          </button>
        )}
        {!isOnBaseSepolia && (
          <button
            onClick={() => switchChain({ chainId: baseSepolia.id })}
            className="px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Use Base Sepolia
          </button>
        )}
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {address.slice(0, 6)}...{address.slice(-4)}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
        >
          Connect {connector.name}
        </button>
      ))}
    </div>
  );
}
