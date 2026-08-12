import React, { useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Bell, BookOpen, AlertCircle, 
  UserPlus, UserCheck, Star, HelpCircle, 
  CreditCard, RefreshCw, X, Circle 
} from 'lucide-react';

export interface ActivityEvent {
  id: string;
  type: 'booking' | 'payment' | 'user' | 'provider' | 'review' | 'support' | 'notification';
  title: string;
  message: string;
  timestamp: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

interface LiveActivityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveActivityPanel({ isOpen, onClose }: LiveActivityPanelProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const { socket, isConnected } = useSocket('/tracking');

  // Load initial mock logs to populate the center on boot
  useEffect(() => {
    setEvents([
      {
        id: 'init-1',
        type: 'booking',
        title: 'New Booking Request',
        message: 'Scheduled Electrician Service requested by Customer Anita Sharma (₹499)',
        timestamp: 'Just now',
        severity: 'info',
      },
      {
        id: 'init-2',
        type: 'payment',
        title: 'Payment Received',
        message: '₹599 captured via Razorpay for Booking #JT-829103',
        timestamp: '2 mins ago',
        severity: 'success',
      },
      {
        id: 'init-3',
        type: 'provider',
        title: 'Provider Online',
        message: 'Electrician Ramesh Kumar set status to ONLINE in Mumbai Suburbs',
        timestamp: '5 mins ago',
        severity: 'success',
      },
      {
        id: 'init-4',
        type: 'support',
        title: 'Ticket Escalated',
        message: 'Ticket #4928 "Refund not showing in wallet" escalated to Finance',
        timestamp: '15 mins ago',
        severity: 'warning',
      },
      {
        id: 'init-5',
        type: 'review',
        title: 'Review Flagged',
        message: 'Review #REV-9201 flagged as possible SPAM by system rules',
        timestamp: '30 mins ago',
        severity: 'error',
      }
    ]);
  }, []);

  // Listen to WebSocket events from tracking-service
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen to provider location/telemetry updates
    socket.on('telemetry:stream', (data: any) => {
      const newEvent: ActivityEvent = {
        id: `socket-${Date.now()}`,
        type: 'booking',
        title: 'Live Telemetry Ping',
        message: `Provider ID ${data.providerId?.slice(-6)} moving. ETA: ${data.eta || 'N/A'} mins (Speed: ${data.speed || 0} km/h)`,
        timestamp: 'Live',
        severity: 'info',
      };
      setEvents(prev => [newEvent, ...prev.slice(0, 19)]);
    });

    // Listen to geofence arrival
    socket.on('geofence:arrived', (data: any) => {
      const newEvent: ActivityEvent = {
        id: `socket-${Date.now()}`,
        type: 'booking',
        title: 'Provider Arrived',
        message: `Booking #${data.bookingId?.slice(-6)}: Provider has arrived at customer geofence radius.`,
        timestamp: 'Live',
        severity: 'success',
      };
      setEvents(prev => [newEvent, ...prev.slice(0, 19)]);
    });

    // Listen to booking status lifecycle signals
    socket.on('booking:lifecycle:accepted', (data: any) => {
      const newEvent: ActivityEvent = {
        id: `socket-${Date.now()}`,
        type: 'booking',
        title: 'Booking Accepted',
        message: `Provider Ramesh Kumar accepted Booking #${data.bookingId?.slice(-6)}`,
        timestamp: 'Live',
        severity: 'success',
      };
      setEvents(prev => [newEvent, ...prev.slice(0, 19)]);
    });

    return () => {
      socket.off('telemetry:stream');
      socket.off('geofence:arrived');
      socket.off('booking:lifecycle:accepted');
    };
  }, [socket, isConnected]);

  // Periodic simulated admin events generator to keep panel alive and dynamic
  useEffect(() => {
    const templates: Omit<ActivityEvent, 'id' | 'timestamp'>[] = [
      {
        type: 'user',
        title: 'New Customer Registered',
        message: 'Vikram Singh signed up via Web App in Pune',
        severity: 'success',
      },
      {
        type: 'provider',
        title: 'KYC Document Uploaded',
        message: 'Provider "Super Cleaners" uploaded Trade License for verification',
        severity: 'info',
      },
      {
        type: 'payment',
        title: 'Payout Requested',
        message: 'Provider Ramesh Kumar requested withdrawal of ₹2,450 to bank',
        severity: 'warning',
      },
      {
        type: 'review',
        title: '5 Star Review Submitted',
        message: 'Customer Rohan gave 5 stars for AC Service: "Great work!"',
        severity: 'success',
      },
      {
        type: 'support',
        title: 'New Ticket Raised',
        message: 'Customer Priya Roy raised ticket: "Cannot reschedule booking"',
        severity: 'info',
      },
      {
        type: 'booking',
        title: 'Booking Cancelled',
        message: 'Booking #JT-77192 cancelled by provider: "Vehicle breakdown"',
        severity: 'error',
      }
    ];

    const interval = setInterval(() => {
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
      const newEvent: ActivityEvent = {
        ...randomTemplate,
        id: `sim-${Date.now()}`,
        timestamp: 'Just now'
      };

      setEvents(prev => [newEvent, ...prev.slice(0, 19)]);
    }, 25000); // Drop a new event every 25 seconds

    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking': return <BookOpen className="w-4 h-4 text-indigo-400" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'user': return <UserPlus className="w-4 h-4 text-sky-400" />;
      case 'provider': return <UserCheck className="w-4 h-4 text-purple-400" />;
      case 'review': return <Star className="w-4 h-4 text-amber-400" />;
      case 'support': return <HelpCircle className="w-4 h-4 text-pink-400" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const getBorderColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'border-l-emerald-500 bg-emerald-500/5';
      case 'warning': return 'border-l-amber-500 bg-amber-500/5';
      case 'error': return 'border-l-destructive bg-destructive/5';
      default: return 'border-l-primary bg-primary/5';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <div 
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs transition-opacity"
          />

          {/* Activity Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm glassmorphism border-l border-border flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg font-heading">Live activity</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Circle className={`w-2.5 h-2.5 fill-current ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
                  <span>{isConnected ? 'Connected' : 'Offline'}</span>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Event Feeds */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence initial={false}>
                {events.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-3 rounded-lg border-l-4 border border-border/40 flex gap-3 transition-all ${getBorderColor(event.severity)}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center shrink-0 border border-border/55 shadow-xs">
                      {getIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold truncate text-foreground/90">{event.title}</h4>
                        <span className="text-[10px] text-muted-foreground shrink-0">{event.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed break-words">
                        {event.message}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
