import { create } from 'zustand';

export type UserRole = 'exporter' | 'buyer' | 'verifier';

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
  proof?: string;
  proofSubmittedAt?: string;
  txHash?: string;
  approvedAt?: string;
}

export interface Shipment {
  id: string;
  commodity: string;
  quantity: string;
  amount: string;
  buyer: string;
  status: ShipmentStatus;
  milestones: Milestone[];
  exporter?: string;
  escrowAddress?: string;
  fundedTxHash?: string;
  fundedAt?: string;
}

export const roleLabels: Record<UserRole, string> = {
  exporter: 'Exporter',
  buyer: 'Buyer',
  verifier: 'Verifier',
};

const demoShipment: Shipment = {
  id: 'demo-ready-001',
  commodity: 'Organic Coffee Beans',
  quantity: '22 metric tons',
  amount: '48000',
  buyer: 'GDEMO4BUYER7READY4RELEASE7TRADEFLOW7HACKATHON7STELLAR7USDC',
  exporter: 'GDEMO4EXPORTER7PORT7CLEARED7TRADEFLOW7HACKATHON7STELLAR',
  escrowAddress: 'GDEMO4ESCROW7FUNDED7TRADEFLOW7HACKATHON7STELLAR7USDC',
  status: 'Ready for Release',
  fundedTxHash: 'demo-funded-escrow',
  fundedAt: new Date().toISOString(),
  milestones: [
    {
      id: 1,
      label: 'Port Cleared',
      percent: 50,
      status: 'ready',
      proof: 'Bill of lading and customs clearance packet verified for Port Cleared.',
      proofSubmittedAt: new Date().toISOString(),
    },
    { id: 2, label: 'Delivery Confirmed', percent: 50, status: 'pending' },
  ],
};

interface TradeFlowState {
  userAddress: string | null;
  setUserAddress: (address: string | null) => void;
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole) => void;
  shipments: Shipment[];
  addShipment: (shipment: Shipment) => void;
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  fundShipment: (shipmentId: string, txHash?: string, escrowAddress?: string) => void;
  submitMilestoneProof: (shipmentId: string, milestoneId: 1 | 2, proof: string) => void;
  approveMilestone: (shipmentId: string, milestoneId: 1 | 2, txHash?: string) => void;
}

const withoutDemoShipment = (shipments: Shipment[]) =>
  shipments.filter((shipment) => shipment.id !== demoShipment.id);

export const useTradeFlowStore = create<TradeFlowState>((set) => ({
  userAddress: null,
  setUserAddress: (address) => set({ userAddress: address }),
  activeRole: null,
  setActiveRole: (role) => set({ activeRole: role }),
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
  fundShipment: (shipmentId, txHash, escrowAddress) =>
    set((state) => ({
      shipments: state.shipments.map((shipment) => {
        if (shipment.id !== shipmentId) return shipment;

        return {
          ...shipment,
          status: 'Funded',
          escrowAddress: escrowAddress ?? shipment.escrowAddress,
          fundedTxHash: txHash,
          fundedAt: new Date().toISOString(),
        };
      }),
    })),
  submitMilestoneProof: (shipmentId, milestoneId, proof) =>
    set((state) => ({
      shipments: state.shipments.map((shipment) => {
        if (shipment.id !== shipmentId) return shipment;

        return {
          ...shipment,
          status: milestoneId === 1 ? 'Ready for Release' : shipment.status,
          milestones: shipment.milestones.map((milestone) =>
            milestone.id === milestoneId
              ? {
                  ...milestone,
                  status: 'ready',
                  proof,
                  proofSubmittedAt: new Date().toISOString(),
                }
              : milestone,
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

            return milestone;
          }),
        };
      }),
    })),
}));
