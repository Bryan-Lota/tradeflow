import { create } from 'zustand';

// This is the "Shape" of our memory
interface TradeFlowState {
  userAddress: string | null;
  setUserAddress: (address: string | null) => void;
  shipments: any[];
  addShipment: (shipment: any) => void;
}

// This is the actual "Sticky Note" that stays alive while the app is open
export const useTradeFlowStore = create<TradeFlowState>((set) => ({
  userAddress: null,
  setUserAddress: (address) => set({ userAddress: address }),
  shipments: [], // We start with no shipments
  addShipment: (newShipment) => set((state) => ({ 
    shipments: [...state.shipments, newShipment] 
  })),
}));