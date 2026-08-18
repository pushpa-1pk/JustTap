import React, { useState } from 'react';
import {
  useGetApprovalDetailsQuery,
  useApproveProviderRequestMutation,
  useRejectProviderRequestMutation,
  useVerifyProviderDocumentMutation,
} from '../../redux/slices/adminApi';
import { useGetPendingApprovalsQuery } from '../../redux/slices/dashboardApi';
import {
  Search, Clock, ShieldCheck, ShieldAlert, FileText,
  Check, X, Eye, AlertCircle, ChevronRight, User,
  MapPin, CreditCard, Loader2,
} from 'lucide-react';

// --- Detail Drawer ---
function ApprovalDetailDrawer({
  approvalRequestId,
  onClose,
  onActionDone,
}: {
  approvalRequestId: string;
  onClose: () => void;
  onActionDone: () => void;
}) {
  const { data: details, isLoading, refetch } = useGetApprovalDetailsQuery(approvalRequestId);
  const [approveRequest, { isLoading: isApproving }] = useApproveProviderRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectProviderRequestMutation();
  const [verifyDoc, { isLoading: isVerifying }] = useVerifyProviderDocumentMutation();

  const [docDecisions, setDocDecisions] = useState<Record<string, { isApproved: boolean; rejectionReason: string }>>({});
  const [providerRejectReason, setProviderRejectReason] = useState('');
  const [showProviderReject, setShowProviderReject] = useState(false);

  const profile = details?.profile;
  const documents: any[] = details?.documents || [];
  const bankDetails = details?.bankDetails;
  const approvalReq = details?.approvalRequest;

  const setDocDecision = (docId: string, isApproved: boolean, rejectionReason = '') => {
    setDocDecisions(prev => ({ ...prev, [docId]: { isApproved, rejectionReason } }));
  };

  const handleVerifyDoc = async (docId: string, isApproved: boolean, rejectionReason?: string) => {
    if (!isApproved && !rejectionReason) return;
    try {
      await verifyDoc({ documentId: docId, isApproved, rejectionReason }).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to update document status.');
    }
  };

  const handleApproveProvider = async () => {
    if (!window.confirm('Approve this provider? All required documents must already be individually approved.')) return;
    try {
      await approveRequest({ approvalRequestId }).unwrap();
      alert('Provider approved successfully.');
      onActionDone();
      onClose();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to approve provider.');
    }
  };

  const handleRejectProvider = async () => {
    if (!providerRejectReason.trim()) { alert('Please enter a rejection reason.'); return; }
    try {
      await rejectRequest({ approvalRequestId, reason: providerRejectReason }).unwrap();
      alert('Provider registration rejected.');
      onActionDone();
      onClose();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to reject provider.');
    }
  };

  const docStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (s === 'rejected') return 'bg-destructive/10 text-destructive border-destructive/20';
    if (s === 'under_review') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-secondary text-muted-foreground border-border';
  };

  const docStatusLabel = (status: string) => {
    const map: Record<string, string> = { approved: 'Approved', rejected: 'Rejected', under_review: 'Under Review', pending: 'Pending' };
    return map[status?.toLowerCase()] || status;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-secondary/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-foreground">KYC Document Review</h2>
              <p className="text-[10px] text-muted-foreground font-mono">{approvalRequestId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Provider Info */}
            {profile && (
              <div className="p-5 border-b border-border/60">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Provider Profile</h3>
                <div className="grid grid-cols-2 gap-2.5 text-sm">
                  <div className="bg-secondary/25 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Business</p>
                    <p className="font-bold text-foreground">{profile.businessName || 'N/A'}</p>
                  </div>
                  <div className="bg-secondary/25 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Experience</p>
                    <p className="font-bold text-foreground">{profile.experience || 0} yrs</p>
                  </div>
                  <div className="bg-secondary/25 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Working Radius</p>
                    <p className="font-bold text-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary" />{profile.workingRadius} km</p>
                  </div>
                  <div className="bg-secondary/25 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">KYC Status</p>
                    <p className={`font-bold capitalize ${profile.verificationStatus === 'approved' ? 'text-emerald-400' : profile.verificationStatus === 'rejected' ? 'text-destructive' : 'text-amber-400'}`}>{profile.verificationStatus?.replace('_', ' ')}</p>
                  </div>
                </div>
                {profile.bio && <p className="text-xs text-muted-foreground mt-2.5 bg-secondary/25 rounded-lg p-2.5 italic">"{profile.bio}"</p>}
              </div>
            )}

            {/* Bank Details */}
            {bankDetails && (
              <div className="px-5 py-4 border-b border-border/60">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Bank Account</h3>
                <div className="bg-secondary/25 rounded-lg p-3 text-xs space-y-1.5">
                  <div className="flex justify-between"><span className="text-muted-foreground">Account Holder</span><span className="font-semibold">{bankDetails.accountHolderName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Account No.</span><span className="font-mono font-semibold">{bankDetails.accountNumberMasked || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">IFSC</span><span className="font-mono font-semibold">{bankDetails.ifscCode}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span className="font-semibold">{bankDetails.bankName} ({bankDetails.accountType})</span></div>
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="px-5 py-4">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Verification Documents ({documents.length})</h3>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs"><AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />No documents uploaded yet.</div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc: any) => {
                    const decision = docDecisions[doc._id];
                    const isPending = doc.status === 'pending' || doc.status === 'under_review';
                    return (
                      <div key={doc._id} className="border border-border/60 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-secondary/20">
                          <span className="text-xs font-bold text-foreground uppercase tracking-wide">{doc.documentType.replace(/_/g, ' ')}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${docStatusBadge(doc.status)}`}>{docStatusLabel(doc.status)}</span>
                            <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"><Eye className="w-3.5 h-3.5" /></a>
                          </div>
                        </div>
                        <div className="h-28 bg-black/30 border-y border-border/40 flex items-center justify-center">
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                            <FileText className="w-7 h-7" /><span className="text-xs">Click to open document</span>
                          </a>
                        </div>
                        {doc.status === 'rejected' && doc.rejectionReason && (
                          <div className="px-4 py-2 bg-destructive/5 border-b border-destructive/20">
                            <p className="text-xs text-destructive font-medium flex items-start gap-1.5"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{doc.rejectionReason}</p>
                          </div>
                        )}
                        <div className="px-4 py-1.5 text-[10px] text-muted-foreground border-b border-border/30">
                          Uploaded: {new Date(doc.uploadedAt || Date.now()).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="p-4 space-y-2">
                          {isPending || doc.status === 'rejected' ? (
                            <>
                              <button onClick={() => handleVerifyDoc(doc._id, true)} disabled={isVerifying} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition-all cursor-pointer">
                                <Check className="w-4 h-4" /> Approve Document
                              </button>
                              {decision?.isApproved === false ? (
                                <div className="space-y-2">
                                  <textarea placeholder="Rejection reason for provider..." value={decision.rejectionReason} onChange={(e) => setDocDecision(doc._id, false, e.target.value)} rows={2} className="w-full bg-secondary border border-destructive/50 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-destructive resize-none placeholder:text-muted-foreground" />
                                  <div className="flex gap-2">
                                    <button onClick={() => handleVerifyDoc(doc._id, false, decision.rejectionReason)} disabled={!decision.rejectionReason.trim() || isVerifying} className="flex-1 bg-destructive hover:bg-destructive/90 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"><X className="w-3.5 h-3.5" />Confirm Rejection</button>
                                    <button onClick={() => setDocDecisions(prev => { const n = { ...prev }; delete n[doc._id]; return n; })} className="px-3 py-2 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground cursor-pointer">Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <button onClick={() => setDocDecision(doc._id, false)} className="w-full flex items-center justify-center gap-2 border border-destructive/60 text-destructive hover:bg-destructive/10 text-xs font-bold py-2 rounded-lg transition-all cursor-pointer"><X className="w-4 h-4" />Reject Document</button>
                              )}
                            </>
                          ) : (
                            <div className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold ${doc.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-destructive/10 text-destructive'}`}>
                              {doc.status === 'approved' ? <><ShieldCheck className="w-4 h-4" />Approved</> : <><AlertCircle className="w-4 h-4" />Rejected</>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer: global approve / reject */}
        {approvalReq?.status === 'pending' && (
          <div className="p-5 border-t border-border bg-card/90 space-y-3">
            {showProviderReject ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Overall Rejection Reason</label>
                <textarea value={providerRejectReason} onChange={(e) => setProviderRejectReason(e.target.value)} placeholder="Explain why this provider registration is being rejected..." rows={3} className="w-full bg-secondary border border-destructive/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-destructive resize-none placeholder:text-muted-foreground" />
                <div className="flex gap-2">
                  <button onClick={handleRejectProvider} disabled={!providerRejectReason.trim() || isRejecting} className="flex-1 bg-destructive hover:bg-destructive/90 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                    {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldAlert className="w-4 h-4" />Confirm Rejection</>}
                  </button>
                  <button onClick={() => setShowProviderReject(false)} className="px-4 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground cursor-pointer">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={handleApproveProvider} disabled={isApproving} className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-sm font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                  {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4" />Approve Registration</>}
                </button>
                <button onClick={() => setShowProviderReject(true)} className="flex-1 border border-destructive/60 text-destructive hover:bg-destructive/10 text-sm font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                  <ShieldAlert className="w-4 h-4" />Reject Registration
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Page ---
export default function KycReviewPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: approvalsData, isLoading, refetch } = useGetPendingApprovalsQuery();
  const rawData = approvalsData as any;
  const pendingList: any[] = Array.isArray(rawData) ? rawData : (rawData?.items ?? []);

  const filtered = pendingList.filter((a: any) =>
    a.providerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusBadge = (status: string) => {
    if (status === 'approved') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (status === 'rejected') return 'bg-destructive/10 text-destructive border-destructive/20';
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-foreground">KYC Review Queue</h1>
          <p className="text-sm text-muted-foreground">Review provider KYC submissions, verify documents, and approve or reject registrations.</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold px-3 py-2 rounded-lg">
          <Clock className="w-4 h-4" />{pendingList.length} Pending
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search by request ID or provider ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors" />
      </div>

      <div className="glassmorphism rounded-xl border border-border/40 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center gap-3 text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin text-primary" /><span className="text-xs">Loading KYC queue...</span></div>
        ) : filtered.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-3 text-muted-foreground"><ShieldCheck className="w-12 h-12 opacity-30" /><p className="text-sm font-medium">No pending KYC submissions</p><p className="text-xs opacity-60">All requests have been processed.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/35 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  <th className="p-4">Request ID</th>
                  <th className="p-4">Provider ID</th>
                  <th className="p-4">Submitted</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {filtered.map((req: any) => (
                  <tr key={req._id} className="hover:bg-secondary/15 transition-all group">
                    <td className="p-4"><span className="font-mono text-xs text-foreground/80">{req._id}</span></td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"><User className="w-3.5 h-3.5 text-primary" /></div>
                        <span className="font-mono text-xs text-foreground/80">{req.providerId}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{new Date(req.requestedAt || req.createdAt || Date.now()).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge(req.status)}`}><Clock className="w-3 h-3" />{req.status?.toUpperCase().replace('_', ' ')}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => setSelectedId(req._id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-all cursor-pointer">
                        Review <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedId && (
        <ApprovalDetailDrawer
          approvalRequestId={selectedId}
          onClose={() => setSelectedId(null)}
          onActionDone={() => { refetch(); setSelectedId(null); }}
        />
      )}
    </div>
  );
}

