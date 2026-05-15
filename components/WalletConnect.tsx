"use client";

import { useState } from 'react';
import { useTradeFlowStore } from '@/store/useTradeFlowStore';
import { defaultAssetCode, getWalletAddress, getWalletBalances } from '@/lib/wallet';

export default function WalletConnect() {
  const setUserAddress = useTradeFlowStore((state) => state.setUserAddress);
  const userAddress = useTradeFlowStore((state) => state.userAddress);
  const [balances, setBalances] = useState<{ assetCode: string; balance: string }[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = async () => {
    setIsConnecting(true);

    try {
      const address = await getWalletAddress();
      setUserAddress(address);
      const accountBalances = await getWalletBalances(address);
      setBalances(accountBalances);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Unable to connect Freighter.');
    } finally {
      setIsConnecting(false);
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 5)}...${addr.slice(-5)}`;
  const primaryBalance = balances.find((balance) => balance.assetCode === defaultAssetCode) ?? balances[0];

  return (
    <div>
      {userAddress ? (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          <p className="font-semibold">Wallet: {formatAddress(userAddress)}</p>
          {primaryBalance ? (
            <p className="text-xs text-emerald-300/80">
              {Number(primaryBalance.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })} {primaryBalance.assetCode}
            </p>
          ) : (
            <p className="text-xs text-emerald-300/80">Connected to Stellar testnet</p>
          )}
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={isConnecting}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-950/30 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
}
