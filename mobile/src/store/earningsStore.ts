import { create } from 'zustand';
import { EarningsPeriod, EarningsSummary, EarningsChartData, EarningsTransaction } from '../types/earnings';

interface EarningsState {
  selectedPeriod: EarningsPeriod;
  customRange: { from: string; to: string } | null;
  summary: EarningsSummary | null;
  chartData: EarningsChartData | null;
  transactions: EarningsTransaction[];
  currentPage: number;
  hasNextPage: boolean;
  availableBalance: number;
  pendingBalance: number;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  withdrawalState: {
    status: 'idle' | 'submitting' | 'success' | 'failed';
    idempotencyKey: string | null;
    errorMessage: string | null;
  };
  error: string | null;

  // Actions
  setPeriod: (period: EarningsPeriod) => void;
  setCustomRange: (range: { from: string; to: string } | null) => void;
  setSummary: (summary: EarningsSummary | null) => void;
  setChartData: (chartData: EarningsChartData | null) => void;
  setTransactions: (transactions: EarningsTransaction[]) => void;
  addTransactions: (transactions: EarningsTransaction[]) => void;
  setBalances: (available: number, pending: number) => void;
  setWithdrawalState: (state: Partial<EarningsState['withdrawalState']>) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setLoadingMore: (loadingMore: boolean) => void;
  setError: (error: string | null) => void;
}

export const useEarningsStore = create<EarningsState>((set) => ({
  selectedPeriod: 'MONTH',
  customRange: null,
  summary: null,
  chartData: null,
  transactions: [],
  currentPage: 1,
  hasNextPage: false,
  availableBalance: 0,
  pendingBalance: 0,
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  withdrawalState: {
    status: 'idle',
    idempotencyKey: null,
    errorMessage: null,
  },
  error: null,

  setPeriod: (selectedPeriod) => set({ selectedPeriod, error: null }),
  setCustomRange: (customRange) => set({ customRange }),
  setSummary: (summary) => set({ summary, error: null }),
  setChartData: (chartData) => set({ chartData }),
  setTransactions: (transactions) => set({ transactions }),
  addTransactions: (newTransactions) => set((state) => {
    // Deduplication check by transaction id (Requirement 46)
    const existingIds = new Set(state.transactions.map((t) => t.id));
    const uniqueNew = newTransactions.filter((t) => !existingIds.has(t.id));
    return { transactions: [...state.transactions, ...uniqueNew] };
  }),
  setBalances: (availableBalance, pendingBalance) => set({ availableBalance, pendingBalance }),
  setWithdrawalState: (updates) => set((state) => ({
    withdrawalState: { ...state.withdrawalState, ...updates }
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  setLoadingMore: (isLoadingMore) => set({ isLoadingMore }),
  setError: (error) => set({ error }),
}));
export default useEarningsStore;
