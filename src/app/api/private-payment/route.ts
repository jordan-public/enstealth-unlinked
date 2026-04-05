import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, parseEther, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { STEALTH_PAYMENT_ABI } from '@/lib/abi';
import { CONTRACTS } from '@/lib/config';
import {
  getUnlinkSdkMissingConfig,
  hasConfiguredUnlinkSdk,
  sendPrivateTransaction,
} from '@/lib/unlink';

interface PrivatePaymentBody {
  recipientEnsName: string;
  ephemeralKeyBytes32: `0x${string}`;
  stealthAddress: `0x${string}`;
  amount: string;
  dryRun?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PrivatePaymentBody;
    const { recipientEnsName, ephemeralKeyBytes32, stealthAddress, amount, dryRun } = body;

    if (!recipientEnsName || !ephemeralKeyBytes32 || !stealthAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const noBroadcast =
      dryRun === true ||
      process.env.PRIVATE_PAYMENT_DRY_RUN === 'true' ||
      process.env.NO_BROADCAST === 'true';

    if (noBroadcast) {
      const sdkConfigured = hasConfiguredUnlinkSdk();
      const tokenDecimals = Number(process.env.UNLINK_TOKEN_DECIMALS || '18');

      return NextResponse.json({
        simulated: true,
        mode: sdkConfigured ? 'unlink-sdk-dry-run' : 'relayer-fallback-dry-run',
        rail: sdkConfigured ? 'unlink-token' : 'eth-fallback',
        recipientEnsName,
        stealthAddress,
        amount,
        tokenAddress: process.env.UNLINK_TOKEN_ADDRESS,
        tokenDecimals,
        missingUnlinkConfig: sdkConfigured ? [] : getUnlinkSdkMissingConfig(),
      });
    }

    if (!hasConfiguredUnlinkSdk()) {
      return NextResponse.json(
        {
          error:
            'Unlink SDK is not fully configured. Private payments are blocked to prevent accidental ETH fallback.',
          rail: 'unlink-token',
          mode: 'unlink-unavailable',
          missingUnlinkConfig: getUnlinkSdkMissingConfig(),
        },
        { status: 400 }
      );
    }

    const relayerKey = process.env.SEPOLIA_PRIVATE_KEY;
    if (!relayerKey) {
      return NextResponse.json(
        { error: 'SEPOLIA_PRIVATE_KEY is not configured on server' },
        { status: 500 }
      );
    }

    const privateKey = relayerKey.startsWith('0x')
      ? (relayerKey as `0x${string}`)
      : (`0x${relayerKey}` as `0x${string}`);

    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
    const account = privateKeyToAccount(privateKey);

    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpcUrl),
    });

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });

    const unlinkResult = await sendPrivateTransaction({
      to: stealthAddress,
      amount,
    });

    const tokenDecimals = Number(process.env.UNLINK_TOKEN_DECIMALS || '18');
    const announcedAmount = parseUnits(amount, tokenDecimals);

    const announceHash = await walletClient.writeContract({
      address: CONTRACTS.STEALTH_PAYMENT as `0x${string}`,
      abi: STEALTH_PAYMENT_ABI,
      functionName: 'announce',
      args: [recipientEnsName, ephemeralKeyBytes32, stealthAddress, announcedAmount],
      account,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: announceHash });

    return NextResponse.json({
      hash: announceHash,
      unlinkTxId: unlinkResult.txId,
      unlinkStatus: unlinkResult.status,
      mode: 'unlink-sdk',
      rail: 'unlink-token',
      tokenAddress: process.env.UNLINK_TOKEN_ADDRESS,
      tokenDecimals,
      status: receipt.status,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Private payment failed' },
      { status: 500 }
    );
  }
}
