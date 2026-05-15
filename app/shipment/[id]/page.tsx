"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fundEscrow, releaseMilestone } from '@/lib/trustlesswork';
import {
  roleLabels,
  useTradeFlowStore,
  type Milestone,
  type Shipment,
  type UserRole,
} from '@/store/useTradeFlowStore';

const statusTone: Record<Milestone['status'], string> = {
  pending: 'bg-slate-800 text-slate-500 border-slate-700',
  ready: 'bg-blue-500/15 text-blue-300 border-blue-500/40 shadow-blue-950/40',
  approved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
};

const roleActionCopy: Record<UserRole, string> = {
  exporter: 'Submit proof when port clearance or delivery documents are ready.',
  buyer: 'Fund escrow, review proof, then approve each release.',
  verifier: 'Simulate verified checkpoints for the live demo.',
};

const formatAddress = (address?: string | null) => {
  if (!address) return 'Not connected';
  if (address.length < 16) return address;

  return `${address.slice(0, 8)}...${address.slice(-8)}`;
};

const MilestoneStepper = ({
  shipment,
  activeRole,
  onApprove,
  onSubmitProof,
  busyAction,
}: {
  shipment: Shipment;
  activeRole: UserRole | null;
  onApprove: (milestoneId: 1 | 2) => void;
  onSubmitProof: (milestoneId: 1 | 2) => void;
  busyAction: string | null;
}) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-slate-950/40">
    <div className="mb-6 flex items-center justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Milestone Stepper</p>
        <h3 className="mt-1 text-xl font-bold">Release Milestones</h3>
      </div>
      <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400">2 steps</span>
    </div>

    <div>
      {shipment.milestones.map((milestone, index) => {
        const amount = (Number(shipment.amount) * milestone.percent) / 100;
        const isReady = milestone.status === 'ready';
        const isPending = milestone.status === 'pending';
        const isBuyer = activeRole === 'buyer';
        const previousMilestoneApproved =
          milestone.id === 1 || shipment.milestones.some((item) => item.id === 1 && item.status === 'approved');
        const canSubmitProof =
          (activeRole === 'exporter' || activeRole === 'verifier') &&
          isPending &&
          shipment.status !== 'Pending Funding' &&
          previousMilestoneApproved;
        const isBusy = busyAction === `approve-${milestone.id}` || busyAction === `proof-${milestone.id}`;

        return (
          <div key={milestone.id} className="relative flex gap-4 pb-8 last:pb-0">
            {index < shipment.milestones.length - 1 ? (
              <div className="absolute left-5 top-11 h-[calc(100%-2.75rem)] w-px bg-slate-800" />
            ) : null}
            <div
              className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-black ${statusTone[milestone.status]}`}
            >
              {milestone.status === 'approved' ? '✓' : milestone.id}
            </div>
            <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-bold">{milestone.label}</p>
                  <p className="text-sm text-slate-500">
                    Release {milestone.percent}% · ${amount.toLocaleString()} USDC
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">{milestone.status}</p>
                </div>

                <div className="flex flex-col gap-2 md:items-end">
                  {canSubmitProof ? (
                    <button
                      onClick={() => onSubmitProof(milestone.id)}
                      disabled={Boolean(busyAction)}
                      className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy ? 'Submitting...' : activeRole === 'verifier' ? 'Verify Checkpoint' : 'Submit Proof'}
                    </button>
                  ) : null}

                  {isReady && isBuyer ? (
                    <button
                      onClick={() => onApprove(milestone.id)}
                      disabled={Boolean(busyAction)}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy ? 'Releasing...' : 'Approve & Release'}
                    </button>
                  ) : null}
                </div>
              </div>

              {milestone.proof ? (
                <div className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-100">
                  <span className="font-bold text-blue-300">Proof:</span> {milestone.proof}
                </div>
              ) : null}
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
  const activeRole = useTradeFlowStore((state) => state.activeRole);
  const setActiveRole = useTradeFlowStore((state) => state.setActiveRole);
  const fundShipment = useTradeFlowStore((state) => state.fundShipment);
  const submitMilestoneProof = useTradeFlowStore((state) => state.submitMilestoneProof);
  const approveMilestone = useTradeFlowStore((state) => state.approveMilestone);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const shipment = shipments.find((item) => item.id === shipmentId);
  const walletMatchesBuyer = useMemo(() => {
    if (!shipment || !userAddress) return false;

    return shipment.buyer.toLowerCase() === userAddress.toLowerCase();
  }, [shipment, userAddress]);

  if (!shipment) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <Link href="/" className="mb-8 inline-block text-blue-400 hover:text-blue-300">
          ← Back to Dashboard
        </Link>
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
          <h1 className="text-3xl font-bold">Shipment not found.</h1>
          <p className="mt-2 text-slate-400">Enable Demo Mode or create a shipment from the dashboard.</p>
        </div>
      </main>
    );
  }

  const isBuyer = activeRole === 'buyer';
  const canFund = shipment.status === 'Pending Funding' && isBuyer;
  const walletWarning = isBuyer && userAddress && !demoMode && !walletMatchesBuyer;

  const handleFund = async () => {
    setBusyAction('fund');
    setNotice(null);

    try {
      const result = await fundEscrow(shipment, userAddress, demoMode);
      fundShipment(shipment.id, result.txHash, shipment.escrowAddress);
      setNotice(
        result.submitted
          ? 'Escrow funded on Stellar testnet. Verifier or Exporter can now submit Port Cleared proof.'
          : 'Escrow marked funded in demo mode. Verifier or Exporter can now submit Port Cleared proof.',
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleSubmitProof = (milestoneId: 1 | 2) => {
    setBusyAction(`proof-${milestoneId}`);
    setNotice(null);

    const proof =
      milestoneId === 1
        ? 'Port clearance packet verified: customs release, bill of lading, and inspection note attached.'
        : 'Delivery confirmation verified: warehouse receipt and buyer delivery note attached.';

    setTimeout(() => {
      submitMilestoneProof(shipment.id, milestoneId, proof);
      setNotice(`${milestoneId === 1 ? 'Port Cleared' : 'Delivery Confirmed'} proof is ready for Buyer review.`);
      setBusyAction(null);
    }, 250);
  };

  const handleApprove = async (milestoneId: 1 | 2) => {
    setBusyAction(`approve-${milestoneId}`);
    setNotice(null);

    try {
      const result = await releaseMilestone(shipment, milestoneId, userAddress, demoMode);
      approveMilestone(shipment.id, milestoneId, result.txHash);
      setNotice(
        milestoneId === 1
          ? `${result.submitted ? 'Live payment submitted.' : 'Demo release recorded.'} 50% released. Delivery Confirmed can now be verified.`
          : `${result.submitted ? 'Live payment submitted.' : 'Demo release recorded.'} Final 50% released. Trade complete.`,
      );
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.18),_transparent_30%),#020617] p-8 text-white">
      <Link href="/" className="mb-8 inline-block text-blue-400 hover:text-blue-300">
        ← Back to Dashboard
      </Link>

      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-blue-400">Shipment Detail</p>
            <h1 className="mt-2 text-4xl font-black">{shipment.commodity}</h1>
            <p className="mt-1 text-slate-400">Shipment ID: {shipment.id}</p>
          </div>
          <span className="w-fit rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-200">
            {shipment.status}
          </span>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Active login</p>
              <p className="mt-1 text-lg font-bold">{activeRole ? roleLabels[activeRole] : 'No role selected'}</p>
              <p className="text-sm text-slate-400">{activeRole ? roleActionCopy[activeRole] : 'Select a role before taking escrow actions.'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['exporter', 'buyer', 'verifier'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setActiveRole(role)}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                    activeRole === role ? 'border-blue-400 bg-blue-500/20 text-blue-100' : 'border-slate-700 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {roleLabels[role]}
                </button>
              ))}
            </div>
          </div>
        </section>

        {notice ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-emerald-200">{notice}</div>
        ) : null}

        {walletWarning ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
            Buyer role is active, but the connected wallet does not match the buyer address on this shipment. You can still demo the flow, but live payments will debit the connected Freighter wallet.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-slate-950/40">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Financial Status</p>
              <p className="text-4xl font-black">${Number(shipment.amount).toLocaleString()}</p>
              <p className="mt-1 text-slate-500">USDC target; live fallback sends configured Stellar asset on testnet</p>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-t border-slate-800 pt-4">
                  <span className="text-slate-500">Quantity</span>
                  <span className="text-slate-300">{shipment.quantity}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Buyer</span>
                  <span className="font-mono text-slate-300">{formatAddress(shipment.buyer)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Exporter</span>
                  <span className="font-mono text-slate-300">{formatAddress(shipment.exporter)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Escrow receiver</span>
                  <span className="font-mono text-slate-300">{formatAddress(shipment.escrowAddress)}</span>
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
                  disabled={Boolean(busyAction) || (!userAddress && !demoMode)}
                  className="mt-6 w-full rounded-xl bg-blue-600 py-4 font-black text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyAction === 'fund' ? 'Funding...' : 'Fund Escrow'}
                </button>
              ) : shipment.status === 'Pending Funding' ? (
                <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                  Login as Buyer and connect Freighter to fund escrow.
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  Escrow funded. Submit proof, then release by milestone.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-sm font-bold text-slate-300">Happy Path</p>
              <p className="mt-2 text-sm text-slate-500">Exporter creates → Buyer funds → Exporter/Verifier submits proof → Buyer approves and releases → Complete.</p>
            </div>
          </section>

          <MilestoneStepper
            shipment={shipment}
            activeRole={activeRole}
            onApprove={handleApprove}
            onSubmitProof={handleSubmitProof}
            busyAction={busyAction}
          />
        </div>
      </div>
    </main>
  );
}
