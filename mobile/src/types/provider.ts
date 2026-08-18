export interface Provider {
  id: string;
  firstName: string;
  rating: number;
  isVerified: boolean;
}

export interface DashboardStats {
  todayJobs: number;
  todayEarnings: number;
  completedJobs: number;
  rating: number;
  weeklyEarnings: number;
}

export interface RecentJob {
  id: string;
  serviceName: string;
  completedAt: string;
  amount: number;
  rating: number | null;
}
