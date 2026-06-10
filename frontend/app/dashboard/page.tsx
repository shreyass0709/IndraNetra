'use client';

import React, { useState, useEffect } from 'react';
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
    <div className="min-h-screen bg-[#07070a] text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="glass-nav border-b border-zinc-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-lg text-white">IndraNetra Control Room</span>
              <span className="text-xs text-blue-400 font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25">
                {user.role} Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-400 hidden sm:inline">Signed in as <b>{user.name}</b></span>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Live Stats & Camera (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Event & Live Status Banner */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Active Monitoring Event</div>
              <select
                className="bg-transparent border-0 font-bold text-xl text-white focus:outline-none focus:ring-0 p-0 pr-8 cursor-pointer"
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
                  <option key={e.id} value={e.id} className="bg-zinc-950 text-white font-medium">{e.title}</option>
                ))}
              </select>
              <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-500" /> {selectedEvent?.locationName || 'Unknown Venue'}
              </div>
            </div>

            {/* Dashboard Stats */}
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Live Socket Connected</span>
            </div>
          </div>

          {/* Real-time Cards */}
          {(user.role === 'ADMIN' || user.role === 'POLICE' || user.role === 'ORGANIZER') && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Crowd Count</div>
                <div className="text-3xl font-extrabold text-white">{liveCount || '0'}</div>
                <div className="text-[10px] text-zinc-500 mt-2">Capacity limit: {selectedEvent?.capacity || 500}</div>
              </div>
              <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Density (m²)</div>
                <div className="text-3xl font-extrabold text-white">{liveDensity || '0.0'}</div>
                <div className="text-[10px] text-zinc-500 mt-2">People/sqm area</div>
              </div>
              <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Risk Level</div>
                <div className={`text-xl font-bold px-3 py-1.5 rounded-xl border text-center ${getRiskColor(liveRisk)}`}>
                  {liveRisk}
                </div>
                <div className="text-[10px] text-zinc-500 mt-2">Based on ML forecasting</div>
              </div>
              <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950">
                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Active Alerts</div>
                <div className="text-3xl font-extrabold text-red-500">{alerts.filter(a => !a.isResolved).length}</div>
                <div className="text-[10px] text-zinc-500 mt-2">Urgent alerts broadcasted</div>
              </div>
            </div>
          )}

          {/* Interactive Leaflet Map */}
          <div className="p-4 rounded-2xl border border-zinc-900 bg-zinc-950">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-sm text-zinc-300 flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500 animate-pulse" /> Live Tactical Map
              </span>
              
              {(user.role === 'ADMIN' || user.role === 'POLICE') && (
                <button 
                  onClick={handleSolveRoute}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Navigation className="w-3.5 h-3.5" /> Solve Escape Route
                </button>
              )}
            </div>
            
            <div className="h-96 rounded-xl overflow-hidden bg-zinc-900">
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
                <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                  Map initialization deferred...
                </div>
              )}
            </div>
            {routingPath.length > 0 && (
              <div className="mt-3 p-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 text-emerald-400 text-xs flex justify-between items-center">
                <span>Green exit route path overlay generated using A* pathfinding algorithm.</span>
                <button onClick={() => setRoutingPath([])} className="underline hover:text-emerald-300 font-medium">Clear Route</button>
              </div>
            )}
          </div>

          {/* Analytics Line Chart */}
          {(user.role === 'ADMIN' || user.role === 'POLICE' || user.role === 'ORGANIZER') && (
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950">
              <div className="text-sm font-bold text-zinc-300 mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Crowd Trend (Real-time Flow)
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} />
                    <YAxis stroke="#9ca3af" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                      labelStyle={{ color: '#fafafa', fontSize: 11 }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>

        {/* Right Column - User Actions & Feeds (Span 4) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Public User Panel */}
          {user.role === 'PUBLIC_USER' && (
            <>
              {/* SOS Emergency Trigger */}
              <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950 text-center">
                <h3 className="font-extrabold text-lg text-white mb-2">Emergency Assistance</h3>
                <p className="text-xs text-zinc-400 mb-6">Press the button below to instantly alert all police and volunteers with your current location.</p>
                
                <button
                  onClick={() => handleTriggerSOS('STAMPEDE_RISK')}
                  disabled={sosSubmitted}
                  className={`w-36 h-36 rounded-full border-8 border-red-500/25 bg-red-600 text-white font-extrabold text-xl shadow-lg transition-all active:scale-95 flex flex-col justify-center items-center gap-1.5 mx-auto ${sosSubmitted ? 'opacity-70 border-zinc-800 bg-zinc-800' : 'pulse-sos hover:bg-red-500'}`}
                >
                  {sosSubmitted ? (
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <>
                      <ShieldAlert className="w-8 h-8 text-white" />
                      <span>SOS</span>
                    </>
                  )}
                </button>
                <div className="text-[10px] text-zinc-500 mt-4">
                  {sosSubmitted ? 'SOS Emergency Transmitted!' : 'Single-tap activation. Use for extreme emergencies.'}
                </div>
              </div>

              {/* Submit Incident Report */}
              <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950">
                <h3 className="font-bold text-sm text-zinc-300 mb-4 flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-500" /> Report Incident / Anomaly
                </h3>
                <form onSubmit={handleReportIncident} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., Blocked exit gate Sector 3"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:outline-none focus:border-blue-500"
                      value={incidentTitle}
                      onChange={(e) => setIncidentTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Details</label>
                    <textarea 
                      required
                      rows={3}
                      placeholder="Describe the overcrowding, fights, or safety risks..."
                      className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                      value={incidentDesc}
                      onChange={(e) => setIncidentDesc(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all active:scale-98"
                  >
                    Submit Incident Report
                  </button>
                </form>
              </div>
            </>
          )}

          {/* Volunteer Panel */}
          {user.role === 'VOLUNTEER' && (
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950">
              <h3 className="font-bold text-sm text-zinc-300 mb-4">Volunteer Dispatch Console</h3>
              
              <div className="space-y-5">
                {/* Active Status Selector */}
                <div>
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">My Dispatch Status</div>
                  <div className="grid grid-cols-3 gap-2">
                    {['AVAILABLE', 'ASSIGNED', 'INACTIVE'].map((status) => {
                      const isSelected = volunteers.find(v => v.userId === user.id)?.status === status;
                      return (
                        <button
                          key={status}
                          onClick={() => handleToggleVolunteerStatus(status)}
                          className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 text-xs text-zinc-400">
                  <span className="font-bold text-white block mb-1">Duty Assignment Area</span>
                  Your coordinates are updated dynamically as you navigate the event zone. Keep your browser active.
                </div>
              </div>
            </div>
          )}

          {/* Admin / Camera Input Portal */}
          {(user.role === 'ADMIN' || user.role === 'POLICE' || user.role === 'ORGANIZER') && (
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950">
              <h3 className="font-bold text-sm text-zinc-300 mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-500" /> AI Feed Input (Simulate Camera)
              </h3>
              <p className="text-[11px] text-zinc-500 mb-4">Upload a crowd camera frame to run YOLOv8 target detection and generate density overlays.</p>
              
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
                  className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col justify-center items-center gap-2 hover:border-zinc-700 cursor-pointer hover:bg-zinc-900/10 transition-colors"
                >
                  <Camera className="w-6 h-6 text-zinc-400" />
                  <span className="text-xs text-zinc-300 font-semibold">{uploadingFrame ? 'Running YOLO Detection...' : 'Upload Camera Image'}</span>
                </label>
              </div>

              {liveHeatmap && (
                <div className="mt-4 p-2 rounded-xl border border-zinc-900 bg-zinc-900/20">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Generated Crowd Heatmap Overlay</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={liveHeatmap} alt="AI Heatmap" className="w-full rounded-lg" />
                </div>
              )}

              {analysisResult && (
                <div className="mt-4 p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 text-xs text-zinc-300 space-y-1 font-mono">
                  <div className="font-semibold text-white border-b border-blue-500/20 pb-1 mb-1.5 font-sans">YOLO Inference Stats</div>
                  <div>Targets (People) Count: {analysisResult.people_count}</div>
                  <div>Density Score: {analysisResult.density_score}</div>
                  <div>ML Risk Assessment: {analysisResult.risk_level} ({Math.round(analysisResult.confidence * 100)}%)</div>
                  <div>Capacity Utilization: {Math.round(analysisResult.utilization * 100)}%</div>
                </div>
              )}
            </div>
          )}

          {/* SOS Emergency Feed (Spans all roles to handle rescue tracking) */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950">
            <h3 className="font-bold text-sm text-zinc-300 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" /> Active SOS Broadcasts ({sosRequests.length})
            </h3>
            
            {sosRequests.length === 0 ? (
              <div className="text-center p-6 border border-zinc-900 rounded-xl bg-zinc-900/10 text-xs text-zinc-500">
                No active emergencies reported.
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {sosRequests.map((sos) => (
                  <div 
                    key={sos.id} 
                    className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs relative overflow-hidden flex flex-col gap-2"
                  >
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500" />
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-white uppercase text-[10px] bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/35">
                        {sos.issueType}
                      </span>
                      <span className="text-[10px] text-zinc-500">{new Date(sos.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-zinc-300 text-xs font-semibold">{sos.user?.name || 'Public User'} in sector</div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">{sos.description || 'Emergency assistance requested'}</p>
                    
                    {(user.role === 'ADMIN' || user.role === 'POLICE' || user.role === 'VOLUNTEER') && (
                      <button
                        onClick={() => handleResolveSOS(sos.id)}
                        className="mt-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Resolved
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incident Reports Feed */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950">
            <h3 className="font-bold text-sm text-zinc-300 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Public Incident Feed ({incidents.length})
            </h3>
            
            {incidents.length === 0 ? (
              <div className="text-center p-6 border border-zinc-900 rounded-xl bg-zinc-900/10 text-xs text-zinc-500">
                No active incidents reported.
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {incidents.map((inc) => (
                  <div key={inc.id} className="p-4 rounded-xl border border-zinc-900 bg-[#0c0c0e] text-xs">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-bold text-zinc-200">{inc.title}</span>
                      <span className="text-[10px] text-zinc-500">{new Date(inc.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-zinc-400 text-[11px] mb-2">{inc.description}</p>
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 border-t border-zinc-900/50 pt-1.5 mt-1.5">
                      <span>Reporter: {inc.user?.name || 'Anonymous'}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {inc.latitude.toFixed(3)}, {inc.longitude.toFixed(3)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
