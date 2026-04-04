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
}

export default function WithdrawPage() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
{ connect, connectors } = useConnect();
  const 
  const [spendPrivateKey, setSpendPrivateKey] = useState('');
  const [viewPrivateKey, setViewPrivateKey] = useState('');
  const [merchantName, setMerchantName] = useState('');
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

    setScanning(true);
    setError('');
    setPayments([]);

    try {
      // Fetch events from smart contract
      // In production, use proper event filtering with merchant's ENS node
      const filter = await publicClient?.createContractEventFilter({
        address: CONTRACTS.STEALTH_PAYMENT as `0x${string}`,
        abi: STEALTH_PAYMENT_ABI,
        eventName: 'StealthAnnouncement',
        fromBlock: BigInt(0),
      });

      const logs = filter ? await publicClient?.getFilterLogs({ filter }) : [];

      if (!logs || logs.length === 0) {
        setError('No payments found. This might be a demo environment.');
        // Show mock payment for demo
        const mockEphemeralKeys = [
          '0x0000000000000000000000000000000000000000000000000000000000000001',
        ];
        const scanned = scanStealthPayments(
          viewPrivateKey,
          spendPrivateKey,
          mockEphemeralKeys
        );
        setPayments(
          scanned.map((s) => ({
            ...s,
            balance: BigInt(0),
            ephemeralKey: mockEphemeralKeys[0],
          }))
        );
        setScanning(false);
        return;
      }

      // Extract ephemeral keys from events
      const ephemeralKeys = logs.map((log: any) => log.args.ephemeralPubKey);

      // Scan for stealth addresses
      const scanned = scanStealthPayments(
        viewPrivateKey,
        spendPrivateKey,
        ephemeralKeys
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
            ephemeralKey: ephemeralKeys[index],
          };
        })
      );

      setPayments(paymentsWithBalances.filter((p) => p.balance > BigInt(0)));
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
          <h2 className="text-xl font-semibold mb-4">Step 2: Scan for Payments</h2>
          <button
            onClick={handleScan}
            disabled={scanning || !viewPrivateKey || !spendPrivateKey}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scanning ? 'Scanning...' : 'Scan Blockchain'}
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
              Step 3: Withdraw ({payments.length} payment
              {payments.length !== 1 ? 's' : ''} found)
            </h2>

            {!isConnected && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-blue-800 dark:text-blue-200 mb-2">
                  Connect your wallet to withdraw
                {connectors.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => connect({ connector })}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-2"
                  >
                    Connect {connector.name}
                  </button>
                ))}
                <ConnectKitButton />
              </div>
            )}

            <div className="space-y-4">
              {payments.map((payment, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Stealth Address
                      </div>
                      <code className="text-xs break-all">{payment.address}</code>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatEther(payment.balance)} ETH
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-sm">
                    <div className="text-gray-600 dark:text-gray-400">
                      Ephemeral Key
                    </div>
                    <code className="text-xs break-all">{payment.ephemeralKey}</code>
                  </div>

                  <button
                    onClick={() => handleWithdraw(payment)}
                    disabled={loading || !isConnected}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Withdraw to Connected Wallet
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md text-sm">
              <p className="font-medium mb-2">Total Balance:</p>
              <p className="text-2xl font-bold">
                {formatEther(
                  payments.reduce((sum, p) => sum + p.balance, BigInt(0))
                )}{' '}
                ETH
              </p>
            </div>
          </div>
        )}

        <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-900">
          <h3 className="font-semibold mb-2">How It Works</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>
              <strong>Scanning:</strong> Uses your view key to derive stealth
              addresses from ephemeral keys published on-chain
            </p>
            <p>
              <strong>Detection:</strong> Checks balances of derived addresses to
              find payments
            </p>
            <p>
              <strong>Withdrawal:</strong> Uses spend key + ephemeral key to
              compute private keys for spending
            </p>
            <p>
              <strong>Privacy:</strong> Your keys never leave your browser, all
              crypto is client-side
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
