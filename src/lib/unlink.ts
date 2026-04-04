const DEFAULT_UNLINK_API_URL = 'https://api.unlink.network';
const DEFAULT_SEND_PRIVATE_TX_PATH = '/send_private_tx';

export interface UnlinkSendPrivateTxParams {
  to: `0x${string}`;
  amount: string;
  chainId?: number;
}

export interface UnlinkSendPrivateTxResult {
  txHash?: `0x${string}`;
  raw: unknown;
}

function getUnlinkApiUrl(): string {
  return (
    process.env.UNLINK_API_URL ||
    process.env.NEXT_PUBLIC_UNLINK_API_URL ||
    DEFAULT_UNLINK_API_URL
  );
}

function getUnlinkSendPrivateTxPath(): string {
  return process.env.UNLINK_SEND_PRIVATE_TX_PATH || DEFAULT_SEND_PRIVATE_TX_PATH;
}

export async function sendPrivateTransaction(
  params: UnlinkSendPrivateTxParams
): Promise<UnlinkSendPrivateTxResult> {
  const apiKey = process.env.UNLINK_API_KEY;
  if (!apiKey) {
    throw new Error('UNLINK_API_KEY is not configured on server');
  }

  const apiUrl = getUnlinkApiUrl();
  const endpoint = new URL(getUnlinkSendPrivateTxPath(), apiUrl).toString();

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        addr: params.to,
        amount: params.amount,
        chainId: params.chainId ?? 11155111,
      }),
      cache: 'no-store',
    });
  } catch (error: any) {
    const isDefaultHost = apiUrl === DEFAULT_UNLINK_API_URL;
    if (isDefaultHost) {
      throw new Error(
        'Unlink API host is not configured. Set UNLINK_API_URL to your real Unlink endpoint.'
      );
    }

    throw new Error(error?.message || 'Failed to reach Unlink API');
  }

  const text = await response.text();
  const data = text ? safelyParseJson(text) : null;

  if (!response.ok) {
    const errorMessage =
      getStringField(data, ['error', 'message', 'detail']) ||
      text ||
      `Unlink request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return {
    txHash: getStringField(data, ['hash', 'txHash', 'transactionHash', 'tx_hash']) as
      | `0x${string}`
      | undefined,
    raw: data,
  };
}

function safelyParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function getStringField(value: unknown, keys: string[]): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }
  }

  return undefined;
}