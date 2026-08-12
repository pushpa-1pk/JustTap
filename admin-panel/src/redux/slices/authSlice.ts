import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { setAccessToken, setRefreshToken, setRememberMe } from '../../api/axiosClient';

// Supported administrative sub-roles for RBAC Simulation
export type AdminSubRole = 
  | 'Super Admin' 
  | 'Admin' 
  | 'Support Agent' 
  | 'Finance' 
  | 'Moderator' 
  | 'Operations' 
  | 'Analytics';

export interface UserSession {
  id: string;
  phone: string;
  role: string;      // Backend role: 'admin', 'customer', 'provider'
  roles: string[];
  accountStatus: string;
  isPhoneVerified: boolean;
  profileCompleted: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserSession | null;
  simulatedRole: AdminSubRole;
  rememberMe: boolean;
  lastActivity: number;
}

// Load initial session state from localStorage securely
const getStoredUser = (): UserSession | null => {
  try {
    const data = localStorage.getItem('justtap_user');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const getStoredSimulatedRole = (): AdminSubRole => {
  const role = localStorage.getItem('justtap_simulated_role');
  return (role as AdminSubRole) || 'Super Admin';
};

const initialState: AuthState = {
  isAuthenticated: !!localStorage.getItem('justtap_access_token') && !!getStoredUser(),
  user: getStoredUser(),
  simulatedRole: getStoredSimulatedRole(),
  rememberMe: localStorage.getItem('justtap_remember_me') === 'true',
  lastActivity: Date.now(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        user: UserSession;
        rememberMe: boolean;
      }>
    ) => {
      const { accessToken, refreshToken, user, rememberMe } = action.payload;
      
      state.isAuthenticated = true;
      state.user = user;
      state.rememberMe = rememberMe;
      state.lastActivity = Date.now();
      
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setRememberMe(rememberMe);
      localStorage.setItem('justtap_user', JSON.stringify(user));
    },
    
    setSimulatedRole: (state, action: PayloadAction<AdminSubRole>) => {
      state.simulatedRole = action.payload;
      localStorage.setItem('justtap_simulated_role', action.payload);
    },
    
    updateLastActivity: (state) => {
      state.lastActivity = Date.now();
    },
    
    logoutSession: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.lastActivity = Date.now();
      
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem('justtap_user');
      localStorage.removeItem('justtap_simulated_role');
    },
  },
});

export const { setCredentials, setSimulatedRole, updateLastActivity, logoutSession } = authSlice.actions;

export default authSlice.reducer;
