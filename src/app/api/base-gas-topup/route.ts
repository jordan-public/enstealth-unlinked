import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, isAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

interface BaseGasTopUpBody {
  address: string;
  amountWei: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BaseGasTopUpBody;
    const { address, amountWei } = body;

    if (!isAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    if (!amountWei || BigInt(amountWei) <= BigInt(0)) {
      return NextResponse.json({ error: 'Invalid top-up amount' }, { status: 400 });
    }

    const relayerKey = process.env.SEPOLIA_PRIVATE_KEY;
    if (!relayerKey) {
      return NextResponse.json(
        { error: 'SEPOLIA_PRIVATE_KEY is not configured on server' },
        { status: 500 }
      );
    }

    const normalizedRelayerKey = relayerKey.startsWith('0x')
      ? (relayerKey as `0x${string}`)
      : (`0x${relayerKey}` as `0x${string}`);

    const relayerAccount = privateKeyToAccount(normalizedRelayerKey);
    const client = createWalletClient({
      account: relayerAccount,
      chain: baseSepolia,
      transport: http(process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
    });

    const hash = await client.sendTransaction({
      to: address as `0x${string}`,
      value: BigInt(amountWei),
      account: relayerAccount,
    });

    return NextResponse.json({ hash });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Base gas top-up failed' },
      { status: 500 }
    );
  }
}