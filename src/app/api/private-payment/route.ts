import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { STEALTH_PAYMENT_ABI } from '@/lib/abi';
import { CONTRACTS } from '@/lib/config';
import { sendPrivateTransaction } from '@/lib/unlink';

interface PrivatePaymentBody {
  recipientEnsName: string;
  ephemeralKeyBytes32: `0x${string}`;
  stealthAddress: `0x${string}`;
  amount: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PrivatePaymentBody;
    const { recipientEnsName, ephemeralKeyBytes32, stealthAddress, amount } = body;

    if (!recipientEnsName || !ephemeralKeyBytes32 || !stealthAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
      chainId: sepolia.id,
    });

    const announceHash = await walletClient.writeContract({
      address: CONTRACTS.STEALTH_PAYMENT as `0x${string}`,
      abi: STEALTH_PAYMENT_ABI,
      functionName: 'announce',
      args: [recipientEnsName, ephemeralKeyBytes32, stealthAddress, parseEther(amount)],
      account,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: announceHash });

    return NextResponse.json({
      hash: announceHash,
      unlinkHash: unlinkResult.txHash,
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
