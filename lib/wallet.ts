import { getAddress, isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';
import { Account, Asset, Horizon, Memo, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';

const STROOP = '0.0000001';
const DEFAULT_SEQUENCE = '0';
const DEFAULT_FEE = '100';

const stellarNetwork = process.env.NEXT_PUBLIC_STELLAR_NETWORK?.toLowerCase() === 'mainnet' ? 'mainnet' : 'testnet';
const networkPassphrase = stellarNetwork === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
const horizonUrl =
  process.env.NEXT_PUBLIC_HORIZON_URL ??
  (stellarNetwork === 'mainnet' ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org');

export const defaultAssetCode = process.env.NEXT_PUBLIC_DEFAULT_ASSET_CODE || 'XLM';
export const defaultAssetIssuer = process.env.NEXT_PUBLIC_DEFAULT_ASSET_ISSUER;
export const defaultEscrowAddress = process.env.NEXT_PUBLIC_ESCROW_RECEIVER_ADDRESS;

const server = new Horizon.Server(horizonUrl);

type FreighterResult = { error?: unknown };

const readApiError = (result: FreighterResult) => {
  if (!result.error) return null;
  if (typeof result.error === 'string') return result.error;
  if (typeof result.error === 'object' && result.error && 'message' in result.error) {
    return String((result.error as { message: unknown }).message);
  }

  return 'Freighter rejected the request.';
};

const resolveAsset = () => {
  if (!defaultAssetIssuer || defaultAssetCode.toUpperCase() === 'XLM' || defaultAssetCode.toLowerCase() === 'native') {
    return Asset.native();
  }

  return new Asset(defaultAssetCode, defaultAssetIssuer);
};

export const getWalletAddress = async () => {
  const connected = await isConnected();
  const connectionError = readApiError(connected);

  if (connectionError) throw new Error(connectionError);
  if (!connected.isConnected) throw new Error('Please install or unlock Freighter.');

  const access = await requestAccess();
  const accessError = readApiError(access);

  if (accessError) throw new Error(accessError);
  if (access.address) return access.address;

  const addressResult = await getAddress();
  const addressError = readApiError(addressResult);

  if (addressError) throw new Error(addressError);

  return addressResult.address;
};

export const getWalletBalances = async (address: string) => {
  const account = await server.loadAccount(address);

  return account.balances.map((balance) => {
    const assetCode = 'asset_code' in balance ? balance.asset_code : 'XLM';
    const issuer = 'asset_issuer' in balance ? balance.asset_issuer : undefined;

    return {
      assetCode,
      issuer,
      balance: balance.balance,
    };
  });
};

export const buildDemoTransactionXdr = (sourceAddress: string, intent: string) => {
  const account = new Account(sourceAddress, DEFAULT_SEQUENCE);

  return new TransactionBuilder(account, {
    fee: DEFAULT_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: sourceAddress,
        asset: Asset.native(),
        amount: STROOP,
      }),
    )
    .addMemo(Memo.text(intent.slice(0, 28)))
    .setTimeout(30)
    .build()
    .toXDR();
};

export const requestFreighterSignature = async (sourceAddress: string, intent: string) => {
  const transactionXdr = buildDemoTransactionXdr(sourceAddress, intent);
  const signed = await signTransaction(transactionXdr, {
    networkPassphrase,
    address: sourceAddress,
  });
  const signatureError = readApiError(signed);

  if (signatureError) throw new Error(signatureError);

  return {
    signedTxXdr: signed.signedTxXdr,
    signerAddress: signed.signerAddress,
    txHash: `signed-${Date.now().toString(36)}`,
    submitted: false,
  };
};

export const signAndSubmitPayment = async ({
  sourceAddress,
  destinationAddress,
  amount,
  memo,
}: {
  sourceAddress: string;
  destinationAddress: string;
  amount: string;
  memo: string;
}) => {
  const source = await server.loadAccount(sourceAddress);
  const transaction = new TransactionBuilder(source, {
    fee: DEFAULT_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: destinationAddress,
        asset: resolveAsset(),
        amount,
      }),
    )
    .addMemo(Memo.text(memo.slice(0, 28)))
    .setTimeout(120)
    .build();

  const signed = await signTransaction(transaction.toXDR(), {
    networkPassphrase,
    address: sourceAddress,
  });
  const signatureError = readApiError(signed);

  if (signatureError) throw new Error(signatureError);

  const signedTransaction = TransactionBuilder.fromXDR(signed.signedTxXdr, networkPassphrase);
  const result = await server.submitTransaction(signedTransaction);

  return {
    signedTxXdr: signed.signedTxXdr,
    signerAddress: signed.signerAddress,
    txHash: result.hash,
    submitted: true,
  };
};
