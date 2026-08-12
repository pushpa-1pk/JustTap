import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { AdminSubRole, logoutSession } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';

// CURATED ADMINISTRATIVE RBAC MAPPING
export const ROLE_PERMISSIONS: Record<AdminSubRole, string[]> = {
  'Super Admin': [
    'VIEW_DASHBOARD', 'VIEW_HEALTH', 'MANAGE_USERS', 'SUSPEND_USERS', 'MANAGE_PROVIDERS', 'APPROVE_PROVIDERS',
    'MANAGE_BOOKINGS', 'CANCEL_BOOKINGS', 'RESCHEDULE_BOOKINGS', 'MANAGE_SERVICES', 'MANAGE_CATEGORIES',
    'VIEW_PAYMENTS', 'MANAGE_REFUNDS', 'MANAGE_SETTLEMENTS', 'VIEW_WALLETS', 'ADJUST_WALLET_BALANCE', 'APPROVE_WITHDRAWALS',
    'VIEW_REVIEWS', 'MODERATE_REVIEWS', 'VIEW_TICKETS', 'REPLY_TICKETS', 'ASSIGN_TICKETS', 'VIEW_ANALYTICS', 'EXPORT_REPORTS',
    'VIEW_AUDIT_LOGS', 'MANAGE_SETTINGS', 'TOGGLE_MAINTENANCE', 'MANAGE_ROLES'
  ],
  'Admin': [
    'VIEW_DASHBOARD', 'VIEW_HEALTH', 'MANAGE_USERS', 'SUSPEND_USERS', 'MANAGE_PROVIDERS', 'APPROVE_PROVIDERS',
    'MANAGE_BOOKINGS', 'CANCEL_BOOKINGS', 'RESCHEDULE_BOOKINGS', 'MANAGE_SERVICES', 'MANAGE_CATEGORIES',
    'VIEW_PAYMENTS', 'MANAGE_REFUNDS', 'MANAGE_SETTLEMENTS', 'VIEW_WALLETS', 'ADJUST_WALLET_BALANCE', 'APPROVE_WITHDRAWALS',
    'VIEW_REVIEWS', 'MODERATE_REVIEWS', 'VIEW_TICKETS', 'REPLY_TICKETS', 'ASSIGN_TICKETS', 'VIEW_ANALYTICS', 'EXPORT_REPORTS',
    'VIEW_AUDIT_LOGS', 'MANAGE_SETTINGS'
  ],
  'Support Agent': [
    'VIEW_DASHBOARD', 'MANAGE_USERS', 'MANAGE_PROVIDERS', 'MANAGE_BOOKINGS',
    'VIEW_REVIEWS', 'VIEW_TICKETS', 'REPLY_TICKETS', 'ASSIGN_TICKETS'
  ],
  'Finance': [
    'VIEW_DASHBOARD', 'VIEW_PAYMENTS', 'MANAGE_REFUNDS', 'MANAGE_SETTLEMENTS',
    'VIEW_WALLETS', 'ADJUST_WALLET_BALANCE', 'APPROVE_WITHDRAWALS', 'VIEW_ANALYTICS', 'EXPORT_REPORTS'
  ],
  'Moderator': [
    'VIEW_DASHBOARD', 'VIEW_REVIEWS', 'MODERATE_REVIEWS', 'VIEW_TICKETS', 'REPLY_TICKETS'
  ],
  'Operations': [
    'VIEW_DASHBOARD', 'VIEW_HEALTH', 'MANAGE_USERS', 'MANAGE_PROVIDERS', 'APPROVE_PROVIDERS',
    'MANAGE_BOOKINGS', 'CANCEL_BOOKINGS', 'RESCHEDULE_BOOKINGS', 'MANAGE_SERVICES', 'MANAGE_CATEGORIES'
  ],
  'Analytics': [
    'VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'EXPORT_REPORTS'
  ]
};

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, simulatedRole, lastActivity } = useSelector(
    (state: RootState) => state.auth
  );

  const hasPermission = (permission: string): boolean => {
    // If user is not logged in, they have no permissions
    if (!isAuthenticated || !user) return false;
    
    // Non-admin roles (customer/provider) have no administrative permissions
    if (user.role !== 'admin' && !user.roles.includes('admin')) return false;

    const permissions = ROLE_PERMISSIONS[simulatedRole] || [];
    return permissions.includes(permission);
  };

  const handleLogout = () => {
    dispatch(logoutSession());
    navigate('/login');
  };

  return {
    isAuthenticated,
    user,
    simulatedRole,
    lastActivity,
    hasPermission,
    logout: handleLogout,
  };
};
