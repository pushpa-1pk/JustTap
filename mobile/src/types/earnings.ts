export type EarningsPeriod = 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

export interface EarningsSummary {
  period: EarningsPeriod;
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  completedJobs: number;
  comparison?: {
    percentage: number;
    direction: 'UP' | 'DOWN';
  };
  updatedAt: string; // ISO timestamp
}

interface ChartPoint {
  label: string;
  value: number;
}

export interface EarningsChartData {
  interval: 'HOURLY' | 'DAILY' | 'WEEKLY';
  points: ChartPoint[];
}

export interface EarningsTransaction {
  id: string;
  jobId?: string;
  type: 'SERVICE_EARNING' | 'BONUS' | 'COMMISSION' | 'WITHDRAWAL' | 'REFUND' | 'ADJUSTMENT' | 'PAYOUT';
  amount: number;
  direction: 'CREDIT' | 'DEBIT';
  status: string;
  createdAt: string;
  serviceName?: string;
}

export interface EarningsConfig {
  minWithdrawal: number;
  maxWithdrawal: number | null;
  customRangeEarliestDate: string;
}
