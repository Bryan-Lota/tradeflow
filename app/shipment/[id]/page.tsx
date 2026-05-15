"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fundEscrow, releaseMilestone } from '@/lib/trustlesswork';
import { useTradeFlowStore, type Milestone, type Shipment } from '@/store/useTradeFlowStore';

const statusTone: Record<Milestone['status'], string> = {
  pending: 'bg-slate-800 text-slate-500 border-slate-700',
  ready: 'bg-blue-500/15 text-blue-300 border-blue-500/40 shadow-blue-950/40',
  approved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
};

const formatAddress = (address?: string | null) => {
  if (!address) return 'Not connected';
  if (address.length < 16) return address;

  return `${address.slice(0, 8)}...${address.slice(-8)}`;
};

const MilestoneStepper = ({
  shipment,
  onApprove,
  busyAction,
}: {
  shipment: Shipment;
  onApprove: (milestoneId: 1 | 2) => void;
  busyAction: string | null;
}) => (
  <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6 shadow-2xl shadow-slate-950/40">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-500 uppercase text-xs font-bold tracking-[0.25em]">Milestone Stepper</p>
        <h3 className="text-xl font-bold mt-1">Release Milestones</h3>
      </div>
      <span className="rounded-full bg-slate-950 border border-slate-800 px-3 py-1 text-xs text-slate-400">2 steps</span>
    </div>

    <div className="space-y-0">
      {shipment.milestones.map((milestone, index) => {
        const amount = (Number(shipment.amount) * milestone.percent) / 100;
        const isReady = milestone.status === 'ready';
        const isBusy = busyAction === `approve-${milestone.id}`;

        return (
          <div key={milestone.id} className="relative flex gap-4 pb-8 last:pb-0">
            {index < shipment.milestones.length - 1 ? (
              <div className="absolute left-5 top-11 h-[calc(100%-2.75rem)] w-px bg-slate-800" />
            ) : null}
            <div
              className={`z-10 h-10 w-10 shrink-0 rounded-full border flex items-center justify-center font-black ${statusTone[milestone.status]}`}
            >
              {milestone.status === 'approved' ? '✓' : milestone.id}
            </div>
            <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-bold text-lg">{milestone.label}</p>
                  <p className="text-sm text-slate-500">
                    Release {milestone.percent}% · ${amount.toLocaleString()} USDC
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">{milestone.status}</p>
                </div>

                {isReady ? (
                  <button
                    onClick={() => onApprove(milestone.id)}
                    disabled={Boolean(busyAction)}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isBusy ? 'Releasing...' : 'Approve & Release'}
                  </button>
                ) : null}
              </div>

              {milestone.txHash ? <p className="mt-3 text-xs text-emerald-300">Tx: {milestone.txHash}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default function ShipmentDetail() {
  const params = useParams<{ id: string }>();
  const shipmentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const shipments = useTradeFlowStore((state) => state.shipments);
  const userAddress = useTradeFlowStore((state) => state.userAddress);
  const demoMode = useTradeFlowStore((state) => state.demoMode);
  const fundShipment = useTradeFlowStore((state) => state.fundShipment);
  const approveMilestone = useTradeFlowStore((state) => state.approveMilestone);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const shipment = shipments.find((item) => item.id === shipmentId);
  const isBuyer = useMemo(() => {
    if (!shipment) return false;
    if (demoMode) return true;
    if (!userAddress) return false;

    return shipment.buyer.toLowerCase() === userAddress.toLowerCase();
  }, [demoMode, shipment, userAddress]);

  if (!shipment) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-8">
        <Link href="/" className="text-blue-400 mb-8 inline-block hover:text-blue-300">
          ← Back to Dashboard
        </Link>
        <div className="max-w-3xl mx-auto rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
          <h1 className="text-3xl font-bold">Shipment not found.</h1>
          <p className="text-slate-400 mt-2">Enable Demo Mode or create a shipment from the dashboard.</p>
        </div>
      </main>
    );
  }

  const canFund = shipment.status === 'Pending Funding' && isBuyer;

  const handleFund = async () => {
    setBusyAction('fund');
    setNotice(null);

    try {
      const result = await fundEscrow(shipment, userAddress, demoMode);
      fundShipment(shipment.id, result.txHash);
      setNotice('Escrow funded. Port Cleared is ready for review.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleApprove = async (milestoneId: 1 | 2) => {
    setBusyAction(`approve-${milestoneId}`);
    setNotice(null);

    try {
      const result = await releaseMilestone(shipment, milestoneId, userAddress, demoMode);
      approveMilestone(shipment.id, milestoneId, result.txHash);
      setNotice(milestoneId === 1 ? '50% released. Delivery Confirmed is ready.' : 'Final 50% released. Trade complete.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.18),_transparent_30%),#020617] text-white p-8">
      <Link href="/" className="text-blue-400 mb-8 inline-block hover:text-blue-300">
        ← Back to Dashboard
      </Link>

      <div className="max-w-5xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-blue-400 text-sm font-bold uppercase tracking-[0.35em]">Shipment Detail</p>
            <h1 className="text-4xl font-black mt-2">{shipment.commodity}</h1>
            <p className="text-slate-400 mt-1">Shipment ID: {shipment.id}</p>
          </div>
          <span className="w-fit rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-200">
            {shipment.status}
          </span>
        </header>

        {notice ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-emerald-200">{notice}</div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-8">
          <section className="space-y-6">
            <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-2xl shadow-slate-950/40">
              <p className="text-slate-500 uppercase text-xs font-bold tracking-[0.25em] mb-4">Financial Status</p>
              <p className="text-4xl font-black">${Number(shipment.amount).toLocaleString()}</p>
              <p className="text-slate-500 mt-1">USDC locked for agricultural escrow</p>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-t border-slate-800 pt-4">
                  <span className="text-slate-500">Buyer</span>
                  <span className="font-mono text-slate-300">{formatAddress(shipment.buyer)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Exporter</span>
                  <span className="font-mono text-slate-300">{formatAddress(shipment.exporter)}</span>
                </div>
                {shipment.fundedTxHash ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Fund Tx</span>
                    <span className="font-mono text-emerald-300">{shipment.fundedTxHash}</span>
                  </div>
                ) : null}
              </div>

              {canFund ? (
                <button
                  onClick={handleFund}
                  disabled={Boolean(busyAction)}
                  className="mt-6 w-full rounded-xl bg-blue-600 py-4 font-black text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyAction === 'fund' ? 'Funding...' : 'Fund Escrow'}
                </button>
              ) : shipment.status === 'Pending Funding' ? (
                <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                  Waiting for the Buyer to fund escrow.
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  Escrow funded. Release by milestone.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-sm font-bold text-slate-300">Happy Path</p>
              <p className="mt-2 text-sm text-slate-500">Fund → Approve → Release → Complete.</p>
            </div>
          </section>

          <MilestoneStepper shipment={shipment} onApprove={handleApprove} busyAction={busyAction} />
        </div>
      </div>
    </main>
  );
}
