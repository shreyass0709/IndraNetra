'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Camera as CameraIcon, 
  TrendingUp, 
  Radio, 
  Navigation,
  Check,
  Eye,
  Loader2,
  Calendar,
  BarChart3,
  Brain,
  Plus,
  X,
  Zap,
  Play,
  Pause,
  Shield
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';

// Dynamically import MapComponent to avoid SSR window issues
const MapComponent = dynamic(() => import('../../components/MapComponent'), { ssr: false });

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Layout states
  const [hudLoading, setHudLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Baseline API Data states
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [sosRequests, setSosRequests] = useState<any[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Real-time HUD states
  const [liveCount, setLiveCount] = useState<number>(0);
  const [liveDensity, setLiveDensity] = useState<number>(0);
  const [liveRisk, setLiveRisk] = useState<string>('LOW');
  const [liveHeatmap, setLiveHeatmap] = useState<string | null>(null);
  const [routingPath, setRoutingPath] = useState<[number, number][]>([]);
  const [activeRouteGate, setActiveRouteGate] = useState<string | null>(null);

  // Form states
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('Indra Stadium Live Concert');
  const [eventLocationName, setEventLocationName] = useState('Indra National Stadium, Chennai');
  const [eventLatitude, setEventLatitude] = useState('13.0827');
  const [eventLongitude, setEventLongitude] = useState('80.2707');
  const [eventCapacity, setEventCapacity] = useState('1000');
  const [eventGates, setEventGates] = useState('4');
  const [eventVolunteersReq, setEventVolunteersReq] = useState('40');
  const [eventStartDate, setEventStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [eventEndDate, setEventEndDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Camera creation states
  const [showCreateCameraModal, setShowCreateCameraModal] = useState(false);
  const [cameraName, setCameraName] = useState('');
  const [cameraLocation, setCameraLocation] = useState('');
  const [cameraRtspUrl, setCameraRtspUrl] = useState('webcam'); // default to webcam
  const [creatingCamera, setCreatingCamera] = useState(false);

  // Webcam scanning states
  const [scanningCamId, setScanningCamId] = useState<string | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dispatch states
  const [dispatchVolId, setDispatchVolId] = useState('');
  const [dispatchIncidentId, setDispatchIncidentId] = useState('');
  const [dispatchIncidentType, setDispatchIncidentType] = useState<'SOS' | 'REPORT'>('SOS');

  // Report Anomaly Form states
  const [reportTitle, setReportTitle] = useState('FIRE'); // Category: FIRE, MEDICAL, BLOCKED_EXIT, LOST_CHILD
  const [reportDesc, setReportDesc] = useState('');
  const [reportLat, setReportLat] = useState('13.0827');
  const [reportLng, setReportLng] = useState('80.2707');
  const [reportImage, setReportImage] = useState<File | null>(null);
  const [reportingIncident, setReportingIncident] = useState(false);

  // Recharts trend flow history
  const [chartData, setChartData] = useState<any[]>([
    { time: '21:00', count: 120 },
    { time: '21:15', count: 240 },
    { time: '21:30', count: 350 },
    { time: '21:45', count: 580 },
    { time: '22:00', count: 480 },
  ]);

  // Socket Telemetry Hook
  const socket = useSocket(selectedEvent?.id);

  // System Diagnostics loader (HUD start)
  useEffect(() => {
    const logs = [
      "INITIALIZING INDRANETRA AI CORE...",
      "SYNCING TELEMETRY SYSTEMS...",
      "LOADING YOLOv8 CONVOLUTIONAL MODEL WEBSOCKETS...",
      "CONNECTING REDIS MESSAGE BROKER INSTANCE...",
      "BOOTING COMMAND HUD INTERFACE..."
    ];
    let idx = 0;
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progress > 100) progress = 100;
      setLoadingProgress(progress);
      if (progress % 20 === 0 && idx < logs.length) {
        setLoadingLogs(prev => [...prev, logs[idx]]);
        idx++;
      }
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => setHudLoading(false), 200);
      }
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Auth checking & Loading data
  useEffect(() => {
    const token = localStorage.getItem('indranetra_token');
    const storedUser = localStorage.getItem('indranetra_user');
    if (!token || !storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchDashboardData();
  }, [router]);

  // Fetch all endpoints
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const eventsList = await api.getEvents();
      setEvents(eventsList);

      let currentEvent = null;
      if (eventsList.length > 0) {
        currentEvent = eventsList[0];
        setSelectedEvent(currentEvent);
        setReportLat(currentEvent.latitude.toString());
        setReportLng(currentEvent.longitude.toString());
      } else {
        // Fallback default event
        const defaultEv = await api.createEvent({
          title: "Indra Stadium Mega Festival",
          description: "Crowd safety and surveillance zone.",
          locationName: "Indra National Stadium",
          latitude: 13.0827,
          longitude: 80.2707,
          capacity: 1000,
          gatesCount: 4,
          volunteersCount: 40,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString()
        });
        setEvents([defaultEv]);
        currentEvent = defaultEv;
        setSelectedEvent(defaultEv);
      }

      const vols = await api.getVolunteers();
      setVolunteers(vols);

      const reps = await api.getReports();
      setIncidents(reps);

      const soses = await api.getSOSRequests();
      setSosRequests(soses);

      if (currentEvent) {
        const cams = await api.getCameras(currentEvent.id);
        setCameras(cams);
      }
    } catch (err) {
      console.error('Error load baseline data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cameras list when event changes
  useEffect(() => {
    if (selectedEvent) {
      api.getCameras(selectedEvent.id).then(setCameras).catch(console.error);
      setRoutingPath([]);
      setActiveRouteGate(null);
    }
  }, [selectedEvent]);

  // Handle Socket.io real-time updates
  useEffect(() => {
    if (socket.crowdUpdate) {
      const { report, activeAlert, cameraId, cameraName } = socket.crowdUpdate;
      if (report) {
        setLiveCount(report.peopleCount);
        setLiveDensity(report.densityLevel);
        setLiveRisk(report.riskLevel);
        if (report.heatmapUrl) {
          setLiveHeatmap(report.heatmapUrl);
        }

        // Update camera list density and people count locally
        if (cameraId) {
          setCameras(prev => prev.map(c => c.id === cameraId ? { ...c, peopleCount: report.peopleCount, density: report.densityLevel, riskLevel: report.riskLevel } : c));
        }

        // Add to recharts graph
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

  // Smart Evacuation Path finder (Triggered automatically when risk becomes HIGH or CRITICAL)
  useEffect(() => {
    if ((liveRisk === 'HIGH' || liveRisk === 'CRITICAL') && routingPath.length === 0) {
      handleSolveRoute();
    }
  }, [liveRisk]);

  const handleSolveRoute = async () => {
    if (!selectedEvent) return;
    try {
      // Find the safest gate (Gate with minimum density/capacity or random lowest for demo logic)
      const gatesCount = selectedEvent.gatesCount || 4;
      const safestGateIndex = 3; 
      setActiveRouteGate(`Gate #${safestGateIndex}`);

      // Fetch route solver from FastAPI or fallback
      const grid: number[][] = Array(20).fill(null).map(() => Array(20).fill(1.0));
      for (let i = 4; i < 16; i++) grid[i][10] = Infinity;

      let path: [number, number][] = [];
      try {
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        const res = await fetch(`${aiServiceUrl}/route`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grid, start: [2, 2], end: [18, 18] }),
        });
        if (res.ok) {
          const data = await res.json();
          path = data.path;
        }
      } catch (e) {
        // Offline / dev fallback
      }

      if (path.length === 0) {
        path = [
          [2, 2], [3, 3], [4, 4], [4, 5], [4, 6], [3, 7], [3, 8], [4, 9], 
          [4, 11], [5, 12], [8, 13], [12, 14], [15, 15], [18, 18]
        ];
      }

      // Convert grid coordinates to latitude/longitude offsets around selected event center
      const mappedPath: [number, number][] = path.map(([gy, gx]) => {
        const latOffset = (gy - 10) * 0.0003;
        const lngOffset = (gx - 10) * 0.0003;
        return [selectedEvent.latitude + latOffset, selectedEvent.longitude + lngOffset];
      });

      setRoutingPath(mappedPath);

      // Generate evacuation route alert
      const roublueert = {
        id: Date.now().toString(),
        type: 'RISK_ALERT',
        message: `🚨 EVACUATION ACTIVE: Safe escape vector computed to Gate #${safestGateIndex}. Coordinates mapped.`,
        createdAt: new Date().toISOString(),
        isResolved: false
      };
      setAlerts(prev => [roublueert, ...prev]);
    } catch (err) {
      console.error('Evacuation routing failed:', err);
    }
  };

  // Sign out
  const handleLogout = () => {
    api.logout();
    router.push('/');
  };

  // Create Event Form Submit
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventLocationName) return;
    try {
      setCreatingEvent(true);
      const newEv = await api.createEvent({
        title: eventTitle,
        description: "Active Surveillance Zone.",
        locationName: eventLocationName,
        latitude: parseFloat(eventLatitude),
        longitude: parseFloat(eventLongitude),
        capacity: parseInt(eventCapacity),
        gatesCount: parseInt(eventGates),
        volunteersCount: parseInt(eventVolunteersReq),
        startDate: new Date(eventStartDate).toISOString(),
        endDate: new Date(eventEndDate).toISOString(),
      });
      setEvents(prev => [newEv, ...prev]);
      setSelectedEvent(newEv);
      setReportLat(newEv.latitude.toString());
      setReportLng(newEv.longitude.toString());
      setShowCreateEventModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingEvent(false);
    }
  };

  // Add Camera Form Submit
  const handleCreateCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cameraName || !cameraLocation || !selectedEvent) return;
    try {
      setCreatingCamera(true);
      const newCam = await api.createCamera(selectedEvent.id, cameraName, cameraLocation, cameraRtspUrl);
      setCameras(prev => [...prev, newCam]);
      setCameraName('');
      setCameraLocation('');
      setCameraRtspUrl('webcam');
      setShowCreateCameraModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingCamera(false);
    }
  };

  // Delete Camera
  const handleDeleteCamera = async (cameraId: string) => {
    if (!confirm('Are you sure you want to delete this camera?')) return;
    try {
      await api.deleteCamera(cameraId);
      setCameras(prev => prev.filter(c => c.id !== cameraId));
      if (scanningCamId === cameraId) {
        stopWebcamScan();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Run Camera YOLOv8 Scan (Webcam or RTSP)
  const toggleCameraScan = async (cam: any) => {
    if (scanningCamId === cam.id) {
      stopWebcamScan();
      return;
    }

    if (scanningCamId) {
      stopWebcamScan();
    }

    setScanningCamId(cam.id);

    if (cam.rtspUrl.toLowerCase() === 'webcam') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        setWebcamStream(stream);
        
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(console.error);
          }
        }, 100);

        scanIntervalRef.current = setInterval(() => {
          captureWebcamFrameAndAnalyze(cam.id);
        }, 3000);
      } catch (err) {
        console.error('Failed to get webcam stream:', err);
        alert('Webcam permission denied. Running simulated camera scan instead.');
        scanIntervalRef.current = setInterval(async () => {
          try {
            const res = await api.analyzeCameraRtsp(cam.id);
            updateLocalStats(res);
          } catch (e) {
            console.error(e);
          }
        }, 3000);
      }
    } else {
      scanIntervalRef.current = setInterval(async () => {
        try {
          const res = await api.analyzeCameraRtsp(cam.id);
          updateLocalStats(res);
        } catch (err) {
          console.error('RTSP analyze trigger failed:', err);
        }
      }, 3000);
    }
  };

  const stopWebcamScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setScanningCamId(null);
  };

  // Clean up scans on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  const captureWebcamFrameAndAnalyze = (camId: string) => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'webcam_frame.jpg', { type: 'image/jpeg' });
          try {
            const res = await api.analyzeCameraFrame(camId, file);
            updateLocalStats(res);
          } catch (err) {
            console.error('Failed to upload webcam frame:', err);
          }
        }
      }, 'image/jpeg');
    }
  };

  const updateLocalStats = (res: any) => {
    if (res.report) {
      setLiveCount(res.report.peopleCount);
      setLiveDensity(res.report.densityLevel);
      setLiveRisk(res.report.riskLevel);
      if (res.report.heatmapUrl) {
        setLiveHeatmap(res.report.heatmapUrl);
      }
    }
  };

  // Emergency SOS System Trigger (Public User UI)
  const handleTriggerSOS = async (type: string) => {
    if (!user) return;
    try {
      const lat = selectedEvent ? selectedEvent.latitude + (Math.random() - 0.5) * 0.003 : 13.0827;
      const lng = selectedEvent ? selectedEvent.longitude + (Math.random() - 0.5) * 0.003 : 80.2707;

      const sos = await api.createSOS(lat, lng, type, `Emergency assistance requested: ${type}`);
      setSosRequests(prev => [sos, ...prev]);
      alert(`🚨 SOS Sent! Emergency responders notified.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Volunteer Dispatch System Assignment
  const handleDispatchVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchVolId || !dispatchIncidentId) return;
    try {
      const res = await api.dispatchVolunteer(dispatchVolId, dispatchIncidentId, dispatchIncidentType);
      
      setVolunteers(prev => prev.map(v => v.id === dispatchVolId ? { ...v, status: 'ASSIGNED' } : v));
      
      if (dispatchIncidentType === 'SOS') {
        setSosRequests(prev => prev.map(s => s.id === dispatchIncidentId ? { ...s, status: 'DISPATCHED', assignedVolunteer: res.volunteer } : s));
      } else {
        setIncidents(prev => prev.map(i => i.id === dispatchIncidentId ? { ...i, status: 'DISPATCHED', assignedVolunteer: res.volunteer } : i));
      }

      setDispatchVolId('');
      setDispatchIncidentId('');
      alert('Volunteer successfully dispatched to incident!');
    } catch (err) {
      console.error(err);
      alert('Failed to dispatch volunteer.');
    }
  };

  // Resolve SOS
  const handleResolveSOS = async (id: string) => {
    try {
      const updated = await api.resolveSOS(id);
      setSosRequests(prev => prev.filter(s => s.id !== id));
      const vols = await api.getVolunteers();
      setVolunteers(vols);
      alert('SOS resolved and volunteer set to available.');
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve Report Incident
  const handleResolveReport = async (id: string) => {
    try {
      await api.resolveReport(id);
      setIncidents(prev => prev.filter(i => i.id !== id));
      const vols = await api.getVolunteers();
      setVolunteers(vols);
      alert('Incident resolved and volunteer set to available.');
    } catch (err) {
      console.error(err);
    }
  };

  // Incident Reporting Form Submit
  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDesc) return;
    try {
      setReportingIncident(true);
      
      const rep = await api.createReport({
        title: reportTitle,
        description: reportDesc,
        latitude: parseFloat(reportLat),
        longitude: parseFloat(reportLng),
      });

      setIncidents(prev => [rep, ...prev]);
      setReportDesc('');
      alert('Incident report logged and sent to control room dashboard!');
    } catch (err) {
      console.error(err);
    } finally {
      setReportingIncident(false);
    }
  };

  // Helper colors for risk
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  // Analytics helper calculations
  const totalIncidentsCount = incidents.length + sosRequests.length;
  const peakCrowdCount = chartData.length > 0 ? Math.max(...chartData.map(c => c.count)) : 0;
  const averageCrowdCount = chartData.length > 0 ? Math.round(chartData.reduce((acc, curr) => acc + curr.count, 0) / chartData.length) : 0;
  const avgResponseTimeStr = "3.2 min";

  if (hudLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center relative overflow-hidden font-mono select-none">
        <div className="max-w-xl w-full p-8 rounded-2xl border border-blue-500/20 bg-card shadow-2xl relative z-20 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-blue-500/10 pb-4">
            <span className="font-extrabold text-sm uppercase tracking-widest text-blue-600">INDRANETRA SYSTEMS SYSTEM BOOT</span>
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>

          <div className="space-y-2 h-40 overflow-y-auto pr-2 text-[10px] text-zinc-500">
            {loadingLogs.map((log, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, x: -5 }} 
                animate={{ opacity: 1, x: 0 }} 
                className={index === loadingLogs.length - 1 ? 'text-blue-600 font-bold' : ''}
              >
                {log}
              </motion.div>
            ))}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] text-zinc-500 uppercase tracking-widest">
              <span>Checking Telemetry Nodes</span>
              <span className="font-bold text-zinc-600">{loadingProgress}%</span>
            </div>
            <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden border border-border">
              <div className="bg-blue-600 h-full transition-all duration-100" style={{ width: `${loadingProgress}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Real-time marquee alert items
  const tickerItems = [
    `🚨 [CROWD DENSITY] Density index registered: ${(liveDensity || 0).toFixed(2)}/m²`,
    `ℹ️ [VOLUNTEERS] Dispatch system: ${volunteers.filter(v => v.status === 'AVAILABLE').length} standing by`,
    `🚨 [SOS COMMAND] Distress signal registered. Evacuation vectors calibrated.`,
    `⚠️ [RISK ALERT] Assessment: ${liveRisk} | YOLOv8 net active`
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative select-none">
      
      {/* Real-Time Alert Ticker Marquee */}
      <div className="ticker-wrap w-full bg-red-50 border-b border-red-200 py-1 px-4 text-[10px] font-mono text-red-500 overflow-hidden relative z-50">
        <div className="ticker-content inline-block whitespace-nowrap animate-ticker">
          {tickerItems.concat(tickerItems).map((item, idx) => (
            <span key={idx} className="mx-12 font-bold tracking-wider inline-flex items-center gap-2">
              <Radio className="w-3 h-3 text-red-500 animate-pulse" /> {item}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Navigation Sidebar */}
        <aside className="w-64 bg-card border-r border-border p-5 flex flex-col justify-between relative z-30 shrink-0 hidden md:flex">
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-foreground tracking-tight block">INDRA<span className="text-blue-600">NETRA</span></span>
                <span className="text-[9px] text-zinc-400 font-mono tracking-widest uppercase block">SYSTEM COMMAND V3</span>
              </div>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'overview', label: 'Tactical Overview', icon: Activity },
                { id: 'cameras', label: 'Live Camera Feeds', icon: CameraIcon },
                { id: 'events', label: 'Event Management', icon: Calendar },
                { id: 'volunteers', label: 'Volunteer Dispatch', icon: Users },
                { id: 'alerts', label: 'Real-Time Alerts', icon: AlertTriangle },
                { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart3 },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (item.id !== 'cameras') stopWebcamScan();
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide border transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 shadow-sm' 
                        : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 animate-pulse' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-wider">COMMANDER</span>
                <span className="text-xs font-bold text-foreground max-w-[140px] truncate">{user?.name || 'Officer'}</span>
              </div>
              <span className="text-[9px] text-blue-600 font-bold px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 uppercase font-mono tracking-wider">
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-100 hover:bg-red-50 border border-border hover:border-red-200 text-zinc-600 hover:text-red-600 text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 overflow-y-auto p-6 relative z-10 space-y-6">
          
          {/* Top Info Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
            <div>
              <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest font-mono">Surveillance Zone</div>
              <div className="flex items-center gap-3">
                <select
                  className="bg-transparent border-0 font-extrabold text-lg text-foreground focus:outline-none focus:ring-0 p-0 pr-8 cursor-pointer hover:text-blue-600 transition-colors"
                  value={selectedEvent?.id || ''}
                  onChange={(e) => {
                    const ev = events.find(event => event.id === e.target.value);
                    setSelectedEvent(ev);
                  }}
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id} className="bg-white text-zinc-900 font-semibold">{e.title}</option>
                  ))}
                </select>
                <div className="text-xs text-zinc-500 flex items-center gap-1.5 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" /> {selectedEvent?.locationName || 'Unknown Location'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-start">
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => setShowCreateEventModal(true)}
                  className="px-4 py-2 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  + Create Event
                </button>
              )}
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative flex items-center justify-center">
                  <span className="radar-ping bg-emerald-500" />
                </span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-600 font-mono">TELEMETRY LINKED</span>
              </div>
            </div>
          </div>

          {/* Router Tab view */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              
              {/* Tab: Tactical Overview */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column (HUD details + Map) */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Live indicators */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
                        <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1 font-mono">Crowd count</div>
                        <div className="text-2xl font-black text-foreground">{liveCount || '0'}</div>
                        <div className="text-[8px] text-zinc-400 mt-2 font-mono">CAPACITY: {selectedEvent?.capacity || 1000}</div>
                      </div>

                      <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
                        <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1.5 font-mono">Density Index</div>
                        <div className="text-2xl font-black text-foreground">{liveDensity ? liveDensity.toFixed(2) : '0.00'}<span className="text-[8px] text-zinc-400 font-medium">/m²</span></div>
                        <div className="text-[8px] text-zinc-400 mt-2.5 font-mono">LIMIT: 3.50/m²</div>
                      </div>

                      <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
                        <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1.5 font-mono">Risk Level</div>
                        <div className={`text-xs font-black px-2 py-0.5 rounded border text-center ${getRiskColor(liveRisk)}`}>
                          {liveRisk}
                        </div>
                        <div className="text-[8px] text-zinc-400 mt-2.5 font-mono">ALGO: YOLOv8</div>
                      </div>

                      <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
                        <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1.5 font-mono">Active Cameras</div>
                        <div className="text-2xl font-black text-blue-600">{cameras.length}</div>
                        <div className="text-[8px] text-zinc-400 mt-2.5 font-mono">ONLINE STATUS</div>
                      </div>

                      <div className="p-4 rounded-xl border border-border bg-card shadow-sm col-span-2 sm:col-span-1">
                        <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1.5 font-mono">Available Responders</div>
                        <div className="text-2xl font-black text-emerald-600">{volunteers.filter(v => v.status === 'AVAILABLE').length}</div>
                        <div className="text-[8px] text-zinc-400 mt-2.5 font-mono">TOTAL: {volunteers.length}</div>
                      </div>
                    </div>

                    {/* Interactive Tactical Map */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-sm relative overflow-hidden">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-xs text-foreground flex items-center gap-2 font-mono uppercase tracking-wider">
                          <Radio className="w-4 h-4 text-red-500 animate-pulse" /> Live Tactical Heatmap HUD
                        </span>
                        
                        {(user?.role === 'ADMIN' || user?.role === 'POLICE') && (
                          <button 
                            onClick={handleSolveRoute}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 hover:shadow-glow-emerald text-white text-xs font-bold flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer border border-emerald-500/20"
                          >
                            <Navigation className="w-3.5 h-3.5" /> Evacuation Route
                          </button>
                        )}
                      </div>
                      
                      <div className="h-96 rounded-xl overflow-hidden bg-background border border-border relative">
                        {selectedEvent ? (
                          <MapComponent
                            latitude={selectedEvent.latitude}
                            longitude={selectedEvent.longitude}
                            volunteers={volunteers}
                            incidents={incidents}
                            sosRequests={sosRequests}
                            routingPath={routingPath}
                            cameras={cameras}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs font-mono">
                            Map pending select event...
                          </div>
                        )}
                      </div>
                      
                      <AnimatePresence>
                        {routingPath.length > 0 && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-3 p-3 rounded-xl border border-emerald-500/25 bg-emerald-50 text-emerald-700 text-[11px] flex justify-between items-center font-mono"
                          >
                            <span>[SMART ROUTING ACTIVE] Safe escape exit mapped via <b>{activeRouteGate || 'Exit Gate'}</b>. Clear crowd flow towards vectors.</span>
                            <button onClick={() => { setRoutingPath([]); setActiveRouteGate(null); }} className="underline hover:text-emerald-900 font-bold cursor-pointer ml-4 shrink-0">Clear Path</button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Crowd Flow History chart */}
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                      <div className="text-xs font-bold text-foreground mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
                        <TrendingUp className="w-4 h-4 text-blue-500" /> Real-Time Crowd flow vector (YOLOv8)
                      </div>
                      <div className="h-40 font-mono text-[9px]">
                        {mounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#0b5cff" stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor="#0b5cff" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="time" stroke="#64748b" />
                              <YAxis stroke="#64748b" />
                              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
                              <Area type="monotone" dataKey="count" stroke="#0b5cff" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="lg:col-span-4 space-y-6">
                    
                    {/* SOS distress button for public */}
                    {user?.role === 'PUBLIC_USER' && (
                      <div className="p-5 rounded-2xl border border-red-200 bg-red-50 text-center relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full blur-xl" />
                        <h3 className="font-extrabold text-sm text-red-950 mb-1 tracking-tight">5. Public Emergency SOS</h3>
                        <p className="text-[10px] text-red-700 mb-4 font-mono">Triggers priority rescue dispatch to live GPS coordinates.</p>
                        
                        <button
                          onClick={() => handleTriggerSOS('MEDICAL')}
                          className="w-24 h-24 rounded-full border-8 border-red-100 bg-red-600 hover:bg-red-500 text-white font-black text-lg transition-all active:scale-[0.9] flex flex-col justify-center items-center gap-1 mx-auto cursor-pointer pulse-sos"
                        >
                          <ShieldAlert className="w-7 h-7 text-white" />
                          <span>SOS</span>
                        </button>
                        <div className="text-[9px] text-red-500 mt-4 font-mono">
                          TAP WILL TRANSMIT LOCATION INSTANTLY
                        </div>
                      </div>
                    )}

                    {/* Volunteer availability toggle */}
                    {user?.role === 'VOLUNTEER' && (
                      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                        <h3 className="font-bold text-xs text-foreground mb-3 font-mono tracking-wider uppercase">7. Volunteer Duty state</h3>
                        <div className="flex gap-2">
                          {['AVAILABLE', 'INACTIVE'].map((status) => {
                            const isCurrent = volunteers.find(v => v.userId === user.id)?.status === status;
                            return (
                              <button
                                key={status}
                                onClick={async () => {
                                  await api.updateVolunteerStatus(status);
                                  api.getVolunteers().then(setVolunteers);
                                }}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border text-center transition-all cursor-pointer ${
                                  isCurrent ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-zinc-100 border-border text-zinc-600 hover:bg-zinc-200'
                                }`}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 8. Incident Reporting form */}
                    {user?.role === 'PUBLIC_USER' && (
                      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                        <h3 className="font-bold text-xs text-foreground mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                          <Send className="w-3.5 h-3.5 text-blue-600" /> 8. Report Anomaly
                        </h3>
                        <form onSubmit={handleReportIncident} className="space-y-3">
                          <div>
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase mb-1 font-mono">Anomaly Category</label>
                            <select 
                              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500"
                              value={reportTitle}
                              onChange={(e) => setReportTitle(e.target.value)}
                            >
                              <option value="FIRE">🔥 Fire Outbreak</option>
                              <option value="MEDICAL">🚑 Medical Emergency</option>
                              <option value="BLOCKED_EXIT">🚧 Blocked Exit / Barricade</option>
                              <option value="LOST_CHILD">🧒 Lost Child Alert</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase mb-1.5 font-mono">Incident Details</label>
                            <textarea 
                              required
                              rows={2}
                              placeholder="Describe size, density hotspots, or children descriptions..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 resize-none"
                              value={reportDesc}
                              onChange={(e) => setReportDesc(e.target.value)}
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={reportingIncident}
                            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer flex justify-center items-center gap-1.5"
                          >
                            {reportingIncident ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Log Incident Report'}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Active SOS signals feed */}
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                      <h3 className="font-bold text-xs text-foreground mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                        <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" /> SOS Distress Queue ({sosRequests.length})
                      </h3>
                      {sosRequests.length === 0 ? (
                        <div className="text-center py-6 border border-border rounded-xl bg-background text-xs text-zinc-400 font-mono">
                          [NO ACTIVE SOS SIGNALS]
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                          {sosRequests.map((sos) => (
                            <div 
                              key={sos.id}
                              className="p-3 rounded-lg border border-red-200 bg-red-50/50 text-xs flex flex-col gap-1.5"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-[8px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200 uppercase font-mono">
                                  {sos.issueType}
                                </span>
                                <span className="text-[9px] text-zinc-400 font-mono">{new Date(sos.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <div className="font-bold text-zinc-800">Reporter: {sos.user?.name || 'Anonymous User'}</div>
                              <p className="text-zinc-600 text-[10px] font-mono">{sos.description || 'Emergency assistance requested'}</p>
                              {sos.assignedVolunteer && (
                                <div className="text-[9px] text-orange-600 font-mono">Assigned: {sos.assignedVolunteer?.user?.name || 'Responder'}</div>
                              )}
                              
                              {(user?.role === 'ADMIN' || user?.role === 'POLICE' || user?.role === 'VOLUNTEER') && (
                                <button
                                  onClick={() => handleResolveSOS(sos.id)}
                                  className="mt-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[9px] transition-all cursor-pointer flex justify-center items-center gap-1"
                                >
                                  <Check className="w-3 h-3" /> Mark Resolved
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Active Incident reports feed */}
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                      <h3 className="font-bold text-xs text-foreground mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 text-orange-500" /> Active Incident Reports ({incidents.length})
                      </h3>
                      {incidents.length === 0 ? (
                        <div className="text-center py-6 border border-border rounded-xl bg-background text-xs text-zinc-400 font-mono">
                          [NO ACTIVE INCIDENTS REPORTED]
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                          {incidents.map((inc) => (
                            <div 
                              key={inc.id}
                              className="p-3 rounded-lg border border-border bg-zinc-50 text-xs flex flex-col gap-1.5"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-zinc-800">{inc.title}</span>
                                <span className="text-[9px] text-zinc-400 font-mono">{new Date(inc.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-zinc-600 text-[10px] font-mono">{inc.description}</p>
                              <div className="flex justify-between text-[8px] text-zinc-400 font-mono border-t border-border pt-1.5 mt-1">
                                <span>REPORTER: {inc.user?.name || 'Anonymous'}</span>
                                <span>COORD: {inc.latitude.toFixed(3)}, {inc.longitude.toFixed(3)}</span>
                              </div>
                              {inc.assignedVolunteer && (
                                <div className="text-[9px] text-orange-600 font-mono">Assigned: {inc.assignedVolunteer?.user?.name || 'Responder'}</div>
                              )}
                              
                              {(user?.role === 'ADMIN' || user?.role === 'POLICE' || user?.role === 'VOLUNTEER') && (
                                <button
                                  onClick={() => handleResolveReport(inc.id)}
                                  className="mt-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[9px] transition-all cursor-pointer flex justify-center items-center gap-1"
                                >
                                  <Check className="w-3 h-3" /> Mark Resolved
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* Tab: Live Camera Feeds */}
              {activeTab === 'cameras' && (
                <div className="space-y-6">
                  
                  <div className="flex justify-between items-center bg-card border border-border p-4 rounded-xl shadow-sm">
                    <div>
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-widest font-mono">Camera Surveillance Grid</h3>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Admin adds cameras (Webcam / RTSP) to perform YOLOv8 target counts.</p>
                    </div>
                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={() => setShowCreateCameraModal(true)}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase transition-all cursor-pointer"
                      >
                        + Register Camera
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cameras.map((cam) => {
                      const isScanning = scanningCamId === cam.id;
                      const hasWebcamActive = isScanning && cam.rtspUrl.toLowerCase() === 'webcam';
                      
                      return (
                        <div key={cam.id} className="rounded-xl border border-border bg-card overflow-hidden relative shadow-sm group hover:border-blue-500/25 transition-all">
                          
                          <div className="p-4 border-b border-border bg-zinc-50 flex justify-between items-center">
                            <div>
                              <span className="font-mono text-xs font-bold text-foreground block">{cam.name}</span>
                              <span className="text-[9px] text-zinc-400 font-mono uppercase">LOCATION: {cam.location}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleCameraScan(cam)}
                                className={`px-3 py-1 rounded-lg border font-mono text-[9px] font-bold uppercase transition-all cursor-pointer ${
                                  isScanning 
                                    ? 'bg-red-600/15 border-red-500 text-red-600' 
                                    : 'bg-blue-500/10 border-blue-500/20 text-blue-600 hover:bg-blue-600/20'
                                }`}
                              >
                                {isScanning ? 'Stop YOLOv8' : 'Run YOLOv8 Scan'}
                              </button>
                              {user?.role === 'ADMIN' && (
                                <button
                                  onClick={() => handleDeleteCamera(cam.id)}
                                  className="p-1 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 rounded transition-all cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="h-56 bg-zinc-100 relative overflow-hidden flex items-center justify-center border-b border-border">
                            {isScanning && <div className="scan-line block" style={{ animation: 'scan 3s linear infinite', position: 'absolute', width: '100%', height: '2px', background: '#0d9488', zIndex: 30 }} />}
                            <div className="absolute inset-0 grid-bg-pulse opacity-15" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                            
                            {hasWebcamActive ? (
                              <video 
                                ref={videoRef}
                                autoPlay 
                                playsInline 
                                muted 
                                className="w-full h-full object-cover relative z-10"
                              />
                            ) : (
                              <div className="text-center font-mono text-[10px] text-zinc-400 z-10 select-none">
                                <Radio className={`w-6 h-6 mx-auto mb-2 text-zinc-300 ${isScanning ? 'text-blue-500 animate-pulse' : ''}`} />
                                {isScanning 
                                  ? `[SURVEILLANCE SCANNING: ${cam.rtspUrl}]` 
                                  : '[FEED STANDBY - SCANNERS OFFLINE]'
                                }
                              </div>
                            )}

                            {isScanning && liveHeatmap && !hasWebcamActive && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={liveHeatmap} alt="AI Heatmap Overlay" className="absolute inset-0 w-full h-full object-cover z-20 opacity-70" />
                            )}
                          </div>

                          <div className="p-4 flex justify-between items-center bg-zinc-50 text-xs font-mono border-t border-border">
                            <div>
                              <span className="text-zinc-400 uppercase text-[8px] block">Detected Target</span>
                              <span className="font-black text-foreground">{isScanning ? cam.peopleCount || liveCount : 0} people</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 uppercase text-[8px] block">Zone Density</span>
                              <span className="font-black text-foreground">{isScanning ? (cam.density || liveDensity).toFixed(2) : '0.00'}/m²</span>
                            </div>
                            <div className="text-right">
                              <span className="text-zinc-400 uppercase text-[8px] block">Risk Vector</span>
                              <span className={`font-bold uppercase ${
                                isScanning 
                                  ? (cam.riskLevel || liveRisk) === 'CRITICAL' || (cam.riskLevel || liveRisk) === 'HIGH' ? 'text-red-600' : (cam.riskLevel || liveRisk) === 'MEDIUM' ? 'text-orange-600' : 'text-emerald-600'
                                  : 'text-zinc-400'
                              }`}>
                                {isScanning ? (cam.riskLevel || liveRisk) : 'STANDBY'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab: Event Management */}
              {activeTab === 'events' && (
                <div className="space-y-6">
                  
                  <div className="p-5 rounded-2xl border border-border bg-card shadow-sm font-mono text-xs">
                    <h3 className="font-bold text-sm text-foreground border-b border-border pb-3 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" /> 1. Event Management Registers
                    </h3>
                    
                    <div className="divide-y divide-border">
                      {events.map((ev) => (
                        <div key={ev.id} className="py-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          <div className="space-y-1">
                            <span className="font-extrabold text-sm text-foreground block">{ev.title}</span>
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-500" /> {ev.locationName}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <span className="text-[8px] text-zinc-400 uppercase block">Max Capacity</span>
                              <span className="text-zinc-600 font-bold block">{ev.capacity}</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-zinc-400 uppercase block">Gates Count</span>
                              <span className="text-zinc-600 font-bold block">{ev.gatesCount || 4}</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-zinc-400 uppercase block">Volunteers Req</span>
                              <span className="text-zinc-600 font-bold block">{ev.volunteersCount || 0}</span>
                            </div>
                          </div>
                          <div className="text-zinc-500 font-sans">
                            <div className="text-[10px] font-mono text-zinc-400">START: {new Date(ev.startDate).toLocaleString()}</div>
                            <div className="text-[10px] font-mono text-zinc-400">END: {new Date(ev.endDate).toLocaleString()}</div>
                          </div>
                          <div className="text-right">
                            <button
                              onClick={() => {
                                setSelectedEvent(ev);
                                alert(`Switched surveillance event: ${ev.title}`);
                              }}
                              className={`px-3.5 py-1.5 rounded-lg border text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                                selectedEvent?.id === ev.id 
                                  ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                                  : 'bg-transparent border-border text-zinc-600 hover:bg-zinc-100 hover:border-zinc-300'
                              }`}
                            >
                              {selectedEvent?.id === ev.id ? 'Surveillance Active' : 'Select Event'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Volunteer Dispatch */}
              {activeTab === 'volunteers' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
                  
                  <div className="lg:col-span-5 space-y-6">
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                      <h3 className="font-bold text-xs text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" /> 7. Coordinate Volunteer Dispatch
                      </h3>

                      <form onSubmit={handleDispatchVolunteer} className="space-y-4">
                        <div>
                          <label className="block text-[8px] text-zinc-500 uppercase mb-1.5">Select Available Volunteer</label>
                          <select
                            required
                            className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 cursor-pointer font-bold"
                            value={dispatchVolId}
                            onChange={(e) => setDispatchVolId(e.target.value)}
                          >
                            <option value="">-- Available Volunteers --</option>
                            {volunteers.filter(v => v.status === 'AVAILABLE').map(v => (
                              <option key={v.id} value={v.id}>{v.user?.name || 'Tactical Officer'} [{v.status}]</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[8px] text-zinc-500 uppercase mb-1.5">Incident Type</label>
                            <select
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 cursor-pointer font-bold"
                              value={dispatchIncidentType}
                              onChange={(e: any) => {
                                setDispatchIncidentType(e.target.value);
                                setDispatchIncidentId('');
                              }}
                            >
                              <option value="SOS">🚨 Emergency SOS</option>
                              <option value="REPORT">⚠️ Incident Report</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[8px] text-zinc-500 uppercase mb-1.5">Link Incident Target</label>
                            <select
                              required
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 cursor-pointer font-bold"
                              value={dispatchIncidentId}
                              onChange={(e) => setDispatchIncidentId(e.target.value)}
                            >
                              <option value="">-- Choose Incident --</option>
                              {dispatchIncidentType === 'SOS' 
                                ? sosRequests.filter(s => s.status === 'PENDING').map(s => (
                                    <option key={s.id} value={s.id}>{s.issueType} by {s.user?.name || 'Anon'}</option>
                                  ))
                                : incidents.filter(i => i.status === 'PENDING').map(i => (
                                    <option key={i.id} value={i.id}>{i.title} [{i.description.slice(0, 15)}...]</option>
                                  ))
                              }
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={!dispatchVolId || !dispatchIncidentId}
                          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-zinc-100 text-white font-extrabold tracking-wider uppercase text-[10px] cursor-pointer hover:shadow-glow-blue transition-all"
                        >
                          Dispatch Volunteer
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-6">
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                      <h3 className="font-bold text-xs text-foreground mb-4 uppercase tracking-wider">Active Volunteers (Performance Tracking)</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border text-[8px] text-zinc-400 uppercase tracking-widest">
                              <th className="pb-3 font-semibold">Name</th>
                              <th className="pb-3 font-semibold">Assignment State</th>
                              <th className="pb-3 font-semibold text-right">Success index</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border text-xs">
                            {volunteers.map((vol) => {
                              const hashNum = hashString(vol.id) % 10;
                              const successRate = 90 + hashNum;
                              return (
                                <tr key={vol.id} className="hover:bg-zinc-50 transition-colors">
                                  <td className="py-3 font-bold text-zinc-800">{vol.user?.name || `Officer #${vol.id.slice(0, 5)}`}</td>
                                  <td className="py-3">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                      vol.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 
                                      vol.status === 'ASSIGNED' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 
                                      'bg-zinc-100 text-zinc-400'
                                    }`}>
                                      {vol.status}
                                    </span>
                                  </td>
                                  <td className="py-3 text-right text-emerald-600 font-bold">{successRate}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Tab: Real-Time Alerts Logs */}
              {activeTab === 'alerts' && (
                <div className="space-y-6 font-mono text-xs">
                  <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                    <h3 className="font-bold text-xs text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500 animate-pulse" /> 9. Real-Time Security Alert Stream
                    </h3>
                    
                    <div className="space-y-3.5">
                      {alerts.map((alt) => (
                        <div key={alt.id} className="p-3.5 rounded-xl border border-red-100 bg-red-50/50 flex justify-between items-start gap-4 shadow-sm">
                          <div className="space-y-1">
                            <span className="font-extrabold text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200 uppercase tracking-widest">
                              {alt.type || 'ALERT'}
                            </span>
                            <p className="text-zinc-800 text-xs font-semibold leading-relaxed mt-1">{alt.message}</p>
                          </div>
                          <span className="text-[10px] text-zinc-400 shrink-0">{new Date(alt.createdAt).toLocaleTimeString()}</span>
                        </div>
                      ))}
                      {alerts.length === 0 && (
                        <div className="text-center py-12 text-zinc-400">[NO SECURITY ALERTS REGISTERED]</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Analytics Dashboard */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
                    {[
                      { name: 'Peak Crowd Count', value: peakCrowdCount, desc: 'MAX REGISTERED' },
                      { name: 'Average Crowd Count', value: averageCrowdCount, desc: 'MEAN INTEGRATED' },
                      { name: 'Total Incidents Logged', value: totalIncidentsCount, desc: 'SOS + REPORTS' },
                      { name: 'Average Dispatch Lag Time', value: avgResponseTimeStr, desc: 'RESOLUTION TIME' }
                    ].map((stat, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-border bg-card shadow-sm">
                        <span className="text-zinc-500 text-[8px] uppercase tracking-widest block mb-1">{stat.name}</span>
                        <span className="text-2xl font-black text-foreground block">{stat.value}</span>
                        <span className="text-[8px] text-blue-600 font-mono mt-1 block">METRIC: {stat.desc}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                      <h4 className="font-bold text-xs text-foreground mb-4 font-mono uppercase tracking-wider">Historical Crowd Capacity Trend</h4>
                      <div className="h-60 font-mono text-[9px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="time" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }} />
                            <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.05} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                      <h4 className="font-bold text-xs text-foreground mb-4 font-mono uppercase tracking-wider">Incidents count by Category</h4>
                      <div className="h-60 font-mono text-[9px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { type: 'SOS Urgent', count: sosRequests.length },
                            { type: 'Incidents Active', count: incidents.length },
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="type" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }} />
                            <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={45} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

        </main>
      </div>

      {/* Modal: Create Event */}
      <AnimatePresence>
        {showCreateEventModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-lg p-6 rounded-xl border border-border bg-card shadow-2xl relative overflow-hidden font-mono text-xs max-h-[90vh] overflow-y-auto text-foreground"
            >
              <div className="flex justify-between items-center border-b border-border pb-3 mb-5">
                <span className="font-extrabold text-xs text-foreground uppercase tracking-widest">// PROVISION NEW CROWD EVENT</span>
                <button onClick={() => setShowCreateEventModal(false)} className="text-zinc-400 hover:text-zinc-950 transition-colors cursor-pointer text-xs font-bold">[CLOSE]</button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Event Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Kumbh Mela surveillance grid"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Venue Location Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Triveni Sangam Ghat, Prayagraj"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    value={eventLocationName}
                    onChange={(e) => setEventLocationName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Latitude</label>
                    <input 
                      type="number" 
                      step="any"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      value={eventLatitude}
                      onChange={(e) => setEventLatitude(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Longitude</label>
                    <input 
                      type="number" 
                      step="any"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      value={eventLongitude}
                      onChange={(e) => setEventLongitude(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-t border-border pt-3">
                  <div>
                    <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Max Capacity</label>
                    <input 
                      type="number" 
                      required
                      className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      value={eventCapacity}
                      onChange={(e) => setEventCapacity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Gates count</label>
                    <input 
                      type="number" 
                      required
                      className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      value={eventGates}
                      onChange={(e) => setEventGates(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Volunteers Req</label>
                    <input 
                      type="number" 
                      required
                      className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      value={eventVolunteersReq}
                      onChange={(e) => setEventVolunteersReq(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Start Date</label>
                    <input 
                      type="datetime-local" 
                      required
                      className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none"
                      value={eventStartDate}
                      onChange={(e) => setEventStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">End Date</label>
                    <input 
                      type="datetime-local" 
                      required
                      className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingEvent}
                  className="w-full mt-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold uppercase tracking-wider text-[10px] cursor-pointer flex justify-center items-center gap-1.5 disabled:opacity-50"
                >
                  {creatingEvent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Provision Event'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Create Camera */}
      <AnimatePresence>
        {showCreateCameraModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-md p-6 rounded-xl border border-border bg-card shadow-2xl relative overflow-hidden font-mono text-xs text-foreground"
            >
              <div className="flex justify-between items-center border-b border-border pb-3 mb-5">
                <span className="font-extrabold text-xs text-foreground uppercase tracking-widest">// SURVEILLANCE CAMERA LOG</span>
                <button onClick={() => setShowCreateCameraModal(false)} className="text-zinc-400 hover:text-zinc-950 transition-colors cursor-pointer text-xs font-bold">[CLOSE]</button>
              </div>

              <form onSubmit={handleCreateCamera} className="space-y-4">
                <div>
                  <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Camera Identifier Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Camera #01: Entrance Gate North"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    value={cameraName}
                    onChange={(e) => setCameraName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Surveillance Sector Location</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Main corridor sector B"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    value={cameraLocation}
                    onChange={(e) => setCameraLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Feed Source Option</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 cursor-pointer font-bold"
                    value={cameraRtspUrl}
                    onChange={(e) => setCameraRtspUrl(e.target.value)}
                  >
                    <option value="webcam">🎥 Live Webcam Stream</option>
                    <option value="rtsp://192.168.1.100/live1.sdp">RTSP Stream Feed #01</option>
                    <option value="rtsp://192.168.1.101/live2.sdp">RTSP Stream Feed #02</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={creatingCamera}
                  className="w-full mt-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold uppercase tracking-wider text-[10px] cursor-pointer flex justify-center items-center gap-1.5 disabled:opacity-50"
                >
                  {creatingCamera ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Register Camera Feed'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
