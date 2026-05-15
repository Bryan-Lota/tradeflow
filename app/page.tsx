"use client";

import { useState } from 'react';
import Link from 'next/link';
import WalletConnect from '@/components/WalletConnect';
import CreateShipmentModal from '@/components/CreateShipmentModal';
import { roleLabels, useTradeFlowStore, type UserRole } from '@/store/useTradeFlowStore';

const roleCopy: Record<UserRole, { title: string; description: string; accent: string }> = {
  exporter: {
    title: 'Create shipments',
    description: 'Open a trade, submit proof, and watch funds release by milestone.',
    accent: 'from-blue-500/30 to-cyan-500/10',
  },
  buyer: {
    title: 'Fund escrow',
    description: 'Lock payment, review proof, and approve releases when checkpoints are ready.',
    accent: 'from-emerald-500/30 to-blue-500/10',
  },
  verifier: {
    title: 'Verify checkpoints',
    description: 'Simulate port clearance or delivery confirmation for the hackathon demo.',
    accent: 'from-amber-500/30 to-orange-500/10',
  },
};

export default function Home() {
  const userAddress = useTradeFlowStore((state) => state.userAddress);
  const activeRole = useTradeFlowStore((state) => state.activeRole);
  const setActiveRole = useTradeFlowStore((state) => state.setActiveRole);
  const shipments = useTradeFlowStore((state) => state.shipments);
  const demoMode = useTradeFlowStore((state) => state.demoMode);
  const setDemoMode = useTradeFlowStore((state) => state.setDemoMode);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const releasedAmount = shipments.reduce((total, shipment) => {
    const releasedPercent = shipment.milestones
      .filter((milestone) => milestone.status === 'approved')
      .reduce((sum, milestone) => sum + milestone.percent, 0);

    return total + (Number(shipment.amount) * releasedPercent) / 100;
  }, 0);
  const escrowAmount = shipments.reduce((total, shipment) => {
    if (shipment.status === 'Pending Funding' || shipment.status === 'Completed') return total;

    return total + Number(shipment.amount);
  }, 0);

  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.18),_transparent_30%),#020617] text-white">
      <nav className="flex flex-col gap-4 border-b border-slate-800 bg-slate-950/70 p-6 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-blue-400">TRADEFLOW</h1>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Stellar escrow rail</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/40">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Login</p>
                <h2 className="mt-1 text-3xl font-black">Choose your TradeFlow role</h2>
              </div>
              <p className="max-w-xl text-sm text-slate-400">
                Connect Freighter, then enter as Exporter, Buyer, or Verifier. Actions are role-gated so the demo matches the PRD workflow.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {(Object.keys(roleCopy) as UserRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setActiveRole(role)}
                  className={`rounded-2xl border p-5 text-left transition-all ${
                    activeRole === role
                      ? 'border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-950/30'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
                  }`}
                >
                  <div className={`mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br ${roleCopy[role].accent}`} />
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">{roleLabels[role]}</p>
                  <h3 className="mt-2 text-lg font-bold">{roleCopy[role].title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{roleCopy[role].description}</p>
                </button>
              ))}
            </div>
          </section>

          {!userAddress && !demoMode ? (
            <div className="mx-auto mt-20 max-w-md space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-2xl">
                ◆
              </div>
              <h2 className="text-4xl font-bold">Secure Agricultural Escrow</h2>
              <p className="text-slate-400">Connect Freighter or enable Demo Mode to run the happy path instantly.</p>
            </div>
          ) : (
            <>
              <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Dashboard</p>
                  <h2 className="text-3xl font-bold">Shipment Pipeline</h2>
                  <p className="text-slate-400">
                    {activeRole ? `${roleLabels[activeRole]} workspace` : 'Select a role'} · Fund, approve, release, complete.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-semibold shadow-lg shadow-blue-950/30 transition-colors hover:bg-blue-500"
                >
                  + New Shipment
                </button>
              </header>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                  <p className="text-sm text-slate-500">Active shipments</p>
                  <p className="mt-2 text-3xl font-black">{shipments.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                  <p className="text-sm text-slate-500">Total in escrow</p>
                  <p className="mt-2 text-3xl font-black">${escrowAmount.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                  <p className="text-sm text-slate-500">Released</p>
                  <p className="mt-2 text-3xl font-black">${releasedAmount.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {shipments.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center">
                    <p className="text-slate-500">No active shipments. Click “+ New Shipment” as Exporter or enable Demo Mode.</p>
                  </div>
                ) : (
                  shipments.map((shipment) => {
                    const approvedCount = shipment.milestones.filter((milestone) => milestone.status === 'approved').length;
                    const readyCount = shipment.milestones.filter((milestone) => milestone.status === 'ready').length;

                    return (
                      <div
                        key={shipment.id}
                        className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-slate-950/40 transition-all hover:border-blue-500/50"
                      >
                        <div className="mb-4 flex justify-between gap-4">
                          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">ID: {shipment.id}</span>
                          <span className="h-fit rounded bg-blue-500/10 px-2 py-1 text-[10px] font-bold uppercase text-blue-300">
                            {shipment.status}
                          </span>
                        </div>
                        <h3 className="mb-1 text-xl font-bold">{shipment.commodity}</h3>
                        <p className="mb-2 text-sm text-slate-500">{shipment.quantity}</p>
                        <p className="mb-2 text-2xl font-black text-white">
                          ${Number(shipment.amount).toLocaleString()}{' '}
                          <span className="text-sm font-normal text-slate-500">USDC</span>
                        </p>
                        <p className="mb-2 text-xs text-slate-500">Buyer: {shipment.buyer.slice(0, 12)}...</p>
                        <p className="mb-5 text-xs text-slate-500">
                          Milestones: {approvedCount} approved · {readyCount} ready
                        </p>
                        <Link
                          href={`/shipment/${shipment.id}`}
                          className="block w-full rounded-lg bg-slate-800 py-3 text-center text-sm font-semibold transition-colors hover:bg-slate-700"
                        >
                          View Details
                        </Link>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <CreateShipmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  );
}
