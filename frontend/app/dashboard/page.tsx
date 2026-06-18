'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { 
  LogOut, 
  Users, 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  Send, 
  MapPin, 
  CheckCircle, 
  Camera, 
  Settings, 
  TrendingUp, 
  Radio, 
  Navigation,
  Check,
  Eye
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Dynamically import MapComponent to avoid SSR window is not defined errors
const MapComponent = dynamic(() => import('../../components/MapComponent'), { ssr: false });

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [sosRequests, setSosRequests] = useState<any[]>([]);
  
  // Real-time states
  const [liveCount, setLiveCount] = useState<number>(0);
  const [liveDensity, setLiveDensity] = useState<number>(0);
  const [liveRisk, setLiveRisk] = useState<string>('LOW');
  const [liveHeatmap, setLiveHeatmap] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  
  // Interactive / Form states
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentLat, setIncidentLat] = useState('13.0827');
  const [incidentLng, setIncidentLng] = useState('80.2707');
  const [sosSubmitted, setSosSubmitted] = useState(false);
  const [uploadingFrame, setUploadingFrame] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [routingPath, setRoutingPath] = useState<[number, number][]>([]);

  // Chart state
  const [chartData, setChartData] = useState<any[]>([
    { time: '19:00', count: 120 },
    { time: '19:05', count: 180 },
    { time: '19:10', count: 240 },
    { time: '19:15', count: 310 },
    { time: '19:20', count: 290 },
  ]);

  // Socket
  const socket = useSocket(selectedEvent?.id);

  // Authenticate user & load baseline data
  useEffect(() => {
    const token = localStorage.getItem('indranetra_token');
    const storedUser = localStorage.getItem('indranetra_user');
    
    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(storedUser));
    fetchBaselineData();
  }, [router]);

  // Fetch baseline data from API
  const fetchBaselineData = async () => {
    try {
      setLoading(true);
      const eventsList = await api.getEvents();
      setEvents(eventsList);
      
      // Default to first active or upcoming event
      if (eventsList.length > 0) {
        setSelectedEvent(eventsList[0]);
        // Set event coordinates
        setIncidentLat(eventsList[0].latitude.toString());
        setIncidentLng(eventsList[0].longitude.toString());
      } else {
        // Create a default event if database is empty so the platform works instantly!
        const defaultEv = await api.createEvent({
          title: "Indra Stadium Mega Concert",
          description: "Annual cultural festival gathering over 2,000 attendees.",
          locationName: "Indra National Stadium",
          latitude: 13.0827,
          longitude: 80.2707,
          capacity: 500,
          thresholdLimit: 400,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString()
        });
        setEvents([defaultEv]);
        setSelectedEvent(defaultEv);
      }

      const volunteersList = await api.getVolunteers();
      setVolunteers(volunteersList);

      const incidentsList = await api.getReports();
      setIncidents(incidentsList);

      const sosList = await api.getSOSRequests();
      setSosRequests(sosList);

    } catch (err) {
      console.error('Error fetching baseline data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Listen to Socket.IO real-time streams
  useEffect(() => {
    if (socket.crowdUpdate) {
      const { report, activeAlert } = socket.crowdUpdate;
      if (report) {
        setLiveCount(report.peopleCount);
        setLiveDensity(report.densityLevel);
        setLiveRisk(report.riskLevel);
        if (report.heatmapUrl) {
          setLiveHeatmap(report.heatmapUrl);
        }
        
        // Update Recharts trend line
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        setChartData(prev => [...prev.slice(-9), { time: timeStr, count: report.peopleCount }]);
      }
      
      if (activeAlert) {
        setAlerts(prev => [activeAlert, ...prev.filter(a => a.id !== activeAlert.id)]);
      }
    }
  }, [socket.crowdUpdate]);

  useEffect(() => {
    if (socket.latestAlert) {
      setAlerts(prev => [socket.latestAlert, ...prev.filter(a => a.id !== socket.latestAlert.id)]);
    }
  }, [socket.latestAlert]);

  useEffect(() => {
    if (socket.sosEvent) {
      const sos = socket.sosEvent;
      if (sos.status === 'RESOLVED') {
        setSosRequests(prev => prev.filter(r => r.id !== sos.id));
      } else {
        setSosRequests(prev => [sos, ...prev.filter(r => r.id !== sos.id)]);
      }
    }
  }, [socket.sosEvent]);

  useEffect(() => {
    if (socket.volunteerUpdate) {
      const v = socket.volunteerUpdate;
      setVolunteers(prev => [v, ...prev.filter(vol => vol.id !== v.id)]);
    }
  }, [socket.volunteerUpdate]);

  // Log Out handler
  const handleLogout = () => {
    api.logout();
    router.push('/');
  };

  // Submit SOS request (Public User / Anyone in distress)
  const handleTriggerSOS = async (type: string) => {
    if (!user) return;
    try {
      setSosSubmitted(true);
      // Simulate geolocation fetching
      const lat = selectedEvent ? selectedEvent.latitude + (Math.random() - 0.5) * 0.005 : 13.0827;
      const lng = selectedEvent ? selectedEvent.longitude + (Math.random() - 0.5) * 0.005 : 80.2707;
      
      await api.createSOS(lat, lng, type, `Emergency assistance requested: ${type}`);
      setTimeout(() => setSosSubmitted(false), 3000);
    } catch (err) {
      console.error(err);
      setSosSubmitted(false);
    }
  };

  // Submit Public Incident Report
  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentTitle || !incidentDesc) return;
    try {
      const rep = await api.createReport({
        title: incidentTitle,
        description: incidentDesc,
        latitude: parseFloat(incidentLat),
        longitude: parseFloat(incidentLng),
      });
      setIncidents(prev => [rep, ...prev]);
      setIncidentTitle('');
      setIncidentDesc('');
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve SOS Alert
  const handleResolveSOS = async (sosId: string) => {
    try {
      await api.resolveSOS(sosId);
      setSosRequests(prev => prev.filter(r => r.id !== sosId));
    } catch (err) {
      console.error(err);
    }
  };

  // Update Volunteer Status
  const handleToggleVolunteerStatus = async (status: string) => {
    try {
      const updated = await api.updateVolunteerStatus(status);
      // Update local state
      setVolunteers(prev => prev.map(v => v.userId === user.id ? { ...v, status } : v));
      // Try sending a mockup location update to register coordinate marker
      if (status === 'AVAILABLE' && selectedEvent) {
        const vLat = selectedEvent.latitude + (Math.random() - 0.5) * 0.003;
        const vLng = selectedEvent.longitude + (Math.random() - 0.5) * 0.003;
        await api.updateVolunteerLocation(vLat, vLng);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mock Frame Upload (Simulates camera input for analysis)
  const handleCameraFrameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEvent) return;

    try {
      setUploadingFrame(true);
      const res = await api.uploadFrame(selectedEvent.id, file);
      setAnalysisResult(res.analysis);
      
      if (res.report) {
        setLiveCount(res.report.peopleCount);
        setLiveDensity(res.report.densityLevel);
        setLiveRisk(res.report.riskLevel);
        if (res.report.heatmapUrl) {
          setLiveHeatmap(res.report.heatmapUrl);
        }
      }
    } catch (err) {
      console.error('Frame upload failed:', err);
    } finally {
      setUploadingFrame(false);
    }
  };

  // Solve Emergency Route (Triggers A* Pathfinding visualization)
  const handleSolveRoute = async () => {
    if (!selectedEvent) return;
    
    // Simulate a grid of costs (20x20) where coordinates around center have high cost (congestion)
    // and solve route from center to bottom-right exit gate
    const grid: number[][] = Array(20).fill(null).map(() => Array(20).fill(1.0));
    
    // Inject obstacle wall in grid
    for (let i = 5; i < 15; i++) {
      grid[i][10] = Infinity;
    }
    
    // Inject crowd congestion in grid (high cost)
    for (let i = 8; i < 12; i++) {
      for (let j = 5; j < 9; j++) {
        grid[i][j] = 15.0; // High congestion cost
      }
    }

    try {
      // Connect to python pathfinder API or use a mock solver local fallback
      const start: [number, number] = [2, 2];
      const end: [number, number] = [18, 18];
      
      let path: [number, number][] = [];
      try {
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        const res = await fetch(`${aiServiceUrl}/route`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grid, start, end }),
        });
        if (res.ok) {
          const data = await res.json();
          path = data.path;
        }
      } catch (e) {
        console.warn('AI pathfinder unavailable. Using mock A* routing path.');
      }

      if (path.length === 0) {
        // Mock fallback route coordinates mapped to the event latitude/longitude coordinates
        // Center: selectedEvent.latitude, selectedEvent.longitude
        const baseLat = selectedEvent.latitude;
        const baseLng = selectedEvent.longitude;
        
        // Generates path points winding around obstacles
        path = [
          [2, 2], [3, 3], [4, 4], [4, 5], [4, 6], [3, 7], [3, 8], [4, 9], 
          [4, 11], [5, 12], [8, 13], [12, 14], [15, 15], [18, 18]
        ];
      }

      // Convert grid coordinates to lat/lng offsets around event center
      const mappedPath: [number, number][] = path.map(([gy, gx]) => {
        const latOffset = (gy - 10) * 0.0003;
        const lngOffset = (gx - 10) * 0.0003;
        return [selectedEvent.latitude + latOffset, selectedEvent.longitude + lngOffset];
      });

      setRoutingPath(mappedPath);
    } catch (err) {
      console.error('Routing failed:', err);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#07070a] text-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-sm text-zinc-400">Loading IndraNetra Control Room...</span>
        </div>
      </div>
    );
  }

  // Get status color helper
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#050508] text-zinc-100 flex flex-col relative"
    >
      {/* Scanline overlay */}
      <div className="cyber-scanline" />

      {/* Header */}
      <header className="glass-nav sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
            >
              <Eye className="w-5 h-5 text-white" />
            </motion.div>
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight">INDRA<span className="text-blue-500">NETRA</span></span>
              <span className="text-[10px] text-blue-400 font-bold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 uppercase tracking-wider">
                {user.role} HUD
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-400 hidden sm:inline font-mono">
              [OFFICER: <b className="text-zinc-200">{user.name}</b>]
            </span>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-lg bg-zinc-950 border border-zinc-900 hover:border-blue-500/30 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all active:scale-95 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column - Live Stats & Camera (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Event & Live Status Banner */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-6 rounded-2xl border border-blue-500/15 bg-zinc-955/80 shadow-glow-blue flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          >
            <div>
              <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">// Active Monitoring Sector</div>
              <select
                className="bg-transparent border-0 font-extrabold text-2xl text-white focus:outline-none focus:ring-0 p-0 pr-8 cursor-pointer hover:text-blue-400 transition-colors"
                value={selectedEvent?.id || ''}
                onChange={(e) => {
                  const ev = events.find(event => event.id === e.target.value);
                  setSelectedEvent(ev);
                  if (ev) {
                    setIncidentLat(ev.latitude.toString());
                    setIncidentLng(ev.longitude.toString());
                    setRoutingPath([]);
                  }
                }}
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id} className="bg-zinc-950 text-white font-semibold">{e.title}</option>
                ))}
              </select>
              <div className="text-xs text-zinc-400 mt-2 flex items-center gap-2 font-mono">
                <MapPin className="w-4 h-4 text-blue-500 animate-bounce" /> {selectedEvent?.locationName || 'Unknown Venue'}
              </div>
            </div>

            {/* Dashboard Status */}
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl relative overflow-hidden">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative flex items-center justify-center">
                <span className="radar-ping bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-mono">LIVE FEED SYNCED</span>
            </div>
          </motion.div>

          {/* Real-time Cards */}
          {(user.role === 'ADMIN' || user.role === 'POLICE' || user.role === 'ORGANIZER') && (
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.1 } }
              }}
              className="grid grid-cols-1 sm:grid-cols-4 gap-4"
            >
              {/* Card 1: Count */}
              <motion.div 
                variants={{ hidden: { scale: 0.9, opacity: 0 }, visible: { scale: 1, opacity: 1 } }}
                whileHover={{ y: -4, borderColor: 'rgba(59, 130, 246, 0.3)' }}
                className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/70 hover:shadow-glow-blue transition-all"
              >
                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Crowd Count</div>
                <div className="text-4xl font-black text-white text-glow-blue">{liveCount || '0'}</div>
                <div className="text-[10px] text-zinc-500 mt-3 font-mono">CAPACITY: {selectedEvent?.capacity || 500}</div>
              </motion.div>

              {/* Card 2: Density */}
              <motion.div 
                variants={{ hidden: { scale: 0.9, opacity: 0 }, visible: { scale: 1, opacity: 1 } }}
                whileHover={{ y: -4, borderColor: 'rgba(99, 102, 241, 0.3)' }}
                className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/70 hover:shadow-glow-blue transition-all"
              >
                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Density Index</div>
                <div className="text-4xl font-black text-white text-glow-blue">{liveDensity ? liveDensity.toFixed(2) : '0.00'} <span className="text-xs text-zinc-500 font-medium">/m²</span></div>
                <div className="text-[10px] text-zinc-500 mt-3 font-mono">CRITICAL THRESHOLD: 3.5</div>
              </motion.div>

              {/* Card 3: Risk Level */}
              <motion.div 
                variants={{ hidden: { scale: 0.9, opacity: 0 }, visible: { scale: 1, opacity: 1 } }}
                whileHover={{ y: -4, borderColor: 'rgba(239, 68, 68, 0.3)' }}
                className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/70 hover:shadow-glow-blue transition-all"
              >
                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Risk Assessment</div>
                <div className={`text-lg font-black px-3 py-1.5 rounded-xl border text-center ${getRiskColor(liveRisk)}`}>
                  {liveRisk}
                </div>
                <div className="text-[10px] text-zinc-500 mt-3 font-mono">FORECAST: RANDOM FOREST</div>
              </motion.div>

              {/* Card 4: Active Alerts */}
              <motion.div 
                variants={{ hidden: { scale: 0.9, opacity: 0 }, visible: { scale: 1, opacity: 1 } }}
                whileHover={{ y: -4, borderColor: 'rgba(249, 115, 22, 0.3)' }}
                className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/70 hover:shadow-glow-blue transition-all"
              >
                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Active Alerts</div>
                <div className="text-4xl font-black text-red-500 text-glow-red">{alerts.filter(a => !a.isResolved).length}</div>
                <div className="text-[10px] text-zinc-500 mt-3 font-mono">BROADCASTED LOGS: {alerts.length}</div>
              </motion.div>
            </motion.div>
          )}

          {/* Interactive Leaflet Map */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-4 rounded-2xl border border-zinc-900 bg-zinc-950/80 relative overflow-hidden"
          >
            <div className="scan-line" />
            <div className="flex justify-between items-center mb-4 relative z-10">
              <span className="font-bold text-sm text-zinc-300 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Radio className="w-4 h-4 text-red-500 animate-pulse" /> Live Tactical Map HUD
              </span>
              
              {(user.role === 'ADMIN' || user.role === 'POLICE') && (
                <button 
                  onClick={handleSolveRoute}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 hover:shadow-glow-emerald text-white text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer border border-emerald-500/20"
                >
                  <Navigation className="w-4 h-4 animate-pulse" /> Solve Escape Route
                </button>
              )}
            </div>
            
            <div className="h-96 rounded-xl overflow-hidden bg-[#050508] border border-zinc-900 relative">
              {selectedEvent ? (
                <MapComponent
                  latitude={selectedEvent.latitude}
                  longitude={selectedEvent.longitude}
                  volunteers={volunteers}
                  incidents={incidents}
                  sosRequests={sosRequests}
                  routingPath={routingPath}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-mono">
                  Map initialization deferred...
                </div>
              )}
            </div>
            
            <AnimatePresence>
              {routingPath.length > 0 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 text-emerald-400 text-xs flex justify-between items-center font-mono relative overflow-hidden"
                >
                  <span>[PATH GENERATED]: A* escape route resolved successfully. Avoid congested vectors.</span>
                  <button onClick={() => setRoutingPath([])} className="underline hover:text-emerald-300 font-bold cursor-pointer ml-4 shrink-0">Clear Route</button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Analytics Line Chart */}
          {(user.role === 'ADMIN' || user.role === 'POLICE' || user.role === 'ORGANIZER') && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/80 hover:border-zinc-800 transition-colors"
            >
              <div className="text-sm font-bold text-zinc-300 mb-6 flex items-center gap-2 font-mono uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Crowd Trend (Real-time Flow)
              </div>
              <div className="h-48 font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#121217" />
                    <XAxis dataKey="time" stroke="#52525b" fontSize={10} />
                    <YAxis stroke="#52525b" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(10, 10, 14, 0.95)', borderColor: 'rgba(59, 130, 246, 0.2)', borderRadius: '12px' }}
                      labelStyle={{ color: '#fafafa', fontSize: 11, fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

        </div>

        {/* Right Column - User Actions & Feeds (Span 4) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Public User Panel */}
          {user.role === 'PUBLIC_USER' && (
            <>
              {/* SOS Emergency Trigger */}
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-6 rounded-2xl border border-red-500/15 bg-zinc-950/90 text-center relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl" />
                <h3 className="font-extrabold text-lg text-white mb-2 tracking-tight">Emergency Assistance</h3>
                <p className="text-xs text-zinc-400 mb-6 leading-relaxed">Alert all authorities and standing-by volunteers with your live location.</p>
                
                <button
                  onClick={() => handleTriggerSOS('STAMPEDE_RISK')}
                  disabled={sosSubmitted}
                  className={`w-36 h-36 rounded-full border-8 border-red-500/20 bg-red-600 text-white font-black text-2xl shadow-lg transition-all active:scale-90 flex flex-col justify-center items-center gap-2 mx-auto cursor-pointer relative ${sosSubmitted ? 'opacity-70 border-zinc-800 bg-zinc-800' : 'pulse-sos hover:bg-red-500'}`}
                >
                  {sosSubmitted ? (
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                  ) : (
                    <>
                      <ShieldAlert className="w-10 h-10 text-white animate-bounce" />
                      <span>SOS</span>
                    </>
                  )}
                </button>
                <div className="text-[10px] text-zinc-500 mt-6 font-mono">
                  {sosSubmitted ? '[TRANSMISSION SENT] Emergency Alert Live' : 'Use for extreme safety emergencies.'}
                </div>
              </motion.div>

              {/* Submit Incident Report */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/80"
              >
                <h3 className="font-bold text-sm text-zinc-300 mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Send className="w-4 h-4 text-blue-500" /> Report Anomaly
                </h3>
                <form onSubmit={handleReportIncident} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., Exit blocked at Sector 3"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-850 bg-zinc-900/40 text-xs text-white focus:outline-none focus:border-blue-500 focus:shadow-glow-blue transition-all"
                      value={incidentTitle}
                      onChange={(e) => setIncidentTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">Details</label>
                    <textarea 
                      required
                      rows={3}
                      placeholder="Describe overcrowding, path blockage, or safety risks..."
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-850 bg-zinc-900/40 text-xs text-white focus:outline-none focus:border-blue-500 focus:shadow-glow-blue transition-all resize-none"
                      value={incidentDesc}
                      onChange={(e) => setIncidentDesc(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all hover:shadow-glow-blue active:scale-98 cursor-pointer"
                  >
                    Submit Incident Report
                  </button>
                </form>
              </motion.div>
            </>
          )}

          {/* Volunteer Panel */}
          {user.role === 'VOLUNTEER' && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/85"
            >
              <h3 className="font-bold text-sm text-zinc-300 mb-4 font-mono uppercase tracking-wider">Volunteer Dispatch Console</h3>
              
              <div className="space-y-5">
                <div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 font-mono">Dispatch Status</div>
                  <div className="grid grid-cols-3 gap-2">
                    {['AVAILABLE', 'ASSIGNED', 'INACTIVE'].map((status) => {
                      const isSelected = volunteers.find(v => v.userId === user.id)?.status === status;
                      return (
                        <button
                          key={status}
                          onClick={() => handleToggleVolunteerStatus(status)}
                          className={`py-2 px-3 rounded-xl text-[10px] font-bold border text-center transition-all cursor-pointer ${isSelected ? 'bg-blue-600 border-blue-500 text-white shadow-glow-blue' : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white'}`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 text-xs text-zinc-400 leading-relaxed font-mono">
                  <span className="font-bold text-white block mb-1 uppercase tracking-wider">// GPS Broadcast Area</span>
                  Coordinates and dispatch flags sync automatically. Maintain window active status.
                </div>
              </div>
            </motion.div>
          )}

          {/* Admin / Camera Input Portal */}
          {(user.role === 'ADMIN' || user.role === 'POLICE' || user.role === 'ORGANIZER') && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/90 relative overflow-hidden"
            >
              <h3 className="font-bold text-sm text-zinc-300 mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Camera className="w-4 h-4 text-blue-500" /> AI Video Feed Input
              </h3>
              <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed font-mono">// Upload frame to trigger YOLOv8 object count and risk analysis overlays</p>
              
              <div className="relative">
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleCameraFrameUpload}
                  disabled={uploadingFrame}
                  className="hidden"
                  id="camera-upload-input"
                />
                <label 
                  htmlFor="camera-upload-input"
                  className="w-full py-6 border border-dashed border-zinc-800 hover:border-blue-500/50 rounded-xl flex flex-col justify-center items-center gap-2 hover:bg-zinc-900/20 transition-all cursor-pointer"
                >
                  <Camera className="w-6 h-6 text-zinc-400 animate-pulse" />
                  <span className="text-xs text-zinc-300 font-bold">{uploadingFrame ? 'Running AI Inference...' : 'Upload Feed Frame'}</span>
                </label>
              </div>

              {liveHeatmap && (
                <div className="mt-4 p-2 rounded-xl border border-zinc-900 bg-zinc-950/80 relative overflow-hidden group">
                  <div className="scan-line" />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 font-mono">// AI Crowd Heatmap</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={liveHeatmap} alt="AI Heatmap" className="w-full rounded-lg" />
                </div>
              )}

              {analysisResult && (
                <div className="mt-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-zinc-300 space-y-1.5 font-mono">
                  <div className="font-bold text-white border-b border-blue-500/20 pb-1 mb-2 font-sans tracking-wide uppercase">YOLO Inference Metrics</div>
                  <div>Detected Targets: <span className="text-white font-bold">{analysisResult.people_count}</span></div>
                  <div>Density Density: <span className="text-white font-bold">{analysisResult.density_score}</span></div>
                  <div>Safety Assessment: <span className="text-white font-bold text-glow-blue">{analysisResult.risk_level} ({Math.round(analysisResult.confidence * 100)}%)</span></div>
                  <div>Utilization Index: <span className="text-white font-bold">{Math.round(analysisResult.utilization * 100)}%</span></div>
                </div>
              )}
            </motion.div>
          )}

          {/* SOS Emergency Feed */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/80"
          >
            <h3 className="font-bold text-sm text-zinc-300 mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" /> Active SOS Signals ({sosRequests.length})
            </h3>
            
            {sosRequests.length === 0 ? (
              <div className="text-center p-6 border border-zinc-900/60 rounded-xl bg-zinc-950/20 text-xs text-zinc-500 font-mono">
                [NO EMERGENCIES REPORTED]
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {sosRequests.map((sos) => (
                    <motion.div 
                      key={sos.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs relative overflow-hidden flex flex-col gap-2 shadow-glow-red"
                    >
                      <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500" />
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-white uppercase text-[9px] bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/35 font-mono">
                          {sos.issueType}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">{new Date(sos.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-zinc-300 text-xs font-bold">{sos.user?.name || 'Public User'}</div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed font-mono">{sos.description || 'Emergency assistance requested'}</p>
                      
                      {(user.role === 'ADMIN' || user.role === 'POLICE' || user.role === 'VOLUNTEER') && (
                        <button
                          onClick={() => handleResolveSOS(sos.id)}
                          className="mt-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 hover:shadow-glow-emerald text-white font-extrabold text-[10px] flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Mark Resolved
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Incident Reports Feed */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/80"
          >
            <h3 className="font-bold text-sm text-zinc-300 mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Public Incident Feed ({incidents.length})
            </h3>
            
            {incidents.length === 0 ? (
              <div className="text-center p-6 border border-zinc-900/60 rounded-xl bg-zinc-950/20 text-xs text-zinc-500 font-mono">
                [NO ANOMALIES REPORTED]
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {incidents.map((inc) => (
                    <motion.div 
                      key={inc.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 hover:border-zinc-800 transition-colors text-xs"
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="font-bold text-zinc-200 tracking-tight">{inc.title}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{new Date(inc.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] mb-2 leading-relaxed font-mono">{inc.description}</p>
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 border-t border-zinc-900/50 pt-2 mt-2 font-mono">
                        <span>REPORTER: {inc.user?.name || 'Anonymous'}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-500" /> {inc.latitude.toFixed(3)}, {inc.longitude.toFixed(3)}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

        </div>

      </main>
    </motion.div>
  );
}
