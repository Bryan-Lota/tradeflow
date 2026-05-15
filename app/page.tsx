"use client";

import { useState } from 'react';
import Link from 'next/link';
import WalletConnect from '@/components/WalletConnect';
import CreateShipmentModal from '@/components/CreateShipmentModal';
import { useTradeFlowStore } from '@/store/useTradeFlowStore';

export default function Home() {
  const userAddress = useTradeFlowStore((state) => state.userAddress);
  const shipments = useTradeFlowStore((state) => state.shipments);
  const demoMode = useTradeFlowStore((state) => state.demoMode);
  const setDemoMode = useTradeFlowStore((state) => state.setDemoMode);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.18),_transparent_30%),#020617] text-white">
      <nav className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-blue-400">TRADEFLOW</h1>
          <p className="text-xs text-slate-500 uppercase tracking-[0.35em]">Stellar escrow</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300">
            <span className="font-semibold">Demo Mode</span>
            <button
              type="button"
              onClick={() => setDemoMode(!demoMode)}
              aria-pressed={demoMode}
              className={`relative h-6 w-11 rounded-full transition-colors ${demoMode ? 'bg-blue-600' : 'bg-slate-700'}`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${demoMode ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </button>
          </label>
          <WalletConnect />
        </div>
      </nav>

      <div className="flex-1 p-8">
        {!userAddress && !demoMode ? (
          <div className="max-w-md mx-auto mt-20 text-center space-y-6">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-2xl">
              ◆
            </div>
            <h2 className="text-4xl font-bold">Secure Agricultural Escrow</h2>
            <p className="text-slate-400">Connect Freighter or enable Demo Mode to run the happy path instantly.</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
              <div>
                <p className="text-blue-400 text-sm font-bold uppercase tracking-[0.3em]">Dashboard</p>
                <h2 className="text-3xl font-bold">Shipment Pipeline</h2>
                <p className="text-slate-400">Fund, approve, release, complete.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg shadow-blue-950/30"
              >
                + New Shipment
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shipments.length === 0 ? (
                <div className="col-span-full bg-slate-900/50 border border-slate-800 p-12 rounded-2xl text-center">
                  <p className="text-slate-500">No active shipments. Click “+ New Shipment” or enable Demo Mode.</p>
                </div>
              ) : (
                shipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/50 transition-all shadow-2xl shadow-slate-950/40"
                  >
                    <div className="flex justify-between gap-4 mb-4">
                      <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">ID: {shipment.id}</span>
                      <span className="bg-blue-500/10 text-blue-300 text-[10px] px-2 py-1 rounded uppercase font-bold h-fit">
                        {shipment.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{shipment.commodity}</h3>
                    <p className="text-2xl font-black text-white mb-2">
                      ${Number(shipment.amount).toLocaleString()}{' '}
                      <span className="text-sm font-normal text-slate-500">USDC</span>
                    </p>
                    <p className="text-xs text-slate-500 mb-5">Buyer: {shipment.buyer.slice(0, 12)}...</p>
                    <Link
                      href={`/shipment/${shipment.id}`}
                      className="block w-full bg-slate-800 py-3 rounded-lg text-sm font-semibold hover:bg-slate-700 text-center transition-colors"
                    >
                      View Details
                    </Link>
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
