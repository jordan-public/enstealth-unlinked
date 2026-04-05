'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { scanStealthPayments } from '@/lib/crypto';
import { CONTRACTS, ENS_SUFFIX, UNLINK_PUBLIC_CONFIG } from '@/lib/config';
import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  formatEther,
  formatUnits,
  http,
  isAddress,
  keccak256,
  parseAbiItem,
  parseEther,
  stringToHex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia, sepolia } from 'viem/chains';

interface StealthPayment {
  address: string;
  privateKey: string;
  balance: bigint;
  asset: 'ETH' | 'TOKEN';
  assetSymbol: string;
  decimals: number;
  chainId: number;
  tokenAddress?: `0x${string}`;
  ephemeralKey: string;
  sender?: string;
  blockNumber?: bigint;
  transactionHash?: string;
}

const BASE_GAS_TOP_UP_AMOUNT = parseEther('0.00005');

export default function WithdrawPage() {
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [mounted, setMounted] = useState(false);
  const [spendPrivateKey, setSpendPrivateKey] = useState('');
  const [viewPrivateKey, setViewPrivateKey] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [payments, setPayments] = useState<StealthPayment[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [scanRail, setScanRail] = useState<'all' | 'sepolia' | 'base'>('all');

  const sepoliaClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'),
  });

  const hasTokenRail =
    UNLINK_PUBLIC_CONFIG.enabled &&
    Boolean(UNLINK_PUBLIC_CONFIG.tokenAddress) &&
    isAddress(UNLINK_PUBLIC_CONFIG.tokenAddress);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatPaymentAmount = (payment: StealthPayment) =>
    `${formatUnits(payment.balance, payment.decimals)} ${payment.assetSymbol}`;

  const getExplorerTxUrl = (chainId: number, txHash: string) => {
    if (chainId === baseSepolia.id) {
      return `https://sepolia.basescan.org/tx/${txHash}`;
    }
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  };

  const getChainLabel = (chainId: number) => {
    if (chainId === baseSepolia.id) {
      return 'Base Sepolia';
    }
    return 'Sepolia';
  };

  const selectedRailLabel =
    scanRail === 'all'
      ? 'Both Rails'
      : scanRail === 'base'
      ? 'Base Sepolia'
      : 'Ethereum Sepolia';

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
    if (!spendPrivateKey || !viewPrivateKey || !merchantName) {
      setError('Please provide merchant name and both private keys');
      return;
    }

    setScanning(true);
    setError('');
    setPayments([]);

    try {
      const normalizedMerchantName = merchantName.endsWith(ENS_SUFFIX)
        ? merchantName
        : `${merchantName}${ENS_SUFFIX}`;
      const ensNode = keccak256(stringToHex(normalizedMerchantName));
      const currentBlock = await sepoliaClient.getBlockNumber();
      const fromBlock = currentBlock > BigInt(1000) ? currentBlock - BigInt(1000) : BigInt(0);

      const logs = await sepoliaClient.getLogs({
        address: CONTRACTS.STEALTH_PAYMENT as `0x${string}`,
        event: parseAbiItem(
          'event StealthAnnouncement(bytes32 indexed ensNode, bytes32 ephemeralPubKey, address indexed stealthAddress, uint256 amount, address indexed sender)'
        ),
        args: {
          ensNode,
        },
        fromBlock,
        toBlock: currentBlock,
      });

      const keysList = logs
        .map((log) => log.args.ephemeralPubKey)
        .filter((value): value is `0x${string}` => Boolean(value));

      if (keysList.length === 0) {
        setError(`No announcements found for ${normalizedMerchantName} in the last 1000 blocks.`);
        return;
      }

      const matchedStealthPayments = logs
        .map((log) => {
          const ephemeralPubKey = log.args.ephemeralPubKey;
          const announcedStealthAddress = log.args.stealthAddress;

          if (!ephemeralPubKey || !announcedStealthAddress) {
            return null;
          }

          const candidates = scanStealthPayments(viewPrivateKey, spendPrivateKey, [ephemeralPubKey]);
          const match = candidates.find(
            (candidate) =>
              candidate.address.toLowerCase() === announcedStealthAddress.toLowerCase()
          );

          if (!match) {
            return null;
          }

          return {
            payment: match,
            eventMeta: log,
            ephemeralPubKey,
          };
        })
        .filter((value): value is NonNullable<typeof value> => value !== null);

      if (matchedStealthPayments.length === 0) {
        setError(
          'Announcements were found, but the provided spend/view private keys did not match any announced stealth addresses.'
        );
        return;
      }

      const baseClient = hasTokenRail
        ? createPublicClient({
            chain: baseSepolia,
            transport: http(UNLINK_PUBLIC_CONFIG.rpcUrl),
          })
        : null;

      const tokenAddress = hasTokenRail
        ? (UNLINK_PUBLIC_CONFIG.tokenAddress as `0x${string}`)
        : undefined;

      const discovered = await Promise.all(
        matchedStealthPayments.map(async ({ payment, eventMeta, ephemeralPubKey }) => {

          const ethBalance = await sepoliaClient.getBalance({
            address: payment.address as `0x${string}`,
          });

          const results: StealthPayment[] = [];

          if ((scanRail === 'all' || scanRail === 'sepolia') && ethBalance > BigInt(0)) {
            results.push({
              ...payment,
              balance: ethBalance,
              asset: 'ETH',
              assetSymbol: 'ETH',
              decimals: 18,
              chainId: sepolia.id,
              ephemeralKey: ephemeralPubKey,
              sender: eventMeta?.args.sender,
              transactionHash: eventMeta?.transactionHash,
              blockNumber: eventMeta?.blockNumber,
            });
          }

          if ((scanRail === 'all' || scanRail === 'base') && baseClient && tokenAddress) {
            const tokenBalance = await baseClient.readContract({
              address: tokenAddress,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [payment.address as `0x${string}`],
            });

            if (tokenBalance > BigInt(0)) {
              results.push({
                ...payment,
                balance: tokenBalance,
                asset: 'TOKEN',
                assetSymbol: UNLINK_PUBLIC_CONFIG.tokenSymbol,
                decimals: UNLINK_PUBLIC_CONFIG.tokenDecimals,
                chainId: baseSepolia.id,
                tokenAddress,
                ephemeralKey: ephemeralPubKey,
                sender: eventMeta?.args.sender,
                transactionHash: eventMeta?.transactionHash,
                blockNumber: eventMeta?.blockNumber,
              });
            }
          }

          return results;
        })
      );

      const flattened = discovered.flat();
      const deduped = new Map<string, StealthPayment>();
      for (const payment of flattened) {
        const key = `${payment.asset}:${payment.address.toLowerCase()}`;
        const existing = deduped.get(key);
        if (!existing || payment.balance > existing.balance) {
          deduped.set(key, payment);
        }
      }

      const nonZero = Array.from(deduped.values());
      
      if (nonZero.length === 0) {
        setError(`No payments found with balance on ${selectedRailLabel}.`);
      } else {
        setPayments(nonZero);
      }
    } catch (err: any) {
      const message = String(err?.message || '');
      const isRpcOrNetworkError =
        message.includes('Failed to fetch') ||
        message.includes('HTTP request failed') ||
        message.includes('eth_blockNumber') ||
        message.includes('rpc') ||
        message.includes('network');

      if (isRpcOrNetworkError) {
        setError(`Scan RPC failed while reading Sepolia or Base Sepolia: ${message}`);
      } else {
        setError(err.message || 'Failed to scan for payments');
      }
    } finally {
      setScanning(false);
    }
  };

  const withdrawSinglePayment = async (payment: StealthPayment): Promise<string> => {
    if (!isAddress(destinationAddress)) {
      throw new Error('Please enter a valid destination Ethereum address');
    }

    const account = privateKeyToAccount(payment.privateKey as `0x${string}`);

    if (payment.asset === 'ETH') {
      const sepoliaClientForWithdraw = createPublicClient({
        chain: sepolia,
        transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'),
      });

      const walletClient = createWalletClient({
        account,
        chain: sepolia,
        transport: http(),
      });

      const gasPrice = await sepoliaClientForWithdraw.getGasPrice();
      const gasLimit = BigInt(21000);
      const fee = gasPrice * gasLimit;

      if (payment.balance <= fee) {
        throw new Error(`Balance too low to cover network fee for ${payment.address}`);
      }

      const value = payment.balance - fee;

      const hash = await walletClient.sendTransaction({
        to: destinationAddress as `0x${string}`,
        value,
        gas: gasLimit,
        gasPrice,
      });

      await sepoliaClientForWithdraw.waitForTransactionReceipt({ hash });
      return hash;
    }

    if (!payment.tokenAddress) {
      throw new Error('Token payment missing token address');
    }

    const baseClient = createPublicClient({
      chain: baseSepolia,
      transport: http(UNLINK_PUBLIC_CONFIG.rpcUrl),
    });

    let baseNativeBalance = await baseClient.getBalance({
      address: payment.address as `0x${string}`,
    });

    if (baseNativeBalance < BASE_GAS_TOP_UP_AMOUNT) {
      const topUpResponse = await fetch('/api/base-gas-topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: payment.address,
          amountWei: BASE_GAS_TOP_UP_AMOUNT.toString(),
        }),
      });

      const topUpResult = await topUpResponse.json();

      if (!topUpResponse.ok) {
        throw new Error(topUpResult.error || 'Automatic Base gas top-up failed.');
      }

      await baseClient.waitForTransactionReceipt({ hash: topUpResult.hash as `0x${string}` });
      baseNativeBalance = await baseClient.getBalance({
        address: payment.address as `0x${string}`,
      });

      if (baseNativeBalance < BASE_GAS_TOP_UP_AMOUNT) {
        throw new Error(
          `Automatic Base Sepolia gas top-up did not arrive for ${payment.address}.`
        );
      }
    }

    const tokenWalletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(UNLINK_PUBLIC_CONFIG.rpcUrl),
    });

    const hash = await tokenWalletClient.writeContract({
      address: payment.tokenAddress,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [destinationAddress as `0x${string}`, payment.balance],
      account,
    });

    await baseClient.waitForTransactionReceipt({ hash });
    return hash;
  };

  const handleWithdraw = async (payment: StealthPayment) => {
    setLoading(true);
    setError('');
    setStatus('Preparing withdrawal transaction...');

    try {
      setStatus(`Sending ${formatPaymentAmount(payment)} to ${destinationAddress}...`);

      const hash = await withdrawSinglePayment(payment);

      setStatus('Waiting for confirmation...');
      setPayments((prev) =>
        prev.filter(
          (p) =>
            !(
              p.address.toLowerCase() === payment.address.toLowerCase() &&
              p.asset === payment.asset &&
              p.chainId === payment.chainId
            )
        )
      );
      setStatus(`Withdrawal confirmed: ${hash}`);
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawAll = async () => {
    if (!isAddress(destinationAddress)) {
      setError('Please enter a valid destination Ethereum address');
      return;
    }

    if (payments.length === 0) {
      setError('No payments available to withdraw');
      return;
    }

    setLoading(true);
    setError('');
    let completed = 0;

    try {
      for (const payment of payments) {
        try {
          setStatus(
            `Withdrawing payment ${completed + 1}/${payments.length}: ${formatPaymentAmount(payment)}...`
          );

          await withdrawSinglePayment(payment);
          completed += 1;
        } catch {
          // Continue with the next stealth address
        }
      }

      setPayments([]);
      setStatus(`Completed ${completed} withdrawal${completed !== 1 ? 's' : ''} to ${destinationAddress}.`);
      if (completed === 0) {
        setError('No withdrawals were completed. Balances may be too low for gas or keys may be invalid.');
      }
    } catch (err: any) {
      setError(err.message || 'Bulk withdrawal failed');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

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
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This scans recent stealth payment announcements and checks both ETH (Sepolia)
            and token balances (Base Sepolia, when configured).
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
              Wallet network: {chain?.id === baseSepolia.id ? 'Base Sepolia' : chain?.id === sepolia.id ? 'Ethereum Sepolia' : `Chain ${chain?.id ?? 'Unknown'}`}
            </span>
            <button
              type="button"
              onClick={() => switchChain({ chainId: sepolia.id })}
              className="px-3 py-1 text-xs rounded-md bg-yellow-600 text-white hover:bg-yellow-700"
            >
              Switch to Ethereum Sepolia
            </button>
            <button
              type="button"
              onClick={() => switchChain({ chainId: baseSepolia.id })}
              className="px-3 py-1 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Switch to Base Sepolia
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">Scan rail:</span>
            <button
              type="button"
              onClick={() => setScanRail('all')}
              className={`px-3 py-1 text-xs rounded-md ${scanRail === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
            >
              Both
            </button>
            <button
              type="button"
              onClick={() => setScanRail('sepolia')}
              className={`px-3 py-1 text-xs rounded-md ${scanRail === 'sepolia' ? 'bg-yellow-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
            >
              Ethereum Sepolia
            </button>
            <button
              type="button"
              onClick={() => setScanRail('base')}
              className={`px-3 py-1 text-xs rounded-md ${scanRail === 'base' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
            >
              Base Sepolia
            </button>
          </div>
          <button
            onClick={handleScan}
            disabled={scanning || !merchantName || !viewPrivateKey || !spendPrivateKey}
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
              Step 3: Withdraw ({payments.length} payment
              {payments.length !== 1 ? 's' : ''} found)
            </h2>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Showing results for: <strong>{selectedRailLabel}</strong>
            </p>

            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <label className="block text-sm font-medium mb-2 text-blue-900 dark:text-blue-200">
                Destination Address
              </label>
              <input
                type="text"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              />
              <p className="text-xs text-blue-800 dark:text-blue-300 mt-2">
                Funds from all discovered stealth addresses and rails will be sent here.
              </p>
              <button
                onClick={handleWithdrawAll}
                disabled={loading || !isAddress(destinationAddress)}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Withdraw All to Destination'}
              </button>
            </div>

            <div className="space-y-4">
              {payments
                .filter((payment) => payment.chainId === sepolia.id)
                .map((payment, index) => (
                <div key={index} className="border border-green-500 rounded-lg p-6 bg-green-50 dark:bg-green-900/20">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                        Payment #{index + 1} • {payment.asset} • {getChainLabel(payment.chainId)}
                      </div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatPaymentAmount(payment)}
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
                              href={getExplorerTxUrl(payment.chainId, payment.transactionHash)}
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
                    disabled={loading || !isAddress(destinationAddress)}
                    className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    💸 Withdraw {formatPaymentAmount(payment)}
                  </button>
                </div>
              ))}

              {payments.filter((payment) => payment.chainId === baseSepolia.id).length > 0 && (
                <h3 className="text-lg font-semibold pt-2">Base Sepolia Assets</h3>
              )}

              {payments
                .filter((payment) => payment.chainId === baseSepolia.id)
                .map((payment, index) => (
                <div key={`base-${index}`} className="border border-indigo-500 rounded-lg p-6 bg-indigo-50 dark:bg-indigo-900/20">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                        Payment #{index + 1} • {payment.asset} • {getChainLabel(payment.chainId)}
                      </div>
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {formatPaymentAmount(payment)}
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
                              href={getExplorerTxUrl(payment.chainId, payment.transactionHash)}
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
                    disabled={loading || !isAddress(destinationAddress)}
                    className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    💸 Withdraw {formatPaymentAmount(payment)}
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
                  <div className="text-lg font-bold text-green-600 dark:text-green-400 space-y-1">
                    {Object.entries(
                      payments.reduce((acc, p) => {
                        const current = acc[p.assetSymbol] || BigInt(0);
                        return { ...acc, [p.assetSymbol]: current + p.balance };
                      }, {} as Record<string, bigint>)
                    ).map(([symbol, total]) => (
                      <p key={symbol}>
                        {formatUnits(
                          total,
                          payments.find((p) => p.assetSymbol === symbol)?.decimals || 18
                        )}{' '}
                        {symbol}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Across {payments.length} discovered asset position{payments.length !== 1 ? 's' : ''}
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
              <strong>Step 2:</strong> Scan recent on-chain announcements and resolve stealth balances across both rails
            </p>
            <p>
              <strong>Step 3:</strong> Withdrawal derives stealth private keys and signs ETH or token transfers directly in-browser
            </p>
            <p>
              <strong>Recipient match:</strong> Payments and withdrawals must use the same full ENS name, e.g. merchant.enstealth.eth
            </p>
            <p>
              <strong>Privacy:</strong> Your keys never leave your browser - all crypto and signing are client-side
            </p>
          </div>
        </div>

        {status && (
          <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <p className="text-green-800 dark:text-green-200 break-all">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
