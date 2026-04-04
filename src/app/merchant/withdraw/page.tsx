'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useConnect } from 'wagmi';
import { scanStealthPayments } from '@/lib/crypto';
import { CONTRACTS } from '@/lib/config';
import { STEALTH_PAYMENT_ABI } from '@/lib/abi';
import { formatEther } from 'viem';

interface StealthPayment {
  address: string;
  privateKey: string;
  balance: bigint;
  ephemeralKey: string;
  sender?: string;
  blockNumber?: bigint;
  transactionHash?: string;
}

export default function WithdrawPage() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { connect, connectors } = useConnect();
  const [spendPrivateKey, setSpendPrivateKey] = useState('');
  const [viewPrivateKey, setViewPrivateKey] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [ephemeralKeys, setEphemeralKeys] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [payments, setPayments] = useState<StealthPayment[]>([]);
  const [error, setError] = useState('');

  const handleLoadKeys = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setSpendPrivateKey(data.spendPrivateKey || '');
        setViewPrivateKey(data.viewPrivateKey || '');
        setMerchantName(data.merchantName || '');
      } catch (err) {
        setError('Invalid key file');
      }
    };
    reader.readAsText(file);
  };

  const handleScan = async () => {
    if (!spendPrivateKey || !viewPrivateKey) {
      setError('Please provide both private keys');
      return;
    }

    if (!ephemeralKeys.trim()) {
      setError('Please provide at least one ephemeral key');
      return;
    }

    setScanning(true);
    setError('');
    setPayments([]);

    try {
      // Parse ephemeral keys (one per line)
      const keysList = ephemeralKeys
        .split('\n')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      if (keysList.length === 0) {
        setError('No valid ephemeral keys provided');
        setScanning(false);
        return;
      }

      // Scan for stealth addresses using the provided ephemeral keys
      const scanned = scanStealthPayments(
        viewPrivateKey,
        spendPrivateKey,
        keysList
      );

      // Check balances
      const paymentsWithBalances = await Promise.all(
        scanned.map(async (payment, index) => {
          const balance = await publicClient?.getBalance({
            address: payment.address as `0x${string}`,
          });
          return {
            ...payment,
            balance: balance || BigInt(0),
            ephemeralKey: keysList[index],
          };
        })
      );

      const nonZero = paymentsWithBalances.filter((p) => p.balance > BigInt(0));
      
      if (nonZero.length === 0) {
        setError('No payments found with balance. The ephemeral keys might be incorrect or funds already withdrawn.');
      } else {
        setPayments(nonZero);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to scan for payments');
    } finally {
      setScanning(false);
    }
  };

  const handleWithdraw = async (payment: StealthPayment) => {
    setLoading(true);
    setError('');

    try {
      // In production, use the private key to sign and send a transaction
      // This requires importing the account with the stealth private key
      // For demo purposes, show instructions

      alert(`To withdraw:
1. Import this private key to MetaMask (temporary account)
2. Send the funds to your main wallet
3. Delete the temporary account

Private Key: ${payment.privateKey}
Balance: ${formatEther(payment.balance)} ETH`);
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Withdraw Funds</h1>

      <div className="space-y-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Load Keys</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Upload Key File (JSON)
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleLoadKeys}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">Or enter manually:</div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Merchant Name
              </label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="merchant.enstealth.eth"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                View Private Key
              </label>
              <input
                type="password"
                value={viewPrivateKey}
                onChange={(e) => setViewPrivateKey(e.target.value)}
                placeholder="Your view private key"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Spend Private Key
              </label>
              <input
                type="password"
                value={spendPrivateKey}
                onChange={(e) => setSpendPrivateKey(e.target.value)}
                placeholder="Your spend private key"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              />
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: Enter Ephemeral Keys</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Paste the ephemeral keys (R values) from your payments, one per line. You can find these in the payment confirmation screens.
          </p>
          <textarea
            value={ephemeralKeys}
            onChange={(e) => setEphemeralKeys(e.target.value)}
            placeholder="0x02a1b2c3d4e5f6...&#10;0x03b2c3d4e5f6a7...&#10;0x04c3d4e5f6a7b8..."
            rows={6}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            💡 Compressed format (33 bytes) or x-coordinate (32 bytes) both work
          </p>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Step 3: Scan for Payments</h2>
          <button
            onClick={handleScan}
            disabled={scanning || !viewPrivateKey || !spendPrivateKey || !ephemeralKeys.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scanning ? 'Scanning...' : '🔍 Scan for Payments'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-yellow-800 dark:text-yellow-200">{error}</p>
            </div>
          )}
        </div>

        {payments.length > 0 && (
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Step 4: Withdraw ({payments.length} payment
              {payments.length !== 1 ? 's' : ''} found)
            </h2>

            {!isConnected && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-blue-800 dark:text-blue-200 mb-2">
                  Connect your wallet to withdraw
                </p>
                {connectors.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => connect({ connector })}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-2"
                  >
                    Connect {connector.name}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-4">
              {payments.map((payment, index) => (
                <div key={index} className="border border-green-500 rounded-lg p-6 bg-green-50 dark:bg-green-900/20">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                        Payment #{index + 1}
                      </div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatEther(payment.balance)} ETH
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        🎯 STEALTH ADDRESS
                      </div>
                      <code className="text-sm break-all bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                        {payment.address}
                      </code>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        🔑 EPHEMERAL KEY (R)
                      </div>
                      <code className="text-xs break-all bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                        {payment.ephemeralKey}
                      </code>
                    </div>

                    {payment.sender && (
                      <div>
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          👤 SENDER
                        </div>
                        <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                          {payment.sender}
                        </code>
                      </div>
                    )}

                    {payment.blockNumber && (
                      <div className="flex gap-4">
                        <div>
                          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            📦 BLOCK
                          </div>
                          <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                            {payment.blockNumber.toString()}
                          </code>
                        </div>
                        {payment.transactionHash && (
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              🔗 TX HASH
                            </div>
                            <a
                              href={`https://sepolia.etherscan.io/tx/${payment.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                            >
                              {payment.transactionHash.slice(0, 10)}...{payment.transactionHash.slice(-8)}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleWithdraw(payment)}
                    disabled={loading || !isConnected}
                    className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    💸 Withdraw {formatEther(payment.balance)} ETH
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border-2 border-green-300 dark:border-green-700">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Total Funds Available
                  </p>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {formatEther(
                      payments.reduce((sum, p) => sum + p.balance, BigInt(0))
                    )}{' '}
                    ETH
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Across {payments.length} stealth address{payments.length !== 1 ? 'es' : ''}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    🔒 Privacy preserved
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-900">
          <h3 className="font-semibold mb-2">How It Works</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>
              <strong>Step 1:</strong> Load your merchant private keys (spend + view keys)
            </p>
            <p>
              <strong>Step 2:</strong> Enter ephemeral keys (R values) from payments - you should have saved these when payments were made
            </p>
            <p>
              <strong>Step 3:</strong> Scan derives stealth addresses using your view key and the ephemeral keys
            </p>
            <p>
              <strong>Step 4:</strong> Withdraw computes the private keys using your spend key to access funds
            </p>
            <p>
              <strong>Privacy:</strong> Your keys never leave your browser - all crypto is client-side
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
