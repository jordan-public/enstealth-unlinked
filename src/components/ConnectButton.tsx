'use client';

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';
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

  const isWrongNetwork = isConnected && chain?.id !== sepolia.id;

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
      <div className="flex gap-2">
        {isWrongNetwork && (
          <button
            onClick={() => switchChain({ chainId: sepolia.id })}
            className="px-4 py-2 rounded-md text-sm font-medium bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            Switch to Sepolia
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
          onClick={() => connect({ connector, chainId: sepolia.id })}
          className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
        >
          Connect {connector.name}
        </button>
      ))}
    </div>
  );
}
