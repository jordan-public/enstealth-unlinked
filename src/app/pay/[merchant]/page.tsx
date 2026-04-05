'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConnect, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { sepolia } from 'wagmi/chains';
import { deriveStealthAddress } from '@/lib/crypto';
import { CONTRACTS, ENS_SUFFIX } from '@/lib/config';
import { STEALTH_PAYMENT_ABI, ENS_REGISTRAR_ABI } from '@/lib/abi';

interface PrivatePaymentStatus {
  sdkConfigured: boolean;
  mode: string;
  rail: string;
  dryRunEnabled: boolean;
  missingUnlinkConfig: string[];
}

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
  const [unlinkTxId, setUnlinkTxId] = useState<string>('');
  const [unlinkStatus, setUnlinkStatus] = useState<string>('');
  const [privateRail, setPrivateRail] = useState<string>('');
  const [simulatedPayment, setSimulatedPayment] = useState(false);
  const [privatePaymentStatus, setPrivatePaymentStatus] = useState<PrivatePaymentStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const unlinkTokenSymbol = process.env.NEXT_PUBLIC_UNLINK_TOKEN_SYMBOL || 'TOKEN';
  const unlinkEnabled = process.env.NEXT_PUBLIC_UNLINK_ENABLED === 'true';
  const unlinkTokenAddress = process.env.NEXT_PUBLIC_UNLINK_TOKEN_ADDRESS || '';
  const dryRunEnabled = process.env.NEXT_PUBLIC_PRIVATE_PAYMENT_DRY_RUN === 'true';
  const unlinkPublicReady = unlinkEnabled && unlinkTokenAddress.length === 42;
  const amountUnit = paymentMethod === 'walletconnect' ? 'ETH' : unlinkTokenSymbol;

  const { data: contractKeys, isLoading: keysLoading, isError: keysError } = useReadContract({
    address: CONTRACTS.ENS_REGISTRAR as `0x${string}`,
    abi: ENS_REGISTRAR_ABI,
    functionName: 'getPublicKeys',
    args: [merchantName],
    chainId: sepolia.id,
  });

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadPrivatePaymentStatus = async () => {
    setStatusLoading(true);
    try {
      const response = await fetch('/api/private-payment-status', { cache: 'no-store' });
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as PrivatePaymentStatus;
      setPrivatePaymentStatus(data);
    } catch {
      // Keep UI functional if status endpoint is unavailable.
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (paymentMethod === 'unlink') {
      void loadPrivatePaymentStatus();
    }
  }, [paymentMethod]);

  const handlePayWalletConnect = async () => {
    if (!contractKeys) {
      setError('Could not load merchant ENS keys');
      return;
    }

    setLoading(true);
    setError('');
    setPrivateTxHash('');
    setUnlinkTxId('');
    setUnlinkStatus('');
    setPrivateRail('');
    setSimulatedPayment(false);
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
    setUnlinkTxId('');
    setUnlinkStatus('');
    setPrivateRail('');
    setSimulatedPayment(false);
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
          dryRun: dryRunEnabled,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Private payment failed');
      }

      setPrivateTxHash((result.hash || '') as `0x${string}` | '');
      setUnlinkTxId(result.unlinkTxId || '');
      setUnlinkStatus(result.unlinkStatus || result.mode || '');
      setPrivateRail(result.rail || result.mode || '');
      setSimulatedPayment(result.simulated === true);
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
    setUnlinkTxId('');
    setUnlinkStatus('');
    setPrivateRail('');
    setSimulatedPayment(false);
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
          {paymentMethod === 'unlink' ? (
            <div className="mb-4 rounded-md border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 text-xs text-indigo-900 dark:text-indigo-200">
              <strong>Rail confirmation:</strong> Unlink token transfer runs on <strong>Base Sepolia</strong> and the stealth announcement is recorded on <strong>Ethereum Sepolia</strong>.
            </div>
          ) : (
            <div className="mb-4 rounded-md border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 text-xs text-blue-900 dark:text-blue-200">
              <strong>Rail confirmation:</strong> ETH transfer and stealth announcement are both on <strong>Ethereum Sepolia</strong>.
            </div>
          )}
          {simulatedPayment && (
            <div className="mb-4 inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              Simulated only - not broadcast on-chain
            </div>
          )}
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Stealth Address:</span>
              <code className="block mt-1 p-2 bg-white dark:bg-gray-800 rounded break-all">
                {stealthAddress}
              </code>
            </div>
            <div>
              <span className="font-medium">Amount:</span> {amount} {amountUnit}
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
            {paymentMethod === 'unlink' && (
              <div className="text-xs text-gray-700 dark:text-gray-300">
                Note: the announcement tx above is Sepolia-only metadata; token movement happens on Base Sepolia via Unlink.
              </div>
            )}
            {unlinkTxId && (
              <div>
                <span className="font-medium">Unlink Transaction ID:</span>
                <code className="block mt-1 p-2 bg-white dark:bg-gray-800 rounded break-all">
                  {unlinkTxId}
                </code>
              </div>
            )}
            {unlinkStatus && (
              <div>
                <span className="font-medium">Private Transfer Status:</span> {unlinkStatus}
              </div>
            )}
            {privateRail && (
              <div>
                <span className="font-medium">Payment Rail:</span> {privateRail}
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
                  Amount ({amountUnit})
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

              <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium">Rail Status</div>
                  {paymentMethod === 'unlink' && (
                    <button
                      type="button"
                      onClick={() => void loadPrivatePaymentStatus()}
                      disabled={statusLoading}
                      className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                      {statusLoading ? 'Refreshing...' : 'Refresh Status'}
                    </button>
                  )}
                </div>
                {paymentMethod === 'walletconnect' ? (
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Direct wallet flow. Your connected wallet signs and sends an ETH stealth payment transaction.
                  </p>
                ) : (
                  <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                    <p>
                      Target private unit: {unlinkTokenSymbol}
                    </p>
                    <p>
                      Public rail config: {unlinkPublicReady ? 'ready' : 'incomplete'}
                    </p>
                    <p>
                      Safety mode (no broadcast): {dryRunEnabled ? 'enabled' : 'disabled'}
                    </p>
                    <p>
                      Server rail status:{' '}
                      {privatePaymentStatus
                        ? `${privatePaymentStatus.mode} (${privatePaymentStatus.rail})`
                        : statusLoading
                        ? 'loading...'
                        : 'unavailable'}
                    </p>
                    {privatePaymentStatus && privatePaymentStatus.missingUnlinkConfig.length > 0 && (
                      <p>
                        Missing server config: {privatePaymentStatus.missingUnlinkConfig.join(', ')}
                      </p>
                    )}
                    {privatePaymentStatus && privatePaymentStatus.dryRunEnabled && (
                      <p>
                        Server no-broadcast: enabled
                      </p>
                    )}
                    <p>
                      Server behavior: uses only Unlink token rail; if config is missing, payment is blocked.
                    </p>
                  </div>
                )}
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
                disabled={
                  loading ||
                  keysLoading ||
                  !amount ||
                  !contractKeys ||
                  (privatePaymentStatus !== null && !privatePaymentStatus.sdkConfigured)
                }
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Send Private Payment'}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Private payment requires Unlink SDK configuration and uses Base Sepolia token rail only.
              </p>
              {privatePaymentStatus && !privatePaymentStatus.sdkConfigured && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Unlink is currently blocked. Missing config: {privatePaymentStatus.missingUnlinkConfig.join(', ')}
                </p>
              )}
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
