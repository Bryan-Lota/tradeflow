"use client";

import { useState } from 'react';
import WalletConnect from '@/components/WalletConnect';
import CreateShipmentModal from '@/components/CreateShipmentModal';
import { useTradeFlowStore } from '@/store/useTradeFlowStore';

export default function Home() {
  const userAddress = useTradeFlowStore((state) => state.userAddress);
  const shipments = useTradeFlowStore((state) => state.shipments);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-white">
      <nav className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
        <h1 className="text-2xl font-black tracking-tighter text-blue-500">TRADEFLOW</h1>
        <WalletConnect />
      </nav>

      <div className="flex-1 p-8">
        {!userAddress ? (
          <div className="max-w-md mx-auto mt-20 text-center space-y-6">
            <h2 className="text-4xl font-bold">Secure Agricultural Escrow</h2>
            <p className="text-slate-400">Connect your Stellar wallet to start trading globally.</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold">Shipment Dashboard</h2>
                <p className="text-slate-400">Manage your active agricultural exports</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                + New Shipment
              </button>
            </header>

            {/* List of Shipments */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shipments.length === 0 ? (
                <div className="col-span-full bg-slate-900/50 border border-slate-800 p-12 rounded-2xl text-center">
                  <p className="text-slate-500">No active shipments. Click "+ New Shipment" to begin.</p>
                </div>
              ) : (
                shipments.map((s) => (
                  <div key={s.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/50 transition-all">
                    <div className="flex justify-between mb-4">
                      <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">ID: {s.id}</span>
                      <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-1 rounded uppercase font-bold">{s.status}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{s.commodity}</h3>
                    <p className="text-2xl font-black text-white mb-4">${Number(s.amount).toLocaleString()} <span className="text-sm font-normal text-slate-500">USDC</span></p>
                    <button className="w-full bg-slate-800 py-2 rounded-lg text-sm font-semibold hover:bg-slate-700">View Details</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <CreateShipmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  );
}