import { createUnlink, unlinkAccount } from '@unlink-xyz/sdk';
import { privateKeyToAccount } from 'viem/accounts';

const DEFAULT_ENGINE_URL = 'https://staging-api.unlink.xyz';
const DEFAULT_TEST_TOKEN = '0x7501de8ea37a21e20e6e65947d2ecab0e9f061a7';
const DEFAULT_TEST_MNEMONIC = 'test test test test test test test test test test test junk';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function getMode() {
  return process.argv.includes('--private') ? 'private' : 'public';
}

function getEvmAddress() {
  if (process.env.FAUCET_EVM_ADDRESS) {
    return process.env.FAUCET_EVM_ADDRESS;
  }

  const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Set FAUCET_EVM_ADDRESS or SEPOLIA_PRIVATE_KEY for public faucet requests');
  }

  const normalized = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  return privateKeyToAccount(normalized).address;
}

async function main() {
  const mode = getMode();
  const apiKey = requireEnv('UNLINK_API_KEY');
  const engineUrl = process.env.UNLINK_API_URL || DEFAULT_ENGINE_URL;
  const mnemonic = process.env.UNLINK_MNEMONIC || DEFAULT_TEST_MNEMONIC;
  const token = process.env.UNLINK_TOKEN_ADDRESS || DEFAULT_TEST_TOKEN;

  const unlink = createUnlink({
    engineUrl,
    apiKey,
    account: unlinkAccount.fromMnemonic({ mnemonic }),
  });

  if (mode === 'private') {
    const unlinkAddress = process.env.FAUCET_UNLINK_ADDRESS || (await unlink.getAddress());
    const requestParams = process.env.FAUCET_UNLINK_ADDRESS
      ? { token, unlinkAddress }
      : { token };

    const result = await unlink.faucet.requestPrivateTokens(requestParams);

    let balances = null;
    let balanceError = null;

    try {
      balances = await unlink.getBalances({ token });
    } catch (error) {
      balanceError = error?.message || String(error);
    }

    console.log(
      JSON.stringify(
        {
          mode,
          token,
          unlinkAddress,
          faucet: result,
          balances,
          balanceError,
        },
        null,
        2
      )
    );
    return;
  }

  const evmAddress = getEvmAddress();
  const result = await unlink.faucet.requestTestTokens({
    token,
    evmAddress,
  });

  console.log(
    JSON.stringify(
      {
        mode,
        token,
        evmAddress,
        faucet: result,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
