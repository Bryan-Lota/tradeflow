import { create } from 'zustand';

export type ShipmentStatus =
  | 'Pending Funding'
  | 'Funded'
  | 'Ready for Release'
  | 'Milestone 1 Approved'
  | 'Completed';

export type MilestoneStatus = 'pending' | 'ready' | 'approved';

export interface Milestone {
  id: 1 | 2;
  label: 'Port Cleared' | 'Delivery Confirmed';
  percent: 50;
  status: MilestoneStatus;
  txHash?: string;
  approvedAt?: string;
}

export interface Shipment {
  id: string;
  commodity: string;
  amount: string;
  buyer: string;
  status: ShipmentStatus;
  milestones: Milestone[];
  exporter?: string;
  fundedTxHash?: string;
  fundedAt?: string;
}

const demoShipment: Shipment = {
  id: 'demo-ready-001',
  commodity: 'Organic Coffee Beans',
  amount: '48000',
  buyer: 'GDEMO4BUYER7READY4RELEASE7TRADEFLOW7HACKATHON7STELLAR7USDC',
  exporter: 'GDEMO4EXPORTER7PORT7CLEARED7TRADEFLOW7HACKATHON7STELLAR',
  status: 'Ready for Release',
  fundedTxHash: 'demo-funded-escrow',
  fundedAt: new Date().toISOString(),
  milestones: [
    { id: 1, label: 'Port Cleared', percent: 50, status: 'ready' },
    { id: 2, label: 'Delivery Confirmed', percent: 50, status: 'pending' },
  ],
};

interface TradeFlowState {
  userAddress: string | null;
  setUserAddress: (address: string | null) => void;
  shipments: Shipment[];
  addShipment: (shipment: Shipment) => void;
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  fundShipment: (shipmentId: string, txHash?: string) => void;
  approveMilestone: (shipmentId: string, milestoneId: 1 | 2, txHash?: string) => void;
}

const withoutDemoShipment = (shipments: Shipment[]) =>
  shipments.filter((shipment) => shipment.id !== demoShipment.id);

export const useTradeFlowStore = create<TradeFlowState>((set) => ({
  userAddress: null,
  setUserAddress: (address) => set({ userAddress: address }),
  shipments: [],
  addShipment: (newShipment) =>
    set((state) => ({
      shipments: [newShipment, ...state.shipments],
    })),
  demoMode: false,
  setDemoMode: (enabled) =>
    set((state) => {
      const shipments = withoutDemoShipment(state.shipments);

      return {
        demoMode: enabled,
        shipments: enabled ? [demoShipment, ...shipments] : shipments,
      };
    }),
  fundShipment: (shipmentId, txHash) =>
    set((state) => ({
      shipments: state.shipments.map((shipment) => {
        if (shipment.id !== shipmentId) return shipment;

        return {
          ...shipment,
          status: 'Funded',
          fundedTxHash: txHash,
          fundedAt: new Date().toISOString(),
          milestones: shipment.milestones.map((milestone) =>
            milestone.id === 1 ? { ...milestone, status: 'ready' } : milestone,
          ),
        };
      }),
    })),
  approveMilestone: (shipmentId, milestoneId, txHash) =>
    set((state) => ({
      shipments: state.shipments.map((shipment) => {
        if (shipment.id !== shipmentId) return shipment;

        const nextStatus: ShipmentStatus = milestoneId === 1 ? 'Milestone 1 Approved' : 'Completed';

        return {
          ...shipment,
          status: nextStatus,
          milestones: shipment.milestones.map((milestone) => {
            if (milestone.id === milestoneId) {
              return {
                ...milestone,
                status: 'approved',
                txHash,
                approvedAt: new Date().toISOString(),
              };
            }

            if (milestoneId === 1 && milestone.id === 2) {
              return { ...milestone, status: 'ready' };
            }

            return milestone;
          }),
        };
      }),
    })),
}));
