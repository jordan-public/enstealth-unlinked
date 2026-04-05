import { createUnlink, unlinkAccount, unlinkEvm } from '@unlink-xyz/sdk';
import { createPublicClient, createWalletClient, http, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

const DEFAULT_UNLINK_API_URL = 'https://staging-api.unlink.xyz';

export interface UnlinkSendPrivateTxParams {
  to: `0x${string}`;
  amount: string;
}

export interface UnlinkSendPrivateTxResult {
  txId: string;
  status: string;
}

function isUnlinkUserNotFoundError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  return message.toLowerCase().includes('user not found');
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForUnlinkUserIndexing(
  unlink: ReturnType<typeof createUnlink>,
  tokenAddress: string,
  timeoutMs: number = 30000,
  intervalMs: number = 3000
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      await unlink.getBalances({ token: tokenAddress });
      return true;
    } catch (error) {
      if (!isUnlinkUserNotFoundError(error)) {
        throw error;
      }
      await wait(intervalMs);
    }
  }

  return false;
}

export function hasConfiguredUnlinkSdk(): boolean {
  return Boolean(
    process.env.UNLINK_USE_SDK === 'true' &&
      process.env.UNLINK_API_KEY &&
      process.env.UNLINK_MNEMONIC &&
      process.env.UNLINK_TOKEN_ADDRESS
  );
}

export function getUnlinkSdkMissingConfig(): string[] {
  const missing: string[] = [];

  if (process.env.UNLINK_USE_SDK !== 'true') {
    missing.push('UNLINK_USE_SDK=true');
  }
  if (!process.env.UNLINK_API_KEY) {
    missing.push('UNLINK_API_KEY');
  }
  if (!process.env.UNLINK_MNEMONIC) {
    missing.push('UNLINK_MNEMONIC');
  }
  if (!process.env.UNLINK_TOKEN_ADDRESS) {
    missing.push('UNLINK_TOKEN_ADDRESS');
  }

  return missing;
}

export async function sendPrivateTransaction(
  params: UnlinkSendPrivateTxParams
): Promise<UnlinkSendPrivateTxResult> {
  const missing = getUnlinkSdkMissingConfig();
  if (missing.length > 0) {
    throw new Error(`Unlink SDK is not fully configured: ${missing.join(', ')}`);
  }

  const evmPrivateKey = process.env.UNLINK_EVM_PRIVATE_KEY || process.env.SEPOLIA_PRIVATE_KEY;
  if (!evmPrivateKey) {
    throw new Error('UNLINK_EVM_PRIVATE_KEY or SEPOLIA_PRIVATE_KEY is required for Unlink SDK mode');
  }

  const rpcUrl =
    process.env.UNLINK_RPC_URL ||
    process.env.BASE_SEPOLIA_RPC_URL ||
    'https://sepolia.base.org';

  const privateKey = evmPrivateKey.startsWith('0x')
    ? (evmPrivateKey as `0x${string}`)
    : (`0x${evmPrivateKey}` as `0x${string}`);

  const evmAccount = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({
    account: evmAccount,
    chain: baseSepolia,
    transport: http(rpcUrl),
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl),
  });

  const unlink = createUnlink({
    engineUrl: process.env.UNLINK_API_URL || process.env.NEXT_PUBLIC_UNLINK_API_URL || DEFAULT_UNLINK_API_URL,
    apiKey: process.env.UNLINK_API_KEY!,
    account: unlinkAccount.fromMnemonic({
      mnemonic: process.env.UNLINK_MNEMONIC!,
    }),
    evm: unlinkEvm.fromViem({
      walletClient,
      publicClient,
    }),
  });

  const tokenAddress = process.env.UNLINK_TOKEN_ADDRESS!;
  const tokenDecimals = Number(process.env.UNLINK_TOKEN_DECIMALS || '18');
  const amountBaseUnits = parseUnits(params.amount, tokenDecimals).toString();

  let withdrawal;
  try {
    withdrawal = await unlink.withdraw({
      recipientEvmAddress: params.to,
      token: tokenAddress,
      amount: amountBaseUnits,
    });
  } catch (error) {
    if (!isUnlinkUserNotFoundError(error)) {
      throw error;
    }

    const initResult = await unlink.faucet.requestPrivateTokens({
      token: tokenAddress,
    });

    const indexed = await waitForUnlinkUserIndexing(unlink, tokenAddress);

    try {
      withdrawal = await unlink.withdraw({
        recipientEvmAddress: params.to,
        token: tokenAddress,
        amount: amountBaseUnits,
      });
    } catch (retryError) {
      if (isUnlinkUserNotFoundError(retryError)) {
        throw new Error(
          indexed
            ? 'Unlink account indexed but withdrawal preparation is still pending. Please retry in a few seconds.'
            : `Unlink account is initializing (faucet tx_id: ${initResult.tx_id || 'unknown'}). Please retry in 30-60 seconds.`
        );
      }
      throw retryError;
    }
  }

  const confirmed = await unlink.pollTransactionStatus(withdrawal.txId);

  return {
    txId: confirmed.txId,
    status: confirmed.status,
  };
}