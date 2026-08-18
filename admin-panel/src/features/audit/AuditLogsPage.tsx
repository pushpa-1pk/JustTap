import React, { useState } from 'react';
import { useGetAuditLogsQuery } from '../../redux/slices/adminApi';
import { 
  Search, ShieldAlert, History, User, 
  MapPin, Eye, FileText, Check, X, 
  Calendar, AlertCircle, RefreshCw 
} from 'lucide-react';

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Queries
  const { data: logs, isLoading } = useGetAuditLogsQuery({
    search: searchTerm || undefined
  });

  const activeLogs = logs || [];

  const filteredLogs = activeLogs.filter((l: any) => 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.actorPhone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold font-heading text-foreground">Audit logs</h1>
        <p className="text-sm text-muted-foreground">Trace administrative updates, transaction rollbacks, and platform setting tweaks.</p>
      </div>

      {/* Control Actions Row */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by action, target, actor phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Logs Table */}
      <div className="glassmorphism rounded-xl border border-border/40 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <span className="text-xs text-muted-foreground">Loading audit records...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/35 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Admin Actor</th>
                  <th className="p-4">Action Type</th>
                  <th className="p-4">Target Resource</th>
                  <th className="p-4">Modifications</th>
                  <th className="p-4">Diagnostics (IP & Agent)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {filteredLogs.map((log: any) => (
                  <tr key={log._id} className="hover:bg-secondary/10 transition-all font-mono">
                    <td className="p-4 text-muted-foreground font-sans">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 font-bold text-foreground">+{log.actorPhone}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border bg-secondary border-border text-[10px] font-bold text-primary">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-foreground/80 font-sans">{log.target}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5 text-[10px]">
                        <span className="text-destructive font-semibold font-sans">{log.oldValue}</span>
                        <span className="text-emerald-400 font-semibold font-sans">{log.newValue}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col text-[10px] text-muted-foreground">
                        <span className="font-bold">IP: {log.ipAddress}</span>
                        <span className="truncate max-w-[150px] font-sans" title={log.userAgent}>{log.userAgent}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground text-xs font-sans">
                      No audit records retrieved.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
