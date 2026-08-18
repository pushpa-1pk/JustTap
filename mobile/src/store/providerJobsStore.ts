import { create } from 'zustand';
import { ProviderJob, JobStatus } from '../types/job';

interface JobsState {
  jobs: ProviderJob[];
  selectedTab: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  searchQuery: string;
  activeFilter: {
    serviceType: string | null;
    paymentStatus: string | null;
  } | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  currentPage: number;
  error: string | null;

  // Actions
  setJobs: (jobs: ProviderJob[]) => void;
  addJobs: (newJobs: ProviderJob[]) => void;
  updateJob: (jobId: string, updates: Partial<ProviderJob>) => void;
  removeJob: (jobId: string) => void;
  setSelectedTab: (tab: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED') => void;
  setSearchQuery: (query: string) => void;
  setFilter: (filter: JobsState['activeFilter']) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setLoadingMore: (loadingMore: boolean) => void;
  setError: (error: string | null) => void;
  setHasNextPage: (hasNext: boolean) => void;
  setCurrentPage: (page: number) => void;
}

export const useProviderJobsStore = create<JobsState>((set) => ({
  jobs: [],
  selectedTab: 'UPCOMING',
  searchQuery: '',
  activeFilter: null,
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  hasNextPage: false,
  currentPage: 1,
  error: null,

  setJobs: (jobs) => set({ jobs, error: null }),
  addJobs: (newJobs) => set((state) => {
    // Avoid duplicates based on job id (Requirement 36)
    const existingIds = new Set(state.jobs.map(j => j.id));
    const uniqueNew = newJobs.filter(j => !existingIds.has(j.id));
    return { jobs: [...state.jobs, ...uniqueNew] };
  }),
  updateJob: (jobId, updates) => set((state) => ({
    jobs: state.jobs.map((job) =>
      job.id === jobId ? { ...job, ...updates } : job
    ),
  })),
  removeJob: (jobId) => set((state) => ({
    jobs: state.jobs.filter((job) => job.id !== jobId),
  })),
  setSelectedTab: (selectedTab) => set({ selectedTab, error: null }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilter: (activeFilter) => set({ activeFilter }),
  setLoading: (isLoading) => set({ isLoading }),
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  setLoadingMore: (isLoadingMore) => set({ isLoadingMore }),
  setError: (error) => set({ error }),
  setHasNextPage: (hasNextPage) => set({ hasNextPage }),
  setCurrentPage: (currentPage) => set({ currentPage }),
}));
export default useProviderJobsStore;
