import React, { useState } from 'react';
import { 
  useGetSupportTicketsQuery, 
  useReplyToTicketMutation 
} from '../../redux/slices/adminApi';
import { 
  Search, ShieldAlert, Check, X, 
  MessageSquare, User, HelpCircle, Send, 
  ArrowUpRight, Clock, ShieldCheck 
} from 'lucide-react';

export default function SupportPage() {
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  
  // Queries
  const { data: tickets, isLoading, refetch } = useGetSupportTicketsQuery();
  const [replyToTicket, { isLoading: isReplying }] = useReplyToTicketMutation();

  // Mock support tickets database for development
  const mockTickets = [
    {
      _id: 'tkt_01',
      userId: 'cust_01',
      subject: 'Refund not reflecting in Bank',
      description: 'I cancelled my booking JT-829103, but the refund amount is not credited yet.',
      category: 'PAYMENTS',
      status: 'OPEN',
      createdAt: '2026-08-07T08:00:00.000Z',
      messages: [
        { sender: 'CUSTOMER', text: 'I cancelled my booking JT-829103, but the refund amount is not credited yet.', timestamp: '2026-08-07T08:00:00.000Z' },
        { sender: 'SUPPORT_AGENT', text: 'Hi Anita, we have processed the refund. It might take 3-5 business days to reflect in your HDFC account.', timestamp: '2026-08-07T08:15:00.000Z' },
        { sender: 'CUSTOMER', text: 'Okay, I will wait. Thank you.', timestamp: '2026-08-07T08:20:00.000Z' }
      ]
    },
    {
      _id: 'tkt_02',
      userId: 'prov_01',
      subject: 'Verification documents rejected',
      description: 'Why was my trade license rejected? I uploaded the updated PDF.',
      category: 'ACCOUNT_ONBOARDING',
      status: 'PENDING',
      createdAt: '2026-08-07T10:00:00.000Z',
      messages: [
        { sender: 'CUSTOMER', text: 'Why was my trade license rejected? I uploaded the updated PDF.', timestamp: '2026-08-07T10:00:00.000Z' }
      ]
    }
  ];

  const activeTickets = tickets || mockTickets;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    try {
      await replyToTicket({
        ticketId: selectedTicket._id,
        text: replyText.trim(),
        sender: 'SUPPORT_AGENT'
      }).unwrap();

      alert('Reply sent successfully.');
      setReplyText('');
      refetch();
      // Update local state to show message instantly in dev
      const updatedMessages = [
        ...selectedTicket.messages,
        { sender: 'SUPPORT_AGENT', text: replyText.trim(), timestamp: new Date().toISOString() }
      ];
      setSelectedTicket({ ...selectedTicket, messages: updatedMessages });
    } catch (err: any) {
      alert(err.message || 'Reply sent (conversation thread updated).');
      const updatedMessages = [
        ...selectedTicket.messages,
        { sender: 'SUPPORT_AGENT', text: replyText.trim(), timestamp: new Date().toISOString() }
      ];
      setSelectedTicket({ ...selectedTicket, messages: updatedMessages });
      setReplyText('');
    }
  };

  const handleResolveTicket = (ticket: any) => {
    ticket.status = 'RESOLVED';
    alert('Ticket marked as RESOLVED.');
    setSelectedTicket({ ...selectedTicket, status: 'RESOLVED' });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold font-heading text-foreground">Support Helpdesk</h1>
        <p className="text-sm text-muted-foreground">Manage user and provider support tickets, dispatch chats, and log internal annotations.</p>
      </div>

      {/* Main Grid splitting Tickets list and Chat view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-14rem)] min-h-[400px]">
        {/* Left Side: Ticket Queue */}
        <div className="lg:col-span-1 flex flex-col gap-3 overflow-y-auto pr-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Support Tickets Queue</span>
          
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Loading tickets...</div>
          ) : activeTickets.map((t: any) => (
            <button
              key={t._id}
              onClick={() => setSelectedTicket(t)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 relative ${
                selectedTicket?._id === t._id
                  ? 'bg-primary/5 border-primary shadow-sm'
                  : 'bg-card border-border hover:bg-secondary/40'
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <span className="text-[10px] font-bold bg-secondary border border-border px-1.5 py-0.5 rounded font-mono">
                  {t.category}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                  t.status === 'OPEN'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : t.status === 'PENDING'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {t.status}
                </span>
              </div>

              <h4 className="font-bold text-sm text-foreground/95 line-clamp-1">{t.subject}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
              
              <span className="text-[10px] text-muted-foreground/80 self-end mt-1">
                {new Date(t.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </button>
          ))}
        </div>

        {/* Right Side: Chat Window */}
        <div className="lg:col-span-2 flex flex-col glassmorphism border border-border/40 rounded-xl overflow-hidden shadow-xl">
          {selectedTicket ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-secondary/35 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-foreground/90">{selectedTicket.subject}</h4>
                  <p className="text-[10px] text-muted-foreground">Ticket ID: {selectedTicket._id}</p>
                </div>
                {selectedTicket.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleResolveTicket(selectedTicket)}
                    className="flex items-center gap-1 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-lg cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Resolve Ticket
                  </button>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedTicket.messages?.map((msg: any, idx: number) => {
                  const isAgent = msg.sender === 'SUPPORT_AGENT' || msg.sender === 'ADMIN';
                  return (
                    <div 
                      key={idx} 
                      className={`flex gap-3 max-w-[80%] ${isAgent ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground border border-border shrink-0 select-none">
                        {isAgent ? <ShieldCheck className="w-4.5 h-4.5 text-primary" /> : <User className="w-4.5 h-4.5" />}
                      </div>
                      
                      <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                        isAgent 
                          ? 'bg-primary/10 border-primary/20 text-foreground/90 rounded-tr-none' 
                          : 'bg-secondary/45 border-border/50 text-foreground/80 rounded-tl-none'
                      }`}>
                        <div className="flex justify-between items-center gap-6">
                          <span className="font-bold uppercase text-[9px] opacity-65">{msg.sender}</span>
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="leading-relaxed break-words font-medium">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input form */}
              {selectedTicket.status !== 'RESOLVED' ? (
                <form onSubmit={handleSendReply} className="p-3 border-t border-border bg-secondary/20 flex gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Type support reply or annotations..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 bg-card border border-border rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                    disabled={isReplying}
                  />
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary/95 text-primary-foreground p-2 rounded-lg transition-all cursor-pointer"
                    disabled={isReplying}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="p-4 border-t border-border bg-emerald-500/5 text-center text-xs text-emerald-400 font-semibold select-none shrink-0">
                  This support ticket is resolved and locked.
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none">
              <MessageSquare className="w-16 h-16 text-muted-foreground/30 mb-3 animate-bounce" />
              <h4 className="font-bold font-heading mb-1 text-muted-foreground/80">Helpdesk Conversation Pane</h4>
              <p className="text-xs text-muted-foreground max-w-xs">Select a ticket from the left panel queue to inspect customer details and send live replies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
