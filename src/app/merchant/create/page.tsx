'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { generateStealthKeys } from '@/lib/crypto';
import { ENS_SUFFIX, CONTRACTS } from '@/lib/config';
import { ENS_REGISTRAR_ABI } from '@/lib/abi';

export default function CreateMerchant() {
  const [merchantName, setMerchantName] = useState('');
  const [keys, setKeys] = useState<{
    spendPrivateKey: string;
    viewPrivateKey: string;
    spendPublicKey: string;
    viewPublicKey: string;
  } | null>(null);
  const [showPrivateKeys, setShowPrivateKeys] = useState(false);
  const [registrationTxHash, setRegistrationTxHash] = useState<`0x${string}` | null>(null);

  const { address, isConnected } = useAccount();
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: registrationTxHash || undefined,
  });

  const handleGenerate = () => {
    const newKeys = generateStealthKeys();
    setKeys(newKeys);
  };

  const handleRegisterOnChain = async () => {
    if (!keys || !merchantName || !isConnected) return;

    try {
      // Convert public keys from hex string to bytes32
      const spendKeyBytes = keys.spendPublicKey.startsWith('0x') 
        ? keys.spendPublicKey 
        : `0x${keys.spendPublicKey}`;
      const viewKeyBytes = keys.viewPublicKey.startsWith('0x')
        ? keys.viewPublicKey
        : `0x${keys.viewPublicKey}`;

      writeContract({
        address: CONTRACTS.ENS_REGISTRAR as `0x${string}`,
        abi: ENS_REGISTRAR_ABI,
        functionName: 'registerSubdomain',
        args: [merchantName, spendKeyBytes as `0x${string}`, viewKeyBytes as `0x${string}`],
      });
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  // Update registration tx hash when transaction is submitted
  if (txHash && !registrationTxHash) {
    setRegistrationTxHash(txHash);
  }

  const handleDownload = () => {
    if (!keys) return;

    const data = {
      merchantName: merchantName + ENS_SUFFIX,
      ...keys,
      createdAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${merchantName}-stealth-keys.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Merchant Account</h1>

      <div className="space-y-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Choose Name</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Merchant Name
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="mystore"
                  className="flex-1 px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                />
                <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-l-0 rounded-r-md">
                  {ENS_SUFFIX}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                This will be your payment address: {merchantName || 'mystore'}
                {ENS_SUFFIX}
              </p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Step 2: Generate Stealth Keys
          </h2>
          <button
            onClick={handleGenerate}
            disabled={!merchantName}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Keys
          </button>

          {keys && (
            <div className="mt-6 space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  ⚠️ Save your private keys securely! You&apos;ll need them to withdraw
                  funds.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Public Keys (Share these)</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400">
                      Spend Public Key
                    </label>
                    <code className="block p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs break-all">
                      {keys.spendPublicKey}
                    </code>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400">
                      View Public Key
                    </label>
                    <code className="block p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs break-all">
                      {keys.viewPublicKey}
                    </code>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Private Keys (Keep secret!)</h3>
                  <button
                    onClick={() => setShowPrivateKeys(!showPrivateKeys)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showPrivateKeys ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showPrivateKeys && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400">
                        Spend Private Key
                      </label>
                      <code className="block p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs break-all">
                        {keys.spendPrivateKey}
                      </code>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400">
                        View Private Key
                      </label>
                      <code className="block p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs break-all">
                        {keys.viewPrivateKey}
                      </code>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleDownload}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                📥 Download Keys (JSON)
              </button>
            </div>
          )}
        </div>

        {keys && (
          <div className="border-2 border-purple-500 rounded-lg p-6 bg-purple-50 dark:bg-purple-900/20">
            <h2 className="text-xl font-semibold mb-4">
              Step 3: Register Subdomain On-Chain
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Register <strong>{merchantName}{ENS_SUFFIX}</strong> on the blockchain
                with your public keys. This allows anyone to send you private stealth payments.
              </p>

              {!isConnected && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 Connect your wallet to register your subdomain on-chain
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    ❌ Error: {error.message}
                  </p>
                </div>
              )}

              {registrationTxHash && isConfirming && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⏳ Confirming registration transaction...
                  </p>
                </div>
              )}

              {isConfirmed && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                  <p className="text-sm text-green-800 dark:text-green-200 font-semibold">
                    ✅ Successfully registered {merchantName}{ENS_SUFFIX}!
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                    Your subdomain is now live and ready to receive stealth payments.
                  </p>
                </div>
              )}

              <button
                onClick={handleRegisterOnChain}
                disabled={!isConnected || isPending || isConfirming || isConfirmed}
                className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending || isConfirming
                  ? '⏳ Registering...'
                  : isConfirmed
                  ? '✅ Registered!'
                  : '🚀 Register Subdomain On-Chain'}
              </button>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                This transaction will:
                <ul className="list-disc list-inside ml-2 mt-1">
                  <li>Create {merchantName}{ENS_SUFFIX} subdomain</li>
                  <li>Store your public keys in ENS records</li>
                  <li>Enable permissionless stealth payments</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-900">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>Spend Key:</strong> Used to derive stealth addresses and
              spend received funds
            </p>
            <p>
              <strong>View Key:</strong> Used to scan for incoming payments
              without exposing spend key
            </p>
            <p>
              <strong>ENS Registration:</strong> Your public keys are stored on-chain,
              allowing anyone to send you stealth payments
            </p>
            <p>
              <strong>Privacy:</strong> Each payment goes to a unique address,
              unlinkable to others
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
