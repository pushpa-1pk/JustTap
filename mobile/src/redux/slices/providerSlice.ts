import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ActiveJob } from '@/types/job';

interface ProviderState {
  activeJob: ActiveJob | null;
  todayEarnings: number;
}

const initialState: ProviderState = {
  activeJob: null,
  todayEarnings: 0,
};

const providerSlice = createSlice({
  name: 'provider',
  initialState,
  reducers: {
    setActiveJob: (state, action: PayloadAction<ActiveJob | null>) => {
      state.activeJob = action.payload;
    },
    setTodayEarnings: (state, action: PayloadAction<number>) => {
      state.todayEarnings = action.payload;
    },
    resetProviderState: (state) => {
      state.activeJob = null;
      state.todayEarnings = 0;
    }
  }
});

export const { setActiveJob, setTodayEarnings, resetProviderState } = providerSlice.actions;
export default providerSlice.reducer;
export type { ProviderState };
