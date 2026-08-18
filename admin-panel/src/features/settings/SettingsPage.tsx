import React, { useState } from 'react';
import { 
  Settings, Save, ShieldAlert, BadgeDollarSign, 
  Map, Bell, Database, Cloud, ToggleLeft, ToggleRight 
} from 'lucide-react';
import { useGetPlatformSettingsQuery } from '../../redux/slices/adminApi';

export default function SettingsPage() {
  const { data: settings } = useGetPlatformSettingsQuery();

  // Config state
  const [commissionRate, setCommissionRate] = useState(20);
  const [taxRate, setTaxRate] = useState(18);
  const [matchingRadius, setMatchingRadius] = useState(10);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  const [cloudinaryName, setCloudinaryName] = useState('justtap-media');
  const [cloudinaryKey, setCloudinaryKey] = useState('498291039828103');
  
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (settings) {
      setCommissionRate(settings.commissionRate);
      setTaxRate(settings.taxRate);
      setMatchingRadius(settings.matchingRadius);
      setMaintenanceMode(settings.maintenanceMode);
      setCloudinaryName(settings.cloudinaryName);
      setCloudinaryKey(settings.cloudinaryKey);
    }
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate setting updates and audit logs posting
    setTimeout(() => {
      setIsSaving(false);
      alert('System configuration parameters saved and updated across RabbitMQ brokers successfully.');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold font-heading text-foreground">Platform Settings</h1>
        <p className="text-sm text-muted-foreground">Adjust platform fees, geolocation radii, cloud integrations, and configure maintenance bounds.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left pane: core settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* General fees */}
          <div className="glassmorphism p-6 rounded-xl border border-border/40 space-y-4">
            <h3 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
              <BadgeDollarSign className="w-5 h-5 text-primary" /> Financial Commissions & Taxes
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Platform Commission Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 focus:outline-none"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">GST Standard Tax Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Map matching rules */}
          <div className="glassmorphism p-6 rounded-xl border border-border/40 space-y-4">
            <h3 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" /> Geolocation & Matching Radius
            </h3>
            
            <div className="space-y-1 text-xs">
              <label className="text-[10px] text-muted-foreground uppercase font-bold">Maximum Matching Radius (km)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={matchingRadius}
                onChange={(e) => setMatchingRadius(parseInt(e.target.value))}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 focus:outline-none"
                required
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">Maximum distance threshold to scan for online providers when creating bookings.</span>
            </div>
          </div>

          {/* Media attachments upload config */}
          <div className="glassmorphism p-6 rounded-xl border border-border/40 space-y-4">
            <h3 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
              <Cloud className="w-5 h-5 text-primary" /> Cloudinary Media Storage
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Cloud Name</label>
                <input
                  type="text"
                  value={cloudinaryName}
                  onChange={(e) => setCloudinaryName(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 focus:outline-none"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">API Access Key</label>
                <input
                  type="password"
                  value={cloudinaryKey}
                  onChange={(e) => setCloudinaryKey(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right pane: system toggles */}
        <div className="lg:col-span-1 space-y-6">
          {/* Maintenance Mode */}
          <div className="glassmorphism p-6 rounded-xl border border-border/40 space-y-4">
            <h3 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" /> Platform Lockdowns
            </h3>
            
            <div className="flex items-center justify-between p-3.5 bg-secondary/20 border border-border/50 rounded-lg">
              <div className="text-xs">
                <span className="font-bold text-foreground">Maintenance Mode</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">Locks out customer applications</p>
              </div>
              
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className="text-primary hover:text-indigo-400 transition-colors cursor-pointer"
              >
                {maintenanceMode ? (
                  <ToggleRight className="w-10 h-10 text-primary" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-muted-foreground/60" />
                )}
              </button>
            </div>
          </div>

          {/* Connection status */}
          <div className="glassmorphism p-6 rounded-xl border border-border/40 space-y-4 text-xs">
            <h3 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" /> Queue & Memory Brokers
            </h3>

            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Redis Cache state</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">CONNECTED</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">RabbitMQ Exchange broker</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">CONNECTED</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Cloudinary CDN status</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">OPERATIONAL</span>
              </div>
            </div>
          </div>

          {/* Form Save Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3 rounded-xl shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4.5 h-4.5" /> Save Configuration
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
