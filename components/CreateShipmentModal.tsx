"use client";

import { useState } from 'react';
import { useTradeFlowStore } from '@/store/useTradeFlowStore';

export default function CreateShipmentModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const addShipment = useTradeFlowStore((state) => state.addShipment);
  
  // These are "Input Boxes" in the app's brain
  const [commodity, setCommodity] = useState('');
  const [amount, setAmount] = useState('');
  const [buyer, setBuyer] = useState('');

  if (!isOpen) return null; // If the modal is "closed," don't show anything

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a "Shipment Object" (A digital folder for this trade)
    const newShipment = {
      id: Math.random().toString(36).substring(7), // A random ID for now
      commodity,
      amount,
      buyer,
      status: 'Pending Funding', // The first step in our lifecycle
      milestones: [
        { id: 1, label: 'Port Cleared', percent: 50, status: 'pending' },
        { id: 2, label: 'Delivery Confirmed', percent: 50, status: 'pending' }
      ]
    };

    addShipment(newShipment); // Save it to our Zustand "Sticky Note"
    onClose(); // Close the pop-up
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold mb-6">Create New Shipment</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Commodity (e.g. Wheat)</label>
            <input 
              required
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white"
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Total Amount (USDC)</label>
            <input 
              required
              type="number"
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Buyer Wallet Address</label>
            <input 
              required
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white"
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
            />
          </div>
          
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-400 hover:text-white">Cancel</button>
            <button type="submit" className="flex-1 bg-blue-600 py-3 rounded-lg font-bold">Create Trade</button>
          </div>
        </form>
      </div>
    </div>
  );
}