import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { setSimulatedRole, AdminSubRole } from '../../redux/slices/authSlice';
import { ROLE_PERMISSIONS } from '../../hooks/useAuth';
import { 
  Shield, UserCheck, Lock, CheckSquare, 
  Square, ShieldAlert, Sparkles, Check 
} from 'lucide-react';

export default function RoleManagementPage() {
  const dispatch = useDispatch();
  const { simulatedRole } = useSelector((state: RootState) => state.auth);
  
  const [selectedRole, setSelectedRole] = useState<AdminSubRole>(simulatedRole);

  const allPermissions = [
    { key: 'VIEW_DASHBOARD', category: 'General', desc: 'Access dashboard analytics and stats' },
    { key: 'VIEW_HEALTH', category: 'General', desc: 'Access system microservice status and latencies' },
    
    { key: 'MANAGE_USERS', category: 'User Management', desc: 'Read and view customer profile accounts' },
    { key: 'SUSPEND_USERS', category: 'User Management', desc: 'Deactivate, suspend or block customer accounts' },
    
    { key: 'MANAGE_PROVIDERS', category: 'Provider Management', desc: 'Read and view provider profiles' },
    { key: 'APPROVE_PROVIDERS', category: 'Provider Management', desc: 'Approve provider onboarding requests' },
    
    { key: 'MANAGE_BOOKINGS', category: 'Booking Management', desc: 'View bookings list and timeline logs' },
    { key: 'CANCEL_BOOKINGS', category: 'Booking Management', desc: 'Cancel booking orders' },
    { key: 'RESCHEDULE_BOOKINGS', category: 'Booking Management', desc: 'Reschedule booking orders' },
    
    { key: 'MANAGE_SERVICES', category: 'Catalog Management', desc: 'Add/edit/remove catalog services' },
    { key: 'MANAGE_CATEGORIES', category: 'Catalog Management', desc: 'Add/edit/remove catalog categories' },
    
    { key: 'VIEW_PAYMENTS', category: 'Finance', desc: 'View payment transactions and settlements' },
    { key: 'MANAGE_REFUNDS', category: 'Finance', desc: 'Dispatch payment refunds' },
    { key: 'VIEW_WALLETS', category: 'Finance', desc: 'View customer and provider wallet balances' },
    { key: 'ADJUST_WALLET_BALANCE', category: 'Finance', desc: 'Credit or debit wallet balances manually' },
    { key: 'APPROVE_WITHDRAWALS', category: 'Finance', desc: 'Approve provider cashout payout requests' },
    
    { key: 'MODERATE_REVIEWS', category: 'Moderation', desc: 'Hide or delete reported review content' },
    { key: 'ASSIGN_TICKETS', category: 'Support Helpdesk', desc: 'Assign tickets to agents' },
    { key: 'REPLY_TICKETS', category: 'Support Helpdesk', desc: 'Send chat replies to support tickets' },
    
    { key: 'VIEW_AUDIT_LOGS', category: 'Security', desc: 'View administrative action trace audits' },
    { key: 'MANAGE_SETTINGS', category: 'Security', desc: 'Modify base platform commission fee configs' },
    { key: 'MANAGE_ROLES', category: 'Security', desc: 'Modify administrative role permissions' }
  ];

  const handleSimulateRole = (role: AdminSubRole) => {
    dispatch(setSimulatedRole(role));
    setSelectedRole(role);
    alert(`Simulation Role updated to: ${role}. UI permissions and routing rules adjusted instantly.`);
  };

  const hasPerm = (role: AdminSubRole, permKey: string) => {
    return ROLE_PERMISSIONS[role]?.includes(permKey) || false;
  };

  // Group permissions by category
  const categories = Array.from(new Set(allPermissions.map(p => p.category)));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold font-heading text-foreground">Role Governance</h1>
        <p className="text-sm text-muted-foreground">Define feature access matrices, check administrative sub-role permissions, and toggle simulation profiles.</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Select Sub-role */}
        <div className="lg:col-span-1 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Administrative Roles</span>
          
          <div className="space-y-2">
            {(Object.keys(ROLE_PERMISSIONS) as AdminSubRole[]).map((role) => {
              const isActive = selectedRole === role;
              const isCurrentlySimulating = simulatedRole === role;

              return (
                <div
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex justify-between items-center ${
                    isActive
                      ? 'bg-primary/5 border-primary shadow-sm'
                      : 'bg-card border-border hover:bg-secondary/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-bold text-sm">{role}</span>
                  </div>

                  {isCurrentlySimulating ? (
                    <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 animate-pulse">
                      <Check className="w-3 h-3" /> Simulated
                    </span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSimulateRole(role); }}
                      className="text-[10px] font-bold text-primary hover:underline shrink-0 cursor-pointer"
                    >
                      Simulate
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Permissions Matrix grid */}
        <div className="lg:col-span-2 glassmorphism p-6 rounded-xl border border-border/40 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <div>
              <h3 className="text-lg font-bold font-heading text-foreground">Permissions: {selectedRole}</h3>
              <p className="text-xs text-muted-foreground">List of granular platform operational capabilities configured for this role.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
                {ROLE_PERMISSIONS[selectedRole]?.length || 0} Grants
              </span>
            </div>
          </div>

          <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
            {categories.map((cat) => (
              <div key={cat} className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1">{cat}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allPermissions.filter(p => p.category === cat).map((p) => {
                    const active = hasPerm(selectedRole, p.key);

                    return (
                      <div 
                        key={p.key} 
                        className={`p-3 rounded-lg border flex gap-3 items-start transition-all ${
                          active 
                            ? 'bg-primary/5 border-primary/20 text-foreground/90' 
                            : 'bg-secondary/10 border-border/30 text-muted-foreground/60'
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {active ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground/50" />
                          )}
                        </div>
                        <div>
                          <h5 className="font-bold text-xs">{p.key.replace(/_/g, ' ')}</h5>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{p.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
