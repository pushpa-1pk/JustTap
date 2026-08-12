import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { setSimulatedRole, AdminSubRole } from '../../redux/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import LiveActivityPanel from './LiveActivityPanel';
import { 
  LayoutDashboard, Users, Briefcase, Calendar, Map, 
  DollarSign, Wallet, BookOpen, BellRing, Star, 
  LifeBuoy, UserCheck, History, Settings, Menu, 
  ChevronLeft, Bell, Search, LogOut, Sun, Moon, 
  Activity, Shield, Laptop, Command 
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  permission: string;
}

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { user, simulatedRole, hasPermission, logout } = useAuth();
  
  // Layout States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activityPanelOpen, setActivityPanelOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Apply theme class to document
  useEffect(() => {
    const body = document.body;
    if (theme === 'light') {
      body.classList.add('light');
      body.classList.remove('dark');
    } else {
      body.classList.add('dark');
      body.classList.remove('light');
    }
  }, [theme]);

  // Command palette hotkey handler (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const menuItems: SidebarItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, permission: 'VIEW_DASHBOARD' },
    { name: 'Customer Manager', path: '/users', icon: <Users className="w-5 h-5" />, permission: 'MANAGE_USERS' },
    { name: 'Provider Manager', path: '/providers', icon: <Briefcase className="w-5 h-5" />, permission: 'MANAGE_PROVIDERS' },
    { name: 'Booking Manager', path: '/bookings', icon: <Calendar className="w-5 h-5" />, permission: 'MANAGE_BOOKINGS' },
    { name: 'Real-time Tracking', path: '/tracking', icon: <Map className="w-5 h-5" />, permission: 'MANAGE_BOOKINGS' },
    { name: 'Payment Control', path: '/payments', icon: <DollarSign className="w-5 h-5" />, permission: 'VIEW_PAYMENTS' },
    { name: 'Wallet Ledgers', path: '/wallet', icon: <Wallet className="w-5 h-5" />, permission: 'VIEW_WALLETS' },
    { name: 'Service Catalog', path: '/services', icon: <BookOpen className="w-5 h-5" />, permission: 'MANAGE_SERVICES' },
    { name: 'Notification Center', path: '/notifications', icon: <BellRing className="w-5 h-5" />, permission: 'VIEW_DASHBOARD' },
    { name: 'Review Moderator', path: '/reviews', icon: <Star className="w-5 h-5" />, permission: 'VIEW_REVIEWS' },
    { name: 'Support Tickets', path: '/support', icon: <LifeBuoy className="w-5 h-5" />, permission: 'VIEW_TICKETS' },
    { name: 'Role Governance', path: '/roles', icon: <UserCheck className="w-5 h-5" />, permission: 'MANAGE_ROLES' },
    { name: 'Audit Logs', path: '/audit', icon: <History className="w-5 h-5" />, permission: 'VIEW_AUDIT_LOGS' },
    { name: 'Platform Settings', path: '/settings', icon: <Settings className="w-5 h-5" />, permission: 'MANAGE_SETTINGS' }
  ];

  const adminRoles: AdminSubRole[] = [
    'Super Admin', 'Admin', 'Support Agent', 'Finance', 'Moderator', 'Operations', 'Analytics'
  ];

  // Helper to compile breadcrumbs from url pathname
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(p => p);
    if (paths.length === 0) return [{ name: 'Command Center', path: '/dashboard', active: true }];
    return paths.map((path, idx) => {
      const isLast = idx === paths.length - 1;
      const cleanName = path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
      return {
        name: cleanName,
        path: '/' + paths.slice(0, idx + 1).join('/'),
        active: isLast
      };
    });
  };

  // Command palette actions filtering
  const commandPaletteOptions = [
    { label: 'Go to Dashboard', action: () => { navigate('/dashboard'); setShowCommandPalette(false); } },
    { label: 'Go to Settings', action: () => { navigate('/settings'); setShowCommandPalette(false); } },
    { label: 'Go to Users list', action: () => { navigate('/users'); setShowCommandPalette(false); } },
    { label: 'Go to Bookings list', action: () => { navigate('/bookings'); setShowCommandPalette(false); } },
    { label: 'Go to Provider Map', action: () => { navigate('/tracking'); setShowCommandPalette(false); } },
    { label: 'Toggle Theme', action: () => { setTheme(t => t === 'dark' ? 'light' : 'dark'); setShowCommandPalette(false); } },
    { label: 'Select Super Admin Role', action: () => { dispatch(setSimulatedRole('Super Admin')); setShowCommandPalette(false); } },
    { label: 'Select Finance Role', action: () => { dispatch(setSimulatedRole('Finance')); setShowCommandPalette(false); } },
    { label: 'Select Support Agent Role', action: () => { dispatch(setSimulatedRole('Support Agent')); setShowCommandPalette(false); } },
    { label: 'Log out from system', action: () => { logout(); setShowCommandPalette(false); } }
  ];

  const filteredCommands = commandPaletteOptions.filter(cmd => 
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen w-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside 
        className={`h-screen border-r border-border bg-card flex flex-col transition-all duration-300 relative shrink-0 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Sidebar Logo Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-4">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-extrabold text-sm font-heading tracking-wider text-gradient">
                JUSTTAP COMMAND
              </span>
            </div>
          )}
          {sidebarCollapsed && (
            <Shield className="w-6 h-6 text-primary mx-auto" />
          )}
        </div>

        {/* Navigation Items (Filtered by permission) */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {menuItems.map((item) => {
            const hasAccess = hasPermission(item.permission);
            if (!hasAccess) return null;

            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative cursor-pointer ${
                  isActive 
                    ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20' 
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                }`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <div className="shrink-0">{item.icon}</div>
                {!sidebarCollapsed && <span>{item.name}</span>}
                
                {/* Tooltip on Hover in Collapsed State */}
                {sidebarCollapsed && (
                  <div className="absolute left-16 z-50 bg-popover border border-border text-popover-foreground text-xs py-1.5 px-3 rounded-lg shadow-xl opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border bg-secondary/20 flex flex-col gap-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center py-1.5 rounded-lg hover:bg-secondary border border-border/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      {/* Main Panel Area */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden relative">
        {/* Header bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 z-30 shrink-0">
          {/* Left section: breadcrumbs & search */}
          <div className="flex items-center gap-6">
            {/* Breadcrumb navigator */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
              <Laptop className="w-3.5 h-3.5" />
              <span>/</span>
              {getBreadcrumbs().map((b, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span>/</span>}
                  {b.path && !b.active ? (
                    <Link to={b.path} className="hover:text-foreground transition-colors font-medium">
                      {b.name}
                    </Link>
                  ) : (
                    <span className="font-semibold text-foreground truncate max-w-[120px]">{b.name}</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Quick Palette Button */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 border border-border/60 hover:border-primary/40 px-3 py-1.5 rounded-lg transition-all cursor-pointer hover:text-foreground"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search console...</span>
              <kbd className="bg-card border border-border px-1.5 py-0.5 rounded text-[10px] font-mono">Ctrl+K</kbd>
            </button>
          </div>

          {/* Right section: theme, role switcher, notify, profiles */}
          <div className="flex items-center gap-4">
            {/* Role Simulation Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase font-bold hidden lg:inline-block">Simulate:</span>
              <select
                value={simulatedRole}
                onChange={(e) => dispatch(setSimulatedRole(e.target.value as AdminSubRole))}
                className="bg-secondary/70 border border-border text-xs rounded-lg px-2.5 py-1.5 font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-[140px]"
              >
                {adminRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Theme Swapper */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Real-time Status Stream Toggle */}
            <button
              onClick={() => setActivityPanelOpen(true)}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors relative cursor-pointer"
              title="Live Feeds"
            >
              <Activity className="w-5 h-5 text-indigo-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            </button>

            {/* Separator line */}
            <div className="w-[1px] h-6 bg-border" />

            {/* Admin User Profile */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shadow-inner uppercase">
                {user?.phone ? user.phone.slice(-2) : 'A'}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-bold truncate max-w-[120px]">+{user?.phone}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{simulatedRole}</span>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Pane */}
        <main className="flex-1 overflow-y-auto p-6 bg-secondary/10">
          <Outlet />
        </main>
      </div>

      {/* Slide-out Live Event Tracker Panel */}
      <LiveActivityPanel 
        isOpen={activityPanelOpen} 
        onClose={() => setActivityPanelOpen(false)} 
      />

      {/* Command Palette Modal Dial */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card border border-border shadow-2xl rounded-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Command className="w-5 h-5 text-primary" />
              <input
                type="text"
                placeholder="Type a command or screen to navigate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                autoFocus
              />
              <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded">ESC</span>
            </div>
            
            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={opt.action}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-primary hover:text-primary-foreground transition-all flex justify-between items-center cursor-pointer font-medium"
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] opacity-60">Action</span>
                  </button>
                ))
              ) : (
                <div className="text-center text-xs text-muted-foreground py-6">No matching actions found.</div>
              )}
            </div>
          </div>
          <div onClick={() => setShowCommandPalette(false)} className="fixed inset-0 -z-10" />
        </div>
      )}
    </div>
  );
}
