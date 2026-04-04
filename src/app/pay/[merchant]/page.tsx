'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConnect, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { deriveStealthAddress } from '@/lib/crypto';
import { CONTRACTS, ENS_SUFFIX } from '@/lib/config';
import { STEALTH_PAYMENT_ABI, ENS_REGISTRAR_ABI } from '@/lib/abi';

export default function PaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const merchantName = params.merchant as string;
  const recipientEnsName = merchantName.endsWith(ENS_SUFFIX)
    ? merchantName
    : `${merchantName}${ENS_SUFFIX}`;
  const paymentMethod = searchParams.get('method') || 'walletconnect';

  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState('0.01');
  const [loading, setLoading] = useState(false);
  const [stealthAddress, setStealthAddress] = useState<string>('');
  const [ephemeralKey, setEphemeralKey] = useState<string>('');
  const [privateTxHash, setPrivateTxHash] = useState<`0x${string}` | ''>('');
  const [unlinkTxHash, setUnlinkTxHash] = useState<`0x${string}` | ''>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const { data: contractKeys, isLoading: keysLoading, isError: keysError } = useReadContract({
    address: CONTRACTS.ENS_REGISTRAR as `0x${string}`,
    abi: ENS_REGISTRAR_ABI,
    functionName: 'getPublicKeys',
    args: [merchantName],
  });

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePayWalletConnect = async () => {
    if (!contractKeys) {
      setError('Could not load merchant ENS keys');
      return;
    }

    setLoading(true);
    setError('');
    setPrivateTxHash('');
    setUnlinkTxHash('');
    // Clear previous stealth address to ensure fresh generation
    setStealthAddress('');
    setEphemeralKey('');

    try {
      // Derive stealth address - generates new random ephemeral key each time
      const stealth = deriveStealthAddress(
        contractKeys[0],
        contractKeys[1]
      );

      setStealthAddress(stealth.address);
      setEphemeralKey(stealth.ephemeralPublicKey);

      // Extract the 32-byte x-coordinate from the compressed ephemeral public key.
      // Compressed format: "0x" + parity_byte(1B) + x_coord(32B) = 68 chars total.
      // The contract stores bytes32, so we pass just the x-coord (chars 4 onward).
      const xHex = stealth.ephemeralPublicKey.slice(4); // skip "0x02" or "0x03"
      const ephemeralKeyBytes32 = `0x${xHex}` as `0x${string}`;

      // Call smart contract
      writeContract({
        address: CONTRACTS.STEALTH_PAYMENT as `0x${string}`,
        abi: STEALTH_PAYMENT_ABI,
        functionName: 'sendFunds',
        args: [recipientEnsName, ephemeralKeyBytes32, stealth.address as `0x${string}`],
        value: parseEther(amount),
      });
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePayUnlink = async () => {
    if (!contractKeys) {
      setError('Could not load merchant ENS keys');
      return;
    }

    setLoading(true);
    setError('');
    setPrivateTxHash('');
    setUnlinkTxHash('');
    // Clear previous stealth address to ensure fresh generation
    setStealthAddress('');
    setEphemeralKey('');

    try {
      // Derive stealth address - generates new random ephemeral key each time
      const stealth = deriveStealthAddress(
        contractKeys[0],
        contractKeys[1]
      );

      setStealthAddress(stealth.address);
      setEphemeralKey(stealth.ephemeralPublicKey);

      // Extract the 32-byte x-coordinate from the compressed ephemeral public key.
      const xHex = stealth.ephemeralPublicKey.slice(4); // skip "0x02" or "0x03"
      const ephemeralKeyBytes32 = `0x${xHex}` as `0x${string}`;

      const response = await fetch('/api/private-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEnsName,
          ephemeralKeyBytes32,
          stealthAddress: stealth.address,
          amount,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Private payment failed');
      }

      setPrivateTxHash(result.hash as `0x${string}`);
      setUnlinkTxHash((result.unlinkHash || '') as `0x${string}` | '');
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
    setPrivateTxHash('');
    setUnlinkTxHash('');
    setError('');
  };

  if (!mounted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

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
              <span className="font-medium">Amount:</span> {amount} ETH
            </div>
            {(hash || privateTxHash) && (
              <div>
                <span className="font-medium">Announcement Transaction:</span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${privateTxHash || hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-1 text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {privateTxHash || hash}
                </a>
              </div>
            )}
            {unlinkTxHash && (
              <div>
                <span className="font-medium">Unlink Transfer Hash:</span>
                <code className="block mt-1 p-2 bg-white dark:bg-gray-800 rounded break-all">
                  {unlinkTxHash}
                </code>
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

          {(loading || keysLoading) && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {keysLoading ? 'Loading merchant keys...' : 'Processing...'}
              </p>
            </div>
          )}

          {keysError && (
            <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <p className="text-red-800 dark:text-red-200">Merchant &quot;{merchantName}&quot; is not registered on ENStealth.</p>
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
                  disabled={loading || keysLoading || isConfirming || !amount || !contractKeys}
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
                disabled={loading || keysLoading || !amount || !contractKeys}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Send Private Payment'}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Private payment is sent via Unlink and then announced on-chain for discovery.
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
                2. An ephemeral key (R) is announced on-chain by the contract
              </p>
              <p>
                3. The merchant scans on-chain announcements using their private keys to find and withdraw
              </p>
              <p>
                4. Each payment is unlinkable to others for maximum privacy
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
