"use client";

import { useState } from 'react';
import { useTradeFlowStore, type Shipment } from '@/store/useTradeFlowStore';

export default function CreateShipmentModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const addShipment = useTradeFlowStore((state) => state.addShipment);
  const userAddress = useTradeFlowStore((state) => state.userAddress);

  const [commodity, setCommodity] = useState('');
  const [amount, setAmount] = useState('');
  const [buyer, setBuyer] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newShipment: Shipment = {
      id: `tf-${Math.random().toString(36).slice(2, 8)}`,
      commodity,
      amount,
      buyer,
      exporter: userAddress ?? undefined,
      status: 'Pending Funding',
      milestones: [
        { id: 1, label: 'Port Cleared', percent: 50, status: 'pending' },
        { id: 2, label: 'Delivery Confirmed', percent: 50, status: 'pending' },
      ],
    };

    addShipment(newShipment);
    setCommodity('');
    setAmount('');
    setBuyer('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl shadow-blue-950/20">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-400 font-bold">New escrow</p>
          <h2 className="text-2xl font-bold">Create Shipment</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Commodity</label>
            <input
              required
              placeholder="Coffee, wheat, cocoa..."
              className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white outline-none focus:border-blue-500"
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Total Amount (USDC)</label>
            <input
              required
              type="number"
              min="1"
              className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white outline-none focus:border-blue-500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Buyer Wallet Address</label>
            <input
              required
              className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white outline-none focus:border-blue-500"
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-400 hover:text-white">
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold transition-colors">
              Create Trade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
