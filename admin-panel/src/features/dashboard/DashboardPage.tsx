import React from 'react';
import { 
  useGetBookingAnalyticsQuery, 
  useGetPendingApprovalsQuery, 
  useGetServicesHealthQuery 
} from '../../redux/slices/dashboardApi';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, Users, ShieldAlert, BadgeDollarSign, 
  ArrowUpRight, ArrowDownRight, Activity, Database, 
  AlertCircle, Server, CheckCircle2 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  // Fetch real-time data from microservices
  const { data: analytics, isLoading: analyticsLoading } = useGetBookingAnalyticsQuery();
  const { data: approvals, isLoading: approvalsLoading } = useGetPendingApprovalsQuery();
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useGetServicesHealthQuery(undefined, {
    pollingInterval: 30000 // Poll health statuses every 30 seconds
  });

  // Mock revenue history data
  const revenueHistory = [
    { name: '01 Aug', revenue: 98000, commission: 19600 },
    { name: '02 Aug', revenue: 104000, commission: 20800 },
    { name: '03 Aug', revenue: 112000, commission: 22400 },
    { name: '04 Aug', revenue: 95000, commission: 19000 },
    { name: '05 Aug', revenue: 125000, commission: 25000 },
    { name: '06 Aug', revenue: 138000, commission: 27600 },
    { name: '07 Aug', revenue: 145290, commission: 29058 },
  ];

  // Category distribution representation
  const categoryData = [
    { name: 'Electrical', value: 400 },
    { name: 'Cleaning', value: 300 },
    { name: 'Plumbing', value: 240 },
    { name: 'Pest Control', value: 180 },
    { name: 'Appliance Repair', value: 290 },
  ];
  
  const COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ec4899'];

  // Status mapping from analytics query or mock
  const bookingStatusData = [
    { name: 'Requested', count: analytics?.requestedCount || 12 },
    { name: 'Accepted', count: analytics?.acceptedCount || 8 },
    { name: 'Arrived', count: analytics?.arrivedCount || 5 },
    { name: 'Started', count: analytics?.startedCount || 14 },
    { name: 'Completed', count: analytics?.completedCount || 145 },
    { name: 'Cancelled', count: analytics?.cancelledCount || 10 },
  ];

  return (
    <div className="space-y-6">
      {/* Title Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-foreground">Operational Dashboard</h1>
          <p className="text-sm text-muted-foreground">Executive overview of platform activity, revenues, and microservice status feeds.</p>
        </div>
        
        <button
          onClick={refetchHealth}
          className="flex items-center gap-2 text-xs bg-secondary border border-border hover:border-primary/50 text-foreground px-3.5 py-2 rounded-lg transition-all cursor-pointer font-semibold shrink-0"
        >
          <Activity className="w-4 h-4 text-primary" />
          <span>Refresh health probes</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's revenue */}
        <div className="glassmorphism p-5 rounded-xl border border-border/40 relative">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue (Today)</span>
              <h3 className="text-2xl font-extrabold font-heading">₹145,290</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BadgeDollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs">
            <span className="flex items-center text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12.4%
            </span>
            <span className="text-muted-foreground">vs yesterday</span>
          </div>
        </div>

        {/* Commission */}
        <div className="glassmorphism p-5 rounded-xl border border-border/40">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Commission (20%)</span>
              <h3 className="text-2xl font-extrabold font-heading">₹29,058</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs">
            <span className="flex items-center text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="w-3.5 h-3.5" /> +8.2%
            </span>
            <span className="text-muted-foreground">since last week</span>
          </div>
        </div>

        {/* Active Bookings */}
        <div className="glassmorphism p-5 rounded-xl border border-border/40">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Bookings</span>
              <h3 className="text-2xl font-extrabold font-heading">
                {analyticsLoading ? '...' : (analytics?.total || 184)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs">
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">24 matching</span>
            <span className="text-muted-foreground">jobs currently in progress</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <Link to="/providers" className="glassmorphism p-5 rounded-xl border border-border/40 block hover:border-primary/40 transition-all cursor-pointer">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending KYC</span>
              <h3 className="text-2xl font-extrabold font-heading">
                {approvalsLoading ? '...' : approvals?.length || 12}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs">
            <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">Needs Review</span>
            <span className="text-muted-foreground">Action required</span>
          </div>
        </Link>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Growth Trend */}
        <div className="glassmorphism p-6 rounded-xl border border-border/40 lg:col-span-2 flex flex-col min-h-[380px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold font-heading">Revenue Growth (Weekly)</h3>
            <span className="text-xs text-muted-foreground">Currency: INR (₹)</span>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" name="Total Revenue" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" name="Commission Earned" dataKey="commission" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorComm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Status breakdown */}
        <div className="glassmorphism p-6 rounded-xl border border-border/40 flex flex-col min-h-[380px]">
          <h3 className="text-lg font-bold font-heading mb-6">Booking Lifecycles</h3>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingStatusData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                <Bar name="Bookings count" dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                  {bookingStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Completed' ? '#10b981' : entry.name === 'Cancelled' ? '#ef4444' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sub row: categories & health status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Popular categories */}
        <div className="glassmorphism p-6 rounded-xl border border-border/40 flex flex-col justify-between min-h-[320px]">
          <h3 className="text-lg font-bold font-heading mb-4">Service Shares</h3>
          <div className="flex items-center justify-center flex-1 min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground pt-4 border-t border-border/50">
            {categoryData.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Microservices health */}
        <div className="glassmorphism p-6 rounded-xl border border-border/40 lg:col-span-2 flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold font-heading">Backend Clusters Diagnoses</h3>
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-primary" /> Active Probes
            </span>
          </div>

          <div className="flex-1 space-y-3.5">
            {healthLoading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 w-full bg-secondary/35 rounded-lg animate-pulse" />
              ))
            ) : health ? (
              health.map((h, idx) => (
                <div key={idx} className="p-3.5 rounded-lg border border-border/40 bg-secondary/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className={`w-5 h-5 ${h.status === 'UP' ? 'text-primary' : 'text-destructive'}`} />
                    <span className="text-sm font-semibold">{h.service}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {h.latency !== undefined && (
                      <span className="text-xs text-muted-foreground">{h.latency} ms</span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                      h.status === 'UP' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}>
                      {h.status === 'UP' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" /> OFFLINE
                        </>
                      )}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No health diagnostic feed resolved. Check node processes.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
