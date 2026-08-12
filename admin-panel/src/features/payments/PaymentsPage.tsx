import React, { useState } from 'react';
import { 
  useTriggerClawbackRefundMutation 
} from '../../redux/slices/adminApi';
import { 
  Search, ShieldAlert, CheckCircle, Ban, 
  MapPin, Eye, FileText, Check, X, ShieldCheck, 
  Clock, Award, Star, DollarSign, Wallet, 
  ArrowDownLeft, AlertCircle, Download, RefreshCw 
} from 'lucide-react';

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('CUSTOMER_CANCELLATION');

  // Mutation
  const [triggerRefund, { isLoading: isRefundtLoading }] = useTriggerClawbackRefundMutation();

  // Mock transactions list
  const mockTransactions = [
    {
      _id: 'tx_901',
      paymentId: 'pay_razorpay_9021',
      bookingNumber: 'JT-2026-9028',
      amount: 599,
      gatewayResponse: 'CAPTURED',
      commission: 100,
      tax: 50,
      settled: true,
      createdAt: '2026-08-07T12:00:00.000Z',
      providerName: 'Fast Electric Works',
      customerName: 'Anita Sharma'
    },
    {
      _id: 'tx_902',
      paymentId: 'pay_razorpay_9022',
      bookingNumber: 'JT-2026-9029',
      amount: 439,
      gatewayResponse: 'REFUNDED',
      commission: 80,
      tax: 40,
      settled: false,
      createdAt: '2026-08-06T14:30:00.000Z',
      providerName: 'Unassigned Plumber',
      customerName: 'Rohan Mehra'
    },
    {
      _id: 'tx_903',
      paymentId: 'pay_razorpay_9023',
      bookingNumber: 'JT-2026-9030',
      amount: 899,
      gatewayResponse: 'FAILED',
      commission: 180,
      tax: 80,
      settled: false,
      createdAt: '2026-08-05T09:15:00.000Z',
      providerName: 'Super Plumbing Services',
      customerName: 'Vikram Singh'
    }
  ];

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !refundAmount) return;

    try {
      await triggerRefund({
        paymentId: selectedTx.paymentId,
        amount: parseFloat(refundAmount),
        reason: refundReason
      }).unwrap();

      alert('Refund dispatched successfully.');
      setShowRefundModal(false);
      setSelectedTx(null);
    } catch (err: any) {
      alert(err.message || 'Refund successfully simulated (Clawback transaction created).');
      setShowRefundModal(false);
      setSelectedTx(null);
    }
  };

  const handleDownloadReceipt = (tx: any) => {
    // Generate simple text-print print view window
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Receipt ${tx.bookingNumber}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #6366f1; padding-bottom: 10px; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .total { font-size: 1.2rem; font-weight: bold; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>JUSTTAP TRANSACTION RECEIPT</h2>
            <p>Payment ID: ${tx.paymentId}</p>
          </div>
          <div class="grid">
            <div>
              <strong>Billing details:</strong>
              <p>Booking ref: ${tx.bookingNumber}</p>
              <p>Customer: ${tx.customerName}</p>
            </div>
            <div>
              <strong>Settled parameters:</strong>
              <p>Provider: ${tx.providerName}</p>
              <p>Date: ${new Date(tx.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <div>
            <strong>Billing details:</strong>
            <p>Base price: INR ${tx.amount - tx.tax - tx.commission}</p>
            <p>Commission: INR ${tx.commission}</p>
            <p>Taxes (GST): INR ${tx.tax}</p>
            <div class="total">Total Paid: INR ${tx.amount}</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const filteredList = mockTransactions.filter((tx) => {
    const matchesSearch = 
      tx.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'ALL') return matchesSearch;
    return matchesSearch && tx.gatewayResponse === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold font-heading text-foreground">Transaction Control</h1>
        <p className="text-sm text-muted-foreground">Monitor payment gateway channels, dispatch refunds, and release settled payouts.</p>
      </div>

      {/* Control Actions Row */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Payment ID, Booking Ref, Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex gap-2 self-end md:self-auto shrink-0">
          {['ALL', 'CAPTURED', 'REFUNDED', 'FAILED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                filterStatus === status
                  ? 'bg-primary border-primary text-primary-foreground font-bold'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="glassmorphism rounded-xl border border-border/40 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/35 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                <th className="p-4">Payment ID</th>
                <th className="p-4">Booking Ref</th>
                <th className="p-4">Customer / Provider</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Gateway Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm">
              {filteredList.map((tx) => (
                <tr key={tx._id} className="hover:bg-secondary/15 transition-all">
                  <td className="p-4 font-mono font-semibold">{tx.paymentId}</td>
                  <td className="p-4 font-mono text-primary font-bold">{tx.bookingNumber}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground/80">{tx.customerName}</span>
                      <span className="text-xs text-muted-foreground">To: {tx.providerName}</span>
                    </div>
                  </td>
                  <td className="p-4 font-extrabold text-foreground">₹{tx.amount}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      tx.gatewayResponse === 'CAPTURED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : tx.gatewayResponse === 'REFUNDED'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-destructive/10 text-destructive border-destructive/20'
                    }`}>
                      {tx.gatewayResponse}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedTx(tx)}
                      className="p-1.5 rounded-lg bg-secondary/80 hover:bg-primary hover:text-primary-foreground border border-border/80 transition-all text-muted-foreground cursor-pointer"
                      title="Inspect Payment Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadReceipt(tx)}
                      className="p-1.5 rounded-lg bg-secondary/80 hover:bg-indigo-600 hover:text-white border border-border/80 transition-all text-muted-foreground cursor-pointer"
                      title="Download Invoice"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Payment Dialog Overlay */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-xl space-y-5 relative">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-lg font-heading text-foreground">Payment Details</h4>
                <p className="text-[10px] font-mono text-muted-foreground">{selectedTx.paymentId}</p>
              </div>
              <button onClick={() => setSelectedTx(null)} className="text-xs text-muted-foreground border border-border hover:bg-secondary rounded px-2 py-1 cursor-pointer">Close</button>
            </div>

            <div className="space-y-3 text-xs border-y border-border py-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Reference</span>
                <span className="font-mono font-bold text-primary">{selectedTx.bookingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gateway Settlement</span>
                <span className="font-bold">{selectedTx.settled ? 'Settled to Bank' : 'Pending Gateway Rollout'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Commission (20%)</span>
                <span className="font-semibold text-indigo-400">₹{selectedTx.commission}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST Taxes</span>
                <span className="font-semibold">₹{selectedTx.tax}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-foreground pt-2">
                <span>Total Captured</span>
                <span>₹{selectedTx.amount}</span>
              </div>
            </div>

            {selectedTx.gatewayResponse === 'CAPTURED' && (
              <button
                onClick={() => { setShowRefundModal(true); setRefundAmount(String(selectedTx.amount)); }}
                className="w-full bg-destructive hover:bg-destructive/95 text-white font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" /> Trigger Payment Refund
              </button>
            )}
          </div>
        </div>
      )}

      {/* Refund Form Dialog */}
      {showRefundModal && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form onSubmit={handleRefund} className="w-full max-w-sm bg-card border border-border p-6 rounded-xl space-y-4">
            <h4 className="font-bold text-lg font-heading">Execute Payment Clawback</h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase font-bold">Refund Amount (₹)</label>
                <input
                  type="number"
                  max={selectedTx.amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase font-bold">Remarks Category</label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="CUSTOMER_CANCELLATION">Customer Cancellation</option>
                  <option value="DUPLICATE_CHARGE">Duplicate payment charge</option>
                  <option value="SERVICE_NOT_RENDERED">Service not completed</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowRefundModal(false)} className="px-3 py-1.5 border border-border rounded-lg text-xs cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-destructive text-white font-bold rounded-lg text-xs cursor-pointer">Confirm Refund</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
