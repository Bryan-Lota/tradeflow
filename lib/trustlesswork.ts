import { requestFreighterSignature } from '@/lib/wallet';
import type { Shipment } from '@/store/useTradeFlowStore';

const simulateIfWalletUnavailable = async (action: string, error: unknown) => {
  console.warn(`${action} signature unavailable; continuing in demo mode.`, error);
  await new Promise((resolve) => setTimeout(resolve, 350));

  return {
    signedTxXdr: 'demo-mode-signature',
    signerAddress: 'demo-mode',
    txHash: `demo-${Date.now().toString(36)}`,
  };
};

export const fundEscrow = async (shipment: Shipment, signerAddress: string | null, demoMode: boolean) => {
  if (!signerAddress || demoMode) {
    return simulateIfWalletUnavailable('Fund escrow', 'Demo mode enabled or wallet disconnected');
  }

  try {
    return await requestFreighterSignature(signerAddress, `Fund ${shipment.id}`);
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

  try {
    return await requestFreighterSignature(signerAddress, `Release M${milestoneId} ${shipment.id}`);
  } catch (error) {
    return simulateIfWalletUnavailable('Release milestone', error);
  }
};
