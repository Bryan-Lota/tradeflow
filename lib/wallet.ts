import { getAddress, isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';
import { Account, Asset, Memo, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';

const STROOP = '0.0000001';
const DEFAULT_SEQUENCE = '0';

const readApiError = (result: { error?: unknown }) => {
  if (!result.error) return null;
  if (typeof result.error === 'string') return result.error;
  if (typeof result.error === 'object' && result.error && 'message' in result.error) {
    return String((result.error as { message: unknown }).message);
  }

  return 'Freighter rejected the request.';
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

export const buildDemoTransactionXdr = (sourceAddress: string, intent: string) => {
  const account = new Account(sourceAddress, DEFAULT_SEQUENCE);

  return new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
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
    networkPassphrase: Networks.TESTNET,
    address: sourceAddress,
  });
  const signatureError = readApiError(signed);

  if (signatureError) throw new Error(signatureError);

  return {
    signedTxXdr: signed.signedTxXdr,
    signerAddress: signed.signerAddress,
    txHash: `signed-${Date.now().toString(36)}`,
  };
};
