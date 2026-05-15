"use client";

import { isConnected, getAddress } from "@stellar/freighter-api";
import { useTradeFlowStore } from "@/store/useTradeFlowStore"; // 1. Import the "Sticky Note"

export default function WalletConnect() {
  // 2. This line lets us "write" to the memory
  const setUserAddress = useTradeFlowStore((state) => state.setUserAddress);
  const userAddress = useTradeFlowStore((state) => state.userAddress);

  const connect = async () => {
    try {
      if (await isConnected()) {
        const result = await getAddress();
        const address = typeof result === 'string' ? result : (result as any).address;
        
        // 3. Save it to the app's memory!
        setUserAddress(address); 
      } else {
        alert("Please install Freighter!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 5)}...${addr.slice(-5)}`;

  return (
    <div>
      {userAddress ? (
        <div className="bg-green-900/30 text-green-400 px-4 py-2 rounded-lg border border-green-500/50">
          Account: {formatAddress(userAddress)}
        </div>
      ) : (
        <button 
          onClick={connect}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold shadow-lg"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}