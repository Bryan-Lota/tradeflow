import { defaultEscrowAddress, signAndSubmitPayment } from '@/lib/wallet';
import type { Shipment } from '@/store/useTradeFlowStore';

const toStellarAmount = (rawAmount: string, percent = 100) => {
  const numericAmount = Number(rawAmount);
  const safeAmount = Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : 1;

  return ((safeAmount * percent) / 100).toFixed(7).replace(/0+$/, '').replace(/\.$/, '');
};

const simulateIfWalletUnavailable = async (action: string, error: unknown) => {
  console.warn(`${action} live payment unavailable; continuing with demo-safe state transition.`, error);
  await new Promise((resolve) => setTimeout(resolve, 350));

  return {
    signedTxXdr: 'demo-mode-signature',
    signerAddress: 'demo-mode',
    txHash: `demo-${Date.now().toString(36)}`,
    submitted: false,
  };
};

export const fundEscrow = async (shipment: Shipment, signerAddress: string | null, demoMode: boolean) => {
  if (!signerAddress || demoMode) {
    return simulateIfWalletUnavailable('Fund escrow', 'Demo mode enabled or wallet disconnected');
  }

  const destinationAddress = defaultEscrowAddress ?? shipment.escrowAddress ?? shipment.exporter;

  if (!destinationAddress) {
    return simulateIfWalletUnavailable('Fund escrow', 'No escrow receiver address configured');
  }

  try {
    return await signAndSubmitPayment({
      sourceAddress: signerAddress,
      destinationAddress,
      amount: toStellarAmount(shipment.amount),
      memo: `Fund ${shipment.id}`,
    });
  } catch (error) {
    return simulateIfWalletUnavailable('Fund escrow', error);
  }
};

export const releaseMilestone = async (
  shipment: Shipment,
  milestoneId: 1 | 2,
  signerAddress: string | null,
  demoMode: boolean,
) => {
  if (!signerAddress || demoMode) {
    return simulateIfWalletUnavailable('Release milestone', 'Demo mode enabled or wallet disconnected');
  }

  const destinationAddress = shipment.exporter;

  if (!destinationAddress) {
    return simulateIfWalletUnavailable('Release milestone', 'No exporter wallet address available');
  }

  try {
    return await signAndSubmitPayment({
      sourceAddress: signerAddress,
      destinationAddress,
      amount: toStellarAmount(shipment.amount, 50),
      memo: `Release M${milestoneId} ${shipment.id}`,
    });
  } catch (error) {
    return simulateIfWalletUnavailable('Release milestone', error);
  }
};
