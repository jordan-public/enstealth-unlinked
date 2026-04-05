import { NextResponse } from 'next/server';
import { getUnlinkSdkMissingConfig, hasConfiguredUnlinkSdk } from '@/lib/unlink';

export async function GET() {
  const sdkConfigured = hasConfiguredUnlinkSdk();
  const missing = getUnlinkSdkMissingConfig();
  const dryRunEnabled =
    process.env.PRIVATE_PAYMENT_DRY_RUN === 'true' || process.env.NO_BROADCAST === 'true';

  return NextResponse.json({
    sdkConfigured,
    mode: sdkConfigured ? 'unlink-sdk' : 'unlink-unavailable',
    rail: 'unlink-token',
    dryRunEnabled,
    missingUnlinkConfig: sdkConfigured ? [] : missing,
    tokenAddress: process.env.UNLINK_TOKEN_ADDRESS || '',
    tokenDecimals: Number(process.env.UNLINK_TOKEN_DECIMALS || '18'),
  });
}
