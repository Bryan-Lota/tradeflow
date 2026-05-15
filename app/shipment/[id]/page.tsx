"use client";

import { useParams } from 'next/navigation';
import { useTradeFlowStore } from '@/store/useTradeFlowStore';
import Link from 'next/link';

export default function ShipmentDetail() {
  const { id } = useParams(); // This grabs the "id" from the URL
  const shipments = useTradeFlowStore((state) => state.shipments);
  
  // Find the specific shipment that matches the ID in the URL
  const shipment = shipments.find(s => s.id === id);

  if (!shipment) return <div className="p-10 text-white">Shipment not found.</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <Link href="/" className="text-blue-500 mb-8 inline-block">← Back to Dashboard</Link>
      
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-6">
          <h1 className="text-4xl font-bold">{shipment.commodity}</h1>
          <p className="text-slate-400">Shipment ID: {shipment.id}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Side: Stats */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-slate-500 uppercase text-xs font-bold mb-4">Financial Status</h3>
            <p className="text-3xl font-black">${Number(shipment.amount).toLocaleString()} USDC</p>
            <p className="text-blue-400 mt-2 font-semibold">{shipment.status}</p>
          </div>

          {/* Right Side: Milestones (From your PRD) */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
            <h3 className="text-slate-500 uppercase text-xs font-bold">Release Milestones</h3>
            {shipment.milestones.map((m: any) => (
              <div key={m.id} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${m.status === 'pending' ? 'bg-slate-800 text-slate-500' : 'bg-green-600 text-white'}`}>
                  {m.id}
                </div>
                <div className="flex-1">
                  <p className="font-bold">{m.label}</p>
                  <p className="text-sm text-slate-500">{m.percent}% Release</p>
                </div>
                <button className="bg-blue-600 text-xs px-3 py-1 rounded hover:bg-blue-700">Submit Proof</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}