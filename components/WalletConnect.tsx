"use client";

import { useTradeFlowStore } from '@/store/useTradeFlowStore';
import { getWalletAddress } from '@/lib/wallet';

export default function WalletConnect() {
  const setUserAddress = useTradeFlowStore((state) => state.setUserAddress);
  const userAddress = useTradeFlowStore((state) => state.userAddress);

  const connect = async () => {
    try {
      const address = await getWalletAddress();
      setUserAddress(address);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Unable to connect Freighter.');
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 5)}...${addr.slice(-5)}`;

  return (
    <div>
      {userAddress ? (
        <div className="bg-emerald-500/10 text-emerald-300 px-4 py-2 rounded-lg border border-emerald-500/40 text-sm font-semibold">
          Account: {formatAddress(userAddress)}
        </div>
      ) : (
        <button
          onClick={connect}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-950/30 transition-colors"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
