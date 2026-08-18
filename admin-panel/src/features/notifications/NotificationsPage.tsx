import React, { useState } from 'react';
import { 
  Send, Bell, Mail, MessageSquare, Plus, 
  Trash2, AlertTriangle, Play, RefreshCw, 
  CheckCircle, FileText, Check 
} from 'lucide-react';
import {
  useGetAlertTemplatesQuery,
  useGetDlqQueueQuery
} from '../../redux/slices/adminApi';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'campaign' | 'dlq' | 'templates'>('campaign');
  
  // Compose States
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState<'PUSH' | 'SMS' | 'EMAIL'>('PUSH');
  const [targetType, setTargetType] = useState<'ALL' | 'CUSTOMERS' | 'PROVIDERS' | 'CITY'>('ALL');
  const [targetCity, setTargetCity] = useState('Mumbai');

  const { data: templates = [] } = useGetAlertTemplatesQuery();
  const { data: initialDlq = [] } = useGetDlqQueueQuery();

  const [dlqQueue, setDlqQueue] = useState<any[]>([]);

  React.useEffect(() => {
    if (initialDlq && initialDlq.length > 0) {
      setDlqQueue(initialDlq);
    }
  }, [initialDlq]);

  const handleSendCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    alert(`Campaign successfully compiled & dispatched!\nChannel: ${channel}\nTarget: ${targetType === 'CITY' ? `City: ${targetCity}` : targetType}`);
    setTitle('');
    setBody('');
  };

  const handleRetryDlq = (id: string) => {
    alert('Pushing message frame back to Active RabbitMQ Exchange brokers...');
    setDlqQueue(prev => prev.filter(item => item._id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-foreground">Notification Center</h1>
          <p className="text-sm text-muted-foreground">Orchestrate platform push, SMS, and email alerts, manage templates, and audit delivery failures.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-secondary/60 border border-border p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('campaign')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'campaign'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Dispatch Campaign
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Alert Templates
          </button>
          <button
            onClick={() => setActiveTab('dlq')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dlq'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Dead Letter Queue (DLQ) ({dlqQueue.length})
          </button>
        </div>
      </div>

      {activeTab === 'campaign' ? (
        /* Compose alert campaign */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 glassmorphism p-6 rounded-xl border border-border/40 space-y-4">
            <h3 className="text-lg font-bold font-heading text-foreground flex items-center gap-1.5">
              <Send className="w-5 h-5 text-primary" /> Compose Bulk Message
            </h3>
            
            <form onSubmit={handleSendCampaign} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Delivery Channel</label>
                  <select
                    value={channel}
                    onChange={(e: any) => setChannel(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
                  >
                    <option value="PUSH">Mobile Push Notification</option>
                    <option value="SMS">SMS Message Alert</option>
                    <option value="EMAIL">Email Newsletters</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Target Audience</label>
                  <select
                    value={targetType}
                    onChange={(e: any) => setTargetType(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Registered Users</option>
                    <option value="CUSTOMERS">Customers Only</option>
                    <option value="PROVIDERS">Providers Only</option>
                    <option value="CITY">Target Specific City</option>
                  </select>
                </div>
              </div>

              {targetType === 'CITY' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Select Target City</label>
                  <input
                    type="text"
                    value={targetCity}
                    onChange={(e) => setTargetCity(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 focus:outline-none"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Message Title</label>
                <input
                  type="text"
                  placeholder="e.g. Monsoon cleaning offers!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Message Content (Body)</label>
                <textarea
                  placeholder="Type alert content here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 h-28 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Compile & Dispatch Campaign <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Device Preview */}
          <div className="lg:col-span-1 flex flex-col justify-center items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Device Preview</span>
            <div className="w-56 h-[340px] border-[6px] border-secondary bg-black rounded-[2rem] shadow-2xl relative p-4 flex flex-col pt-8">
              {/* Speaker */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-secondary rounded-full" />
              
              {/* Notification Banner */}
              <div className="p-2 rounded bg-card/90 border border-white/10 text-[9px] space-y-1 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex justify-between">
                  <span className="font-bold flex items-center gap-1"><Bell className="w-2.5 h-2.5 text-primary" /> JUSTTAP</span>
                  <span className="text-muted-foreground">Now</span>
                </div>
                <h5 className="font-bold text-foreground truncate">{title || 'Monsoon Offer!'}</h5>
                <p className="text-muted-foreground line-clamp-2">{body || 'Enter message body to see the device rendering preview here.'}</p>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'templates' ? (
        /* Templates List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t: any) => (
            <div key={t.id} className="p-4 bg-card border border-border rounded-xl flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-xs uppercase text-muted-foreground font-mono">{t.name}</span>
                  <span className="text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded">{t.channel}</span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed font-semibold italic">"{t.content}"</p>
              </div>
              <div className="pt-4 border-t border-border/50 text-[10px] text-muted-foreground flex justify-between">
                <span>Ref: {t.id}</span>
                <button className="hover:text-primary transition-all font-bold cursor-pointer">Edit Template</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* DLQ failed reports list */
        <div className="glassmorphism rounded-xl border border-border/40 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/35 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  <th className="p-4">Message ID</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Recipient</th>
                  <th className="p-4">Failure Reason</th>
                  <th className="p-4">Failed Time</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {dlqQueue.map((item) => (
                  <tr key={item._id} className="hover:bg-secondary/15 transition-all text-xs">
                    <td className="p-4 font-mono font-bold">{item.messageId}</td>
                    <td className="p-4 font-bold text-primary">{item.channel}</td>
                    <td className="p-4 font-mono">{item.payload.to}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-xs text-destructive font-bold bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {item.error}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleRetryDlq(item._id)}
                        className="p-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer inline-flex items-center justify-center"
                        title="Retry Dispatch"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {dlqQueue.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground text-xs">
                      All failed logs processed successfully. Dead letter queue is empty.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
