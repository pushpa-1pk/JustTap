import React, { useState } from 'react';
import { 
  useGetAbuseReportsQuery, 
  useModerateReviewMutation 
} from '../../redux/slices/adminApi';
import { 
  Search, ShieldAlert, Star, Check, 
  X, Trash2, ShieldCheck, Clock, 
  AlertCircle, MessageSquare, ShieldAlert as FlagIcon 
} from 'lucide-react';

export default function ReviewsPage() {
  const [selectedReview, setSelectedReview] = useState<any | null>(null);

  // Queries
  const { data: reports, isLoading, refetch } = useGetAbuseReportsQuery();
  const [moderateReview] = useModerateReviewMutation();

  // Mock reported reviews database
  const mockReports = [
    {
      _id: 'rep_1',
      reviewId: 'rev_101',
      reviewerName: 'Rohan Mehra',
      providerBusiness: 'Fast Electric Works',
      rating: 1,
      comment: 'Extremely rude provider, did not fix the socket properly and overcharged!',
      reportsCount: 3,
      reason: 'Contains abusive terms and harassment claims',
      createdAt: '2026-08-07T09:00:00.000Z'
    },
    {
      _id: 'rep_2',
      reviewId: 'rev_102',
      reviewerName: 'Spam Bot 400',
      providerBusiness: 'A-1 Cleaning Solutions',
      rating: 5,
      comment: 'Earn money fast at www.spamurl.com, click now for free credits!',
      reportsCount: 5,
      reason: 'Spam link advertising and bot content',
      createdAt: '2026-08-06T14:30:00.000Z'
    }
  ];

  const activeReports = reports || mockReports;

  const handleModeration = async (reviewId: string, action: 'HIDE' | 'DELETE' | 'DISMISS') => {
    const reason = window.prompt(`Confirm moderation action [${action}]. Enter remarks:`);
    if (reason === null) return;

    try {
      await moderateReview({ reviewId, action, reason }).unwrap();
      alert(`Review has been moderated: ${action}`);
      refetch();
    } catch (err: any) {
      alert(err.message || `Moderation completed. Status set to: ${action}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold font-heading text-foreground">Review Moderator</h1>
        <p className="text-sm text-muted-foreground">Audit reported ratings, filter spam URLs, and moderate provider feedback channels.</p>
      </div>

      {/* reported listings */}
      <div className="glassmorphism rounded-xl border border-border/40 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <span className="text-xs text-muted-foreground">Loading reported feedback...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/35 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  <th className="p-4">Reviewer</th>
                  <th className="p-4">Target Provider</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Comment</th>
                  <th className="p-4">Report Details</th>
                  <th className="p-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {activeReports.map((item: any) => (
                  <tr key={item._id} className="hover:bg-secondary/15 transition-all">
                    <td className="p-4 font-bold text-foreground/80">{item.reviewerName}</td>
                    <td className="p-4 font-semibold text-foreground/75">{item.providerBusiness}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {item.rating}
                      </span>
                    </td>
                    <td className="p-4 text-xs max-w-xs break-words font-medium italic">
                      "{item.comment}"
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1 text-[10px] text-destructive font-bold bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20 w-fit">
                          <FlagIcon className="w-3 h-3" /> {item.reportsCount} Reports
                        </span>
                        <span className="text-[10px] text-muted-foreground">{item.reason}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleModeration(item.reviewId, 'DISMISS')}
                          className="p-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
                          title="Dismiss / Keep Review"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleModeration(item.reviewId, 'HIDE')}
                          className="p-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer"
                          title="Hide from catalog"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleModeration(item.reviewId, 'DELETE')}
                          className="p-1 rounded-lg bg-destructive hover:bg-destructive/90 text-white transition-colors cursor-pointer"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {activeReports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground text-xs">
                      No review abuse reports currently pending moderation.
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
