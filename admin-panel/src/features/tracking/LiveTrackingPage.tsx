import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useGetBookingsListQuery } from '../../redux/slices/adminApi';
import { 
  MapPin, Navigation, Compass, Gauge, 
  Map as MapIcon, RefreshCw, Radio, ShieldCheck, Clock
} from 'lucide-react';

declare const L: any; // Allow Leaflet global usage

export default function LiveTrackingPage() {
  const { data: bookingsResponse } = useGetBookingsListQuery({ page: 1, limit: 10 });
  const bookings = bookingsResponse?.bookings || [];

  const [activeBookingId, setActiveBookingId] = useState<string>('');
  
  useEffect(() => {
    if (bookings.length > 0 && !activeBookingId) {
      setActiveBookingId(bookings[0]._id);
    }
  }, [bookings, activeBookingId]);

  const activeBooking = bookings.find((b: any) => b._id === activeBookingId);
  const customerName = activeBooking?.customerName || activeBooking?.customerAddressSnapshot?.name || 'Customer';
  const providerName = activeBooking?.provider?.businessName || activeBooking?.providerName || 'Provider';

  const customerCoords: [number, number] = activeBooking?.customerAddressSnapshot?.location?.coordinates
    ? [activeBooking.customerAddressSnapshot.location.coordinates[1], activeBooking.customerAddressSnapshot.location.coordinates[0]]
    : [19.0760, 72.8777]; // Fallback to Mumbai Center

  const providerStartCoords: [number, number] = [customerCoords[0] - 0.016, customerCoords[1] - 0.017];

  const [telemetry, setTelemetry] = useState<any>({
    speed: 0,
    eta: 12,
    distance: 4.8,
    accuracy: 8,
    timestamp: new Date().toLocaleTimeString()
  });

  const { socket, isConnected, emit, on } = useSocket('/tracking');
  
  const mapRef = useRef<any>(null);
  const providerMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);

  // Load Leaflet CDN script and stylesheet dynamically
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        initLeafletMap();
      };
      document.body.appendChild(script);
    } else {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      initLeafletMap();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [activeBookingId, bookingsResponse]);

  const initLeafletMap = () => {
    if (mapRef.current || typeof L === 'undefined') return;

    // Create Leaflet map object
    const map = L.map('live-leaflet-map').setView(customerCoords, 13);
    mapRef.current = map;

    // Load standard OpenStreetMap map tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Set custom icon definitions
    const customIcon = (color: string) => L.divIcon({
      html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
      className: 'custom-leaflet-icon',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    // Plot customer static marker
    customerMarkerRef.current = L.marker(customerCoords, { icon: customIcon('#6366f1') })
      .addTo(map)
      .bindPopup(`Customer Location: ${customerName}`)
      .openPopup();

    // Plot provider dynamic starting marker
    providerMarkerRef.current = L.marker(providerStartCoords, { icon: customIcon('#10b981') })
      .addTo(map)
      .bindPopup(`Provider Location: ${providerName}`);

    // Draw route vector line
    routeLineRef.current = L.polyline([providerStartCoords, customerCoords], { color: '#6366f1', weight: 4, opacity: 0.7 })
      .addTo(map);

    // Zoom map bounding box to cover both markers
    const group = new L.featureGroup([customerMarkerRef.current, providerMarkerRef.current]);
    map.fitBounds(group.getBounds().pad(0.1));
  };

  // Join selected booking socket room tracking updates
  useEffect(() => {
    if (!isConnected || !activeBookingId) return;

    // Emit event requesting room subscription
    emit('tracking:join', { bookingId: activeBookingId });

    // Handle coordinate packet streams
    const cleanupTelemetry = on('telemetry:stream', (data: any) => {
      const { latitude, longitude, speed, eta, distance } = data;
      
      setTelemetry({
        speed: speed || 0,
        eta: eta || 10,
        distance: distance || 3.2,
        timestamp: new Date().toLocaleTimeString()
      });

      // Update provider marker coordinate position dynamically
      if (providerMarkerRef.current && latitude && longitude) {
        const newLatLng = new L.LatLng(latitude, longitude);
        providerMarkerRef.current.setLatLng(newLatLng);
        
        // Recalculate route line
        if (routeLineRef.current && customerMarkerRef.current) {
          routeLineRef.current.setLatLngs([newLatLng, customerMarkerRef.current.getLatLng()]);
        }
      }
    });

    return () => {
      cleanupTelemetry();
    };
  }, [activeBookingId, isConnected]);

  // Simulated provider driving test route logic to showcase functionality in dev environment
  const handleStartSimulation = () => {
    let stepCount = 0;
    const totalSteps = 20;

    const simInterval = setInterval(() => {
      if (stepCount >= totalSteps) {
        clearInterval(simInterval);
        alert('Simulation finished: Provider has arrived at customer geofence boundary.');
        return;
      }

      stepCount++;
      const ratio = stepCount / totalSteps;

      // Linearly interpolate coordinate steps
      const currentLat = providerStartCoords[0] + (customerCoords[0] - providerStartCoords[0]) * ratio;
      const currentLng = providerStartCoords[1] + (customerCoords[1] - providerStartCoords[1]) * ratio;

      const randomSpeed = Math.floor(Math.random() * 15) + 30; // 30-45 km/h
      const remainingDistance = (4.8 * (1 - ratio)).toFixed(1);
      const remainingEta = Math.max(1, Math.round(12 * (1 - ratio)));

      setTelemetry({
        speed: randomSpeed,
        eta: remainingEta,
        distance: parseFloat(remainingDistance),
        timestamp: new Date().toLocaleTimeString()
      });

      // Move marker on map
      if (providerMarkerRef.current && typeof L !== 'undefined') {
        const nextLatLng = new L.LatLng(currentLat, currentLng);
        providerMarkerRef.current.setLatLng(nextLatLng);
        
        if (routeLineRef.current && customerMarkerRef.current) {
          routeLineRef.current.setLatLngs([nextLatLng, customerMarkerRef.current.getLatLng()]);
        }
        
        // Center view on provider as they move
        if (mapRef.current) {
          mapRef.current.panTo(nextLatLng);
        }
      }
    }, 2000); // Shift position every 2 seconds
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      {/* Title block */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-foreground">Real-time Telemetry map</h1>
          <p className="text-sm text-muted-foreground">Monitor ongoing bookings, geofenced routes, and speed trajectories on interactive map overlays.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartSimulation}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-indigo-500/20 transition-all cursor-pointer"
          >
            Start drive simulation
          </button>
          
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border px-3 py-2 rounded-lg">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
            <span>{isConnected ? 'Socket connected' : 'Local Sandbox'}</span>
          </div>
        </div>
      </div>

      {/* Map Layout Area */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left pane: Active bookings */}
        <div className="lg:col-span-1 flex flex-col gap-3 overflow-y-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Tracking Rooms</span>
          
          {bookings.length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground text-center bg-secondary/20 rounded-xl border border-border">
              No active tracking rooms found in database
            </div>
          ) : (
            bookings.map((b: any) => {
              const bCustomerName = b.customerName || b.customerAddressSnapshot?.name || 'Customer';
              const bCategoryName = b.serviceName || b.serviceCategoryName || 'Service Job';
              const isSelected = activeBookingId === b._id;
              return (
                <button
                  key={b._id}
                  onClick={() => setActiveBookingId(b._id)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary/5 border-primary shadow-sm'
                      : 'bg-card border-border hover:bg-secondary/40'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-muted-foreground uppercase font-mono">Booking: #{b.bookingNumber || b._id.substring(18)}</span>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded">{b.bookingStatus}</span>
                  </div>
                  <h4 className="font-bold font-heading mt-2">{bCategoryName}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Customer: {bCustomerName}</p>
                </button>
              );
            })
          )}
        </div>

        {/* Center/Right pane: Map & Telemetry Indicators */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-[350px]">
          
          {/* Telemetry panel */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 glassmorphism border border-border/40 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Current Speed</span>
                <p className="font-bold font-heading text-sm text-foreground">{telemetry.speed} km/h</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">ETA to Customer</span>
                <p className="font-bold font-heading text-sm text-foreground">{telemetry.eta} mins</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Remaining Distance</span>
                <p className="font-bold font-heading text-sm text-foreground">{telemetry.distance} km</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Last Sync</span>
                <p className="font-mono text-sm text-foreground font-bold">{telemetry.timestamp}</p>
              </div>
            </div>
          </div>

          {/* Leaflet Map box */}
          <div className="flex-1 relative rounded-xl overflow-hidden border border-border bg-card shadow-2xl">
            <div id="live-leaflet-map" className="absolute inset-0 z-10 w-full h-full" />
            
            {/* Overlay indicators */}
            <div className="absolute bottom-4 left-4 z-20 bg-black/75 backdrop-blur-sm border border-white/10 px-3 py-2 rounded-lg text-[10px] flex items-center gap-2 select-none">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-white shrink-0" />
                <span className="text-white font-semibold">Customer</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white shrink-0" />
                <span className="text-white font-semibold">Provider</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
