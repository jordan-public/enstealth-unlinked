'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConnect } from 'wagmi';
import { parseEther } from 'viem';
import { deriveStealthAddress } from '@/lib/crypto';
import { CONTRACTS } from '@/lib/config';
import { STEALTH_PAYMENT_ABI } from '@/lib/abi';

export default function PaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const merchantName = params.merchant as string;
  const paymentMethod = searchParams.get('method') || 'walletconnect';

  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [amount, setAmount] = useState('0.01');
  const [loading, setLoading] = useState(false);
  const [stealthAddress, setStealthAddress] = useState<string>('');
  const [ephemeralKey, setEphemeralKey] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  // Mock ENS resolution - in production, fetch from actual ENS
  const [ensKeys, setEnsKeys] = useState<{
    spendPublicKey: string;
    viewPublicKey: string;
  } | null>(null);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  useEffect(() => {
    // Mock ENS resolution
    // In production, fetch from ENS text records
    const mockResolveENS = async () => {
      setLoading(true);
      try {
        // Simulate ENS lookup delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock keys - in production, fetch from ENS
        setEnsKeys({
          spendPublicKey:
            '0x04c8b8c8e8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8',
          viewPublicKey:
            '0x04d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9',
        });
      } catch (err) {
        setError('Failed to resolve ENS name');
      } finally {
        setLoading(false);
      }
    };

    mockResolveENS();
  }, [merchantName]);

  const handlePayWalletConnect = async () => {
    if (!ensKeys) {
      setError('ENS keys not loaded');
      return;
    }

    setLoading(true);
    setError('');
    // Clear previous stealth address to ensure fresh generation
    setStealthAddress('');
    setEphemeralKey('');

    try {
      // Derive stealth address - generates new random ephemeral key each time
      const stealth = deriveStealthAddress(
        ensKeys.spendPublicKey,
        ensKeys.viewPublicKey
      );

      setStealthAddress(stealth.address);
      setEphemeralKey(stealth.ephemeralPublicKey);

      // Convert ephemeral key to bytes32 (take first 32 bytes of x-coordinate)
      const ephemeralKeyBytes32 = stealth.ephemeralPublicKey.slice(0, 66) as `0x${string}`;

      // Call smart contract
      writeContract({
        address: CONTRACTS.STEALTH_PAYMENT as `0x${string}`,
        abi: STEALTH_PAYMENT_ABI,
        functionName: 'sendFunds',
        args: [merchantName, ephemeralKeyBytes32, stealth.address as `0x${string}`],
        value: parseEther(amount),
      });
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePayUnlink = async () => {
    if (!ensKeys) {
      setError('ENS keys not loaded');
      return;
    }

    setLoading(true);
    setError('');
    // Clear previous stealth address to ensure fresh generation
    setStealthAddress('');
    setEphemeralKey('');

    try {
      // Derive stealth address - generates new random ephemeral key each time
      const stealth = deriveStealthAddress(
        ensKeys.spendPublicKey,
        ensKeys.viewPublicKey
      );

      setStealthAddress(stealth.address);
      setEphemeralKey(stealth.ephemeralPublicKey);

      // In production, call Unlink API to send private transaction
      // For now, show mock success
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Optionally announce via contract
      // await announcePayment(...)

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      setSuccess(true);
    }
  }, [isConfirmed]);

  const handleReset = () => {
    setSuccess(false);
    setStealthAddress('');
    setEphemeralKey('');
    setError('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Back
        </a>
      </div>

      <h1 className="text-3xl font-bold mb-2">Pay {merchantName}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Send a private payment using stealth addresses
      </p>

      {success ? (
        <div className="border rounded-lg p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <h2 className="text-xl font-semibold mb-4 text-green-800 dark:text-green-200">
            ✅ Payment Sent!
          </h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Stealth Address:</span>
              <code className="block mt-1 p-2 bg-white dark:bg-gray-800 rounded break-all">
                {stealthAddress}
              </code>
            </div>
            <div>
              <span className="font-medium">Ephemeral Key (R):</span>
              <code className="block mt-1 p-2 bg-white dark:bg-gray-800 rounded break-all">
                {ephemeralKey}
              </code>
            </div>
            <div>
              <span className="font-medium">Amount:</span> {amount} ETH
            </div>
            {hash && (
              <div>
                <span className="font-medium">Transaction:</span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-1 text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {hash}
                </a>
              </div>
            )}
          </div>
          <button
            onClick={handleReset}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Make Another Payment
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() =>
                      (window.location.href = `/pay/${merchantName}?method=walletconnect`)
                    }
                    className={`p-4 border rounded-md ${
                      paymentMethod === 'walletconnect'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : ''
                    }`}
                  >
                    <div className="font-semibold">WalletConnect</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Standard wallet
                    </div>
                  </button>
                  <button
                    onClick={() =>
                      (window.location.href = `/pay/${merchantName}?method=unlink`)
                    }
                    className={`p-4 border rounded-md ${
                      paymentMethod === 'unlink'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : ''
                    }`}
                  >
                    <div className="font-semibold">Unlink</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Private sender
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Processing...
              </p>
            </div>
          )}

          {error && (
            <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {paymentMethod === 'walletconnect' ? (
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Pay with WalletConnect</h3>
              {!isConnected ? (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Connect your wallet to continue
                  </p>
                  {connectors.map((connector) => (
                    <button
                      key={connector.id}
                      onClick={() => connect({ connector })}
                      className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-2 mb-2"
                    >
                      Connect {connector.name}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={handlePayWalletConnect}
                  disabled={loading || isConfirming || !amount}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConfirming ? 'Confirming...' : 'Send Payment'}
                </button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Pay with Unlink (Private)</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Unlink hides your sender address for maximum privacy
              </p>
              <button
                onClick={handlePayUnlink}
                disabled={loading || !amount}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Send Private Payment'}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Note: This is a demo. Integrate with actual Unlink API in
                production.
              </p>
            </div>
          )}

          <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-900">
            <h3 className="font-semibold mb-2">How It Works</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>
                1. Your payment goes to a unique stealth address derived from the
                merchant&apos;s public keys
              </p>
              <p>
                2. An ephemeral key is published so the merchant can discover the
                payment
              </p>
              <p>
                3. Only the merchant can derive the private key to spend the funds
              </p>
              <p>4. Each payment is unlinkable to others for maximum privacy</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
