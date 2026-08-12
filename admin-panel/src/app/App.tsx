import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { logoutSession, updateLastActivity } from '../redux/slices/authSlice';

// Layout & Common Components
import AdminLayout from '../components/layout/AdminLayout';

// Feature Pages (Skeletons to be fully implemented next)
import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import UsersPage from '../features/users/UsersPage';
import ProvidersPage from '../features/providers/ProvidersPage';
import BookingsPage from '../features/bookings/BookingsPage';
import LiveTrackingPage from '../features/tracking/LiveTrackingPage';
import PaymentsPage from '../features/payments/PaymentsPage';
import WalletPage from '../features/wallet/WalletPage';
import ServicesPage from '../features/services/ServicesPage';
import NotificationsPage from '../features/notifications/NotificationsPage';
import ReviewsPage from '../features/reviews/ReviewsPage';
import SupportPage from '../features/support/SupportPage';
import RoleManagementPage from '../features/roles/RoleManagementPage';
import AuditLogsPage from '../features/audit/AuditLogsPage';
import SettingsPage from '../features/settings/SettingsPage';

// Standard fallback if permission is denied
export const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 glassmorphism rounded-xl">
    <div className="w-16 h-16 bg-destructive/10 border border-destructive/20 text-destructive rounded-full flex items-center justify-center mb-4">
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6V9m0-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h2 className="text-2xl font-bold font-heading mb-2">Access Restricted</h2>
    <p className="text-muted-foreground max-w-md">
      Your administrative simulated role does not possess the permissions required to view this operational module.
    </p>
  </div>
);

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// Permission Guard Wrapper
interface GuardProps {
  permission: string;
  element: React.ReactElement;
}
const PermissionGuard = ({ permission, element }: GuardProps) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? element : <AccessDenied />;
};

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, logout } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inactivity session timeout trigger (Auto-logout after 15 minutes of inactivity)
  useEffect(() => {
    if (!isAuthenticated) return;

    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 Minutes
    let timeoutId: number;

    const resetTimer = () => {
      dispatch(updateLastActivity());
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setToastMessage('Session expired due to inactivity.');
        logout();
      }, INACTIVITY_LIMIT);
    };

    // User activity listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [isAuthenticated, dispatch, logout]);

  // Session timeout event subscription from axios interceptor
  useEffect(() => {
    const handleAuthTimeout = () => {
      setToastMessage('Your session has timed out. Please log in again.');
      logout();
    };

    window.addEventListener('justtap_auth_session_timeout', handleAuthTimeout);
    return () => {
      window.removeEventListener('justtap_auth_session_timeout', handleAuthTimeout);
    };
  }, [logout]);

  return (
    <BrowserRouter>
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-destructive text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
          <button className="text-white hover:text-gray-200 font-bold" onClick={() => setToastMessage(null)}>&times;</button>
        </div>
      )}
      
      <Routes>
        {/* Public Ingress Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Guarded Admin Command Center Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<PermissionGuard permission="VIEW_DASHBOARD" element={<DashboardPage />} />} />
            <Route path="/users" element={<PermissionGuard permission="MANAGE_USERS" element={<UsersPage />} />} />
            <Route path="/providers" element={<PermissionGuard permission="MANAGE_PROVIDERS" element={<ProvidersPage />} />} />
            <Route path="/bookings" element={<PermissionGuard permission="MANAGE_BOOKINGS" element={<BookingsPage />} />} />
            <Route path="/tracking" element={<PermissionGuard permission="MANAGE_BOOKINGS" element={<LiveTrackingPage />} />} />
            <Route path="/payments" element={<PermissionGuard permission="VIEW_PAYMENTS" element={<PaymentsPage />} />} />
            <Route path="/wallet" element={<PermissionGuard permission="VIEW_WALLETS" element={<WalletPage />} />} />
            <Route path="/services" element={<PermissionGuard permission="MANAGE_SERVICES" element={<ServicesPage />} />} />
            <Route path="/notifications" element={<PermissionGuard permission="VIEW_DASHBOARD" element={<NotificationsPage />} />} />
            <Route path="/reviews" element={<PermissionGuard permission="VIEW_REVIEWS" element={<ReviewsPage />} />} />
            <Route path="/support" element={<PermissionGuard permission="VIEW_TICKETS" element={<SupportPage />} />} />
            <Route path="/roles" element={<PermissionGuard permission="MANAGE_ROLES" element={<RoleManagementPage />} />} />
            <Route path="/audit" element={<PermissionGuard permission="VIEW_AUDIT_LOGS" element={<AuditLogsPage />} />} />
            <Route path="/settings" element={<PermissionGuard permission="MANAGE_SETTINGS" element={<SettingsPage />} />} />
          </Route>
        </Route>

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
