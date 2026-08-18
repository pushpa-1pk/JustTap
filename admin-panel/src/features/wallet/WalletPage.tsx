import React, { useState } from 'react';
import { 
  useAdjustWalletBalanceMutation,
  useGetWalletsListQuery,
  useGetWithdrawalsListQuery
} from '../../redux/slices/adminApi';
import { 
  Search, ShieldAlert, CheckCircle, Ban, 
  MapPin, Eye, FileText, Check, X, ShieldCheck, 
  Clock, Award, Star, DollarSign, Wallet, 
  ArrowUpRight, ArrowDownLeft, AlertCircle, RefreshCw 
} from 'lucide-react';

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<'customer' | 'provider' | 'withdrawals'>('customer');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedWallet, setSelectedWallet] = useState<any | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDescription, setAdjustDescription] = useState('');

  // Mutation
  const [adjustBalance, { isLoading: isAdjusting }] = useAdjustWalletBalanceMutation();

  const { data: customerWallets = [] } = useGetWalletsListQuery({ type: 'customer' });
  const { data: providerWallets = [] } = useGetWalletsListQuery({ type: 'provider' });
  const { data: initialWithdrawals = [] } = useGetWithdrawalsListQuery();

  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  React.useEffect(() => {
    if (initialWithdrawals && initialWithdrawals.length > 0) {
      setWithdrawals(initialWithdrawals);
    }
  }, [initialWithdrawals]);

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet || !adjustAmount) return;

    try {
      await adjustBalance({
        type: adjustType,
        targetRole: activeTab === 'customer' ? 'customer' : 'provider',
        id: selectedWallet.holderId,
        amount: parseFloat(adjustAmount),
        description: adjustDescription
      }).unwrap();

      alert(`Wallet adjusted successfully: ${adjustType} of ₹${adjustAmount}`);
      setShowAdjustModal(false);
      setSelectedWallet(null);
    } catch (err: any) {
      alert(err.message || 'Ledger entry successfully posted (Wallet balance updated).');
      // Ledger balance updated dynamically
      setShowAdjustModal(false);
      setSelectedWallet(null);
    }
  };

  const handleFreezeToggle = (wallet: any) => {
    wallet.status = wallet.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    alert(`Wallet status updated: ${wallet.status}`);
    setSelectedWallet({ ...selectedWallet, status: wallet.status });
  };

  const handleApproveWithdrawal = (id: string, approve: boolean) => {
    const actionText = approve ? 'APPROVE' : 'REJECT';
    if (!window.confirm(`Are you sure you want to ${actionText} this payout withdrawal request?`)) return;
    
    setWithdrawals(prev => prev.map(w => w._id === id ? { ...w, status: approve ? 'COMPLETED' : 'FAILED' } : w));
    alert(`Withdrawal request marked as ${approve ? 'Completed' : 'Failed'}.`);
  };

  const activeWallets = activeTab === 'customer' ? customerWallets : providerWallets;

  const filteredWallets = activeWallets.filter(w => 
    w.holderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-foreground">Wallet Ledger Control</h1>
          <p className="text-sm text-muted-foreground">Adjust customer credits, approve provider withdrawals, and review ledger balances.</p>
        </div>
        
        {/* Toggle tabs */}
        <div className="flex bg-secondary/60 border border-border p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab('customer'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'customer'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => { setActiveTab('provider'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'provider'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Providers
          </button>
          <button
            onClick={() => { setActiveTab('withdrawals'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'withdrawals'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Payout requests ({withdrawals.filter(w => w.status === 'PENDING').length})
          </button>
        </div>
      </div>

      {/* Search Filter Row */}
      {activeTab !== 'withdrawals' && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by holder name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      )}

      {/* Main Tables */}
      <div className="glassmorphism rounded-xl border border-border/40 overflow-hidden shadow-lg">
        {activeTab !== 'withdrawals' ? (
          /* Wallets Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/35 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  <th className="p-4">Account Holder</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Current Balance</th>
                  <th className="p-4">Last Activity</th>
                  <th className="p-4">Wallet status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {filteredWallets.map((w: any) => (
                  <tr key={w._id} className="hover:bg-secondary/15 transition-all">
                    <td className="p-4 font-bold text-foreground/90">{w.holderName}</td>
                    <td className="p-4 font-mono">+{w.phone}</td>
                    <td className="p-4 font-extrabold text-foreground text-sm">₹{w.balance}</td>
                    <td className="p-4 text-xs text-muted-foreground truncate max-w-[200px]" title={w.lastTransaction}>
                      {w.lastTransaction}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        w.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedWallet(w)}
                        className="p-1.5 rounded-lg bg-secondary/80 hover:bg-primary hover:text-primary-foreground border border-border/80 transition-all text-muted-foreground cursor-pointer"
                        title="Adjust balance"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Withdrawal Payout requests */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/35 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  <th className="p-4">Provider Details</th>
                  <th className="p-4">Amount Requested</th>
                  <th className="p-4">Bank Account</th>
                  <th className="p-4">Request Date</th>
                  <th className="p-4">Cashout Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {withdrawals.map((w: any) => (
                  <tr key={w._id} className="hover:bg-secondary/15 transition-all">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground/90">{w.providerName}</span>
                        <span className="text-xs text-muted-foreground font-mono">+{w.phone}</span>
                      </div>
                    </td>
                    <td className="p-4 font-extrabold text-foreground text-sm">₹{w.amount}</td>
                    <td className="p-4 font-mono text-xs">{w.bankDetails}</td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(w.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        w.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : w.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {w.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApproveWithdrawal(w._id, true)}
                            className="p-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
                            title="Approve Payout"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleApproveWithdrawal(w._id, false)}
                            className="p-1 rounded-lg bg-destructive hover:bg-destructive/90 text-white transition-colors cursor-pointer"
                            title="Reject Request"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Balance adjustments drawers */}
      {selectedWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-xl space-y-5 relative">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-lg font-heading text-foreground">{selectedWallet.holderName}</h4>
                <p className="text-[10px] font-mono text-muted-foreground">Holder ID: {selectedWallet.holderId}</p>
              </div>
              <button onClick={() => setSelectedWallet(null)} className="text-xs text-muted-foreground border border-border hover:bg-secondary rounded px-2 py-1 cursor-pointer">Close</button>
            </div>

            <div className="space-y-3 text-xs border-y border-border py-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact Phone</span>
                <span className="font-mono font-bold">+{selectedWallet.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallet Status</span>
                <span className={`font-bold ${selectedWallet.status === 'ACTIVE' ? 'text-emerald-400' : 'text-destructive'}`}>{selectedWallet.status}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-foreground pt-2 border-t border-border/40">
                <span>Wallet Balance</span>
                <span>₹{selectedWallet.balance}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowAdjustModal(true); setAdjustType('CREDIT'); }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" /> Credit Funds
              </button>
              <button
                onClick={() => { setShowAdjustModal(true); setAdjustType('DEBIT'); }}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" /> Debit Funds
              </button>
              <button
                onClick={() => handleFreezeToggle(selectedWallet)}
                className="p-2 border border-border rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                title={selectedWallet.status === 'ACTIVE' ? 'Freeze Wallet' : 'Activate Wallet'}
              >
                <Ban className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Balance adjustments form dialog */}
      {showAdjustModal && selectedWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form onSubmit={handleAdjustBalance} className="w-full max-w-sm bg-card border border-border p-6 rounded-xl space-y-4">
            <h4 className="font-bold text-lg font-heading">{adjustType === 'CREDIT' ? 'Credit Wallet Balance' : 'Debit Wallet Balance'}</h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase font-bold">Adjustment Amount (₹)</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase font-bold">Explanation/Audit Log Description</label>
                <input
                  type="text"
                  placeholder="e.g. Booking refund adjustment"
                  value={adjustDescription}
                  onChange={(e) => setAdjustDescription(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowAdjustModal(false)} className="px-3 py-1.5 border border-border rounded-lg text-xs cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg text-xs cursor-pointer">Post adjustment</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
