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
  Settings as SettingsIcon, 
  TrendingUp, 
  Radio, 
  Navigation,
  Check,
  Eye,
  Loader2,
  Calendar,
  BarChart3,
  Brain,
  Cpu,
  Search,
  FileText,
  Sliders,
  MessageSquare,
  Clock,
  Baby,
  Plus,
  X,
  Download,
  Play,
  Zap,
  Menu,
  ChevronRight,
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

// Dynamically import MapComponent to avoid SSR window is not defined errors
const MapComponent = dynamic(() => import('../../components/MapComponent'), { ssr: false });

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Layout & UI States
  const [hudLoading, setHudLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Baseline API States
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

  // Event Creation states
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('Indra Stadium Live Concert');
  const [eventType, setEventType] = useState('Concert');
  const [eventLocationName, setEventLocationName] = useState('Indra National Stadium, Chennai');
  const [eventLatitude, setEventLatitude] = useState('13.0827');
  const [eventLongitude, setEventLongitude] = useState('80.2707');
  const [eventStartDate, setEventStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [eventEndDate, setEventEndDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [eventCapacity, setEventCapacity] = useState('1000');
  const [eventGates, setEventGates] = useState('4');
  const [eventVolunteersReq, setEventVolunteersReq] = useState('40');
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Recharts Real-time Trend State
  const [chartData, setChartData] = useState<any[]>([
    { time: '19:00', count: 120 },
    { time: '19:05', count: 180 },
    { time: '19:10', count: 240 },
    { time: '19:15', count: 310 },
    { time: '19:20', count: 290 },
  ]);

  // View-Specific Mock & Simulation States
  // 1. Camera Scans
  const [scanningCam, setScanningCam] = useState<string | null>(null);
  const [aiDetectedCams, setAiDetectedCams] = useState<{ [key: string]: boolean }>({});

  // 2. Timeline state logs dictionary mapped by Event ID
  const [timelineLogs, setTimelineLogs] = useState<{ [key: string]: any[] }>({
    default: [
      { id: '1', time: '08:00', log: 'Event Commenced. Security guards deployed at all exit channels.' },
      { id: '2', time: '09:15', log: 'Gates open. High entry rate registered on North and South corridors.' },
      { id: '3', time: '10:45', log: 'Crowd increase. Local security units request additional volunteer backup.' },
      { id: '4', time: '12:00', log: 'Routine inspection completed. No gate blockage reported.' }
    ]
  });
  const [newLogTime, setNewLogTime] = useState('13:00');
  const [newLogContent, setNewLogContent] = useState('');

  // 3. Digital Twin Simulator states
  const [twinExpectedCrowd, setTwinExpectedCrowd] = useState('2500');
  const [twinGatesCount, setTwinGatesCount] = useState('6');
  const [twinCapacity, setTwinCapacity] = useState('3000');
  const [twinSpeed, setTwinSpeed] = useState('standard');
  const [twinSimulating, setTwinSimulating] = useState(false);
  const [twinResult, setTwinResult] = useState<any>(null);

  // 4. Lost Child Locator
  const [lostChildren, setLostChildren] = useState<any[]>([
    { id: '1', name: 'Aarav Sharma', age: 6, description: 'Wearing red t-shirt, blue shorts', lastSeen: 'Sector 3 Entrance', latitude: 13.0830, longitude: 80.2715, status: 'SEARCHING' }
  ]);
  const [lostChildName, setLostChildName] = useState('');
  const [lostChildAge, setLostChildAge] = useState('');
  const [lostChildDesc, setLostChildDesc] = useState('');
  const [lostChildLastSeen, setLostChildLastSeen] = useState('');
  const [lostChildLat, setLostChildLat] = useState('13.0827');
  const [lostChildLng, setLostChildLng] = useState('80.2707');

  // 5. Reports Exporter
  const [reportType, setReportType] = useState('daily_summary');
  const [reportFormat, setReportFormat] = useState('PDF');
  const [reportsGenerating, setReportsGenerating] = useState(false);
  const [reportsArchive, setReportsArchive] = useState<any[]>([
    { id: 'rep-01', name: 'Daily Incident Summary - 18 June 2026', format: 'PDF', timestamp: '18 Jun, 23:45', hash: 'SHA256-A9B8F12C...' }
  ]);

  // 6. Settings Control
  const [settingsThreshold, setSettingsThreshold] = useState(3.5);
  const [settingsRadius, setSettingsRadius] = useState(150);
  const [settingsEnableSMS, setSettingsEnableSMS] = useState(true);
  const [settingsEnableSound, setSettingsEnableSound] = useState(true);
  const [settingsAutoAssign, setSettingsAutoAssign] = useState(true);

  // 7. Floating AI Assistant Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'ai', text: 'Greetings, Officer. I am the IndraNetra tactical AI assistant. Ask me anything about live crowd density, SOS alerts, volunteer states, or evacuation safety.', time: new Date().toLocaleTimeString() }
  ]);

  // 8. Volunteer Dispatch variables
  const [dispatchVolId, setDispatchVolId] = useState('');
  const [dispatchSosId, setDispatchSosId] = useState('');

  // Socket Hook
  const socket = useSocket(selectedEvent?.id);

  // Fullscreen HUD loading simulator
  useEffect(() => {
    const logs = [
      "// BOOTING INDRANETRA CORE ENGINE V3.0...",
      "// ESTABLISHING ENCRYPTED SECURE TELEMETRY LINK...",
      "// LOADING COMPUTER VISION NETWORKS (YOLOv8, DEEPLABV3)...",
      "// CALIBRATING SCANNERS & SATELLITE HUD OVERLAYS...",
      "// SYNCRONIZING WITH POSTGRESQL DATA STORE...",
      "// SYSTEM DIAGNOSTICS COMPLETE. INITIALIZING HUD WINDOW..."
    ];
    
    let currentLogIndex = 0;
    let progress = 0;
    
    const interval = setInterval(() => {
      progress += 4;
      if (progress > 100) progress = 100;
      setLoadingProgress(progress);
      
      if (progress % 16 === 0 && currentLogIndex < logs.length) {
        setLoadingLogs(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      }
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setHudLoading(false);
        }, 300);
      }
    }, 45);
    
    return () => clearInterval(interval);
  }, []);

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
        setLostChildLat(eventsList[0].latitude.toString());
        setLostChildLng(eventsList[0].longitude.toString());
      } else {
        // Create a default event if database is empty
        const defaultEv = await api.createEvent({
          title: "Indra Stadium Mega Concert",
          description: "Annual cultural festival gathering over 2,000 attendees.",
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

  // Submit SOS request (Distress Alert)
  const handleTriggerSOS = async (type: string) => {
    if (!user) return;
    try {
      setSosSubmitted(true);
      const lat = selectedEvent ? selectedEvent.latitude + (Math.random() - 0.5) * 0.003 : 13.0827;
      const lng = selectedEvent ? selectedEvent.longitude + (Math.random() - 0.5) * 0.003 : 80.2707;
      
      const sos = await api.createSOS(lat, lng, type, `Emergency assistance requested: ${type}`);
      setSosRequests(prev => [sos, ...prev]);
      
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

  // Dispatch Volunteer Action handler
  const handleDispatchVolunteerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchVolId || !dispatchSosId) return;
    
    // Toggle state to assigned
    setVolunteers(prev => prev.map(v => v.id === dispatchVolId ? { ...v, status: 'ASSIGNED' } : v));
    setSosRequests(prev => prev.map(s => s.id === dispatchSosId ? { ...s, status: 'ASSIGNED', assignedVolunteer: volunteers.find(v => v.id === dispatchVolId)?.user?.name || 'Officer' } : s));
    
    setAlerts(prev => [
      {
        id: Date.now().toString(),
        title: `DISPATCH: Volunteer assigned to SOS`,
        description: `Volunteer is en-route to emergency coordinates.`,
        createdAt: new Date().toISOString(),
        isResolved: false
      },
      ...prev
    ]);
    
    setDispatchVolId('');
    setDispatchSosId('');
  };

  // SOS Stepper states (Received -> Assigned -> Reached -> Closed)
  const handleAdvanceSOSStatus = async (sosId: string, currentStatus: string) => {
    try {
      const statusMap: { [key: string]: string } = {
        'PENDING': 'ASSIGNED',
        'ASSIGNED': 'REACHED',
        'REACHED': 'RESOLVED'
      };

      const nextStatus = statusMap[currentStatus] || 'ASSIGNED';
      
      if (nextStatus === 'RESOLVED') {
        await api.resolveSOS(sosId);
        setSosRequests(prev => prev.filter(r => r.id !== sosId));
      } else {
        setSosRequests(prev => prev.map(s => {
          if (s.id === sosId) {
            return { 
              ...s, 
              status: nextStatus,
              assignedVolunteer: s.assignedVolunteer || (volunteers.find(v => v.status === 'AVAILABLE')?.user?.name || 'Tactical Officer')
            };
          }
          return s;
        }));
      }
    } catch (err) {
      console.error('Failed to advance SOS status:', err);
    }
  };

  // Resolve SOS Alert directly
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
      setVolunteers(prev => prev.map(v => v.userId === user.id ? { ...v, status } : v));
      if (status === 'AVAILABLE' && selectedEvent) {
        const vLat = selectedEvent.latitude + (Math.random() - 0.5) * 0.003;
        const vLng = selectedEvent.longitude + (Math.random() - 0.5) * 0.003;
        await api.updateVolunteerLocation(vLat, vLng);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Camera Frame Upload (Simulates camera input for analysis)
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

  // Trigger YOLO scanning overlays
  const triggerCameraScan = (camId: string) => {
    setScanningCam(camId);
    setTimeout(() => {
      setAiDetectedCams(prev => ({ ...prev, [camId]: !prev[camId] }));
      setScanningCam(null);
    }, 1500);
  };

  // Pathfinder solve evacuation route (A* algorithm)
  const handleSolveRoute = async () => {
    if (!selectedEvent) return;
    const grid: number[][] = Array(20).fill(null).map(() => Array(20).fill(1.0));
    for (let i = 5; i < 15; i++) {
      grid[i][10] = Infinity;
    }
    for (let i = 8; i < 12; i++) {
      for (let j = 5; j < 9; j++) {
        grid[i][j] = 15.0; // high density weight
      }
    }

    try {
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
        // Fallback mock path if service is offline
      }

      if (path.length === 0) {
        path = [
          [2, 2], [3, 3], [4, 4], [4, 5], [4, 6], [3, 7], [3, 8], [4, 9], 
          [4, 11], [5, 12], [8, 13], [12, 14], [15, 15], [18, 18]
        ];
      }

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

  // Event Creation Modal Prefills
  const handleTypeChange = (typeVal: string) => {
    setEventType(typeVal);
    switch (typeVal) {
      case 'Kumbh Mela':
        setEventTitle('Prayagraj Kumbh Mela');
        setEventLocationName('Triveni Sangam Ghat, Prayagraj');
        setEventLatitude('25.4290');
        setEventLongitude('81.8860');
        setEventCapacity('5000');
        setEventGates('12');
        setEventVolunteersReq('250');
        break;
      case 'Cricket Match':
        setEventTitle('IPL T20 Cricket Championship');
        setEventLocationName('Narendra Modi Stadium, Ahmedabad');
        setEventLatitude('23.0919');
        setEventLongitude('72.5976');
        setEventCapacity('2500');
        setEventGates('8');
        setEventVolunteersReq('120');
        break;
      case 'Temple Festival':
        setEventTitle('Sree Padmanabhaswamy Festival');
        setEventLocationName('Padmanabhaswamy Temple Ground, Thiruvananthapuram');
        setEventLatitude('8.4830');
        setEventLongitude('76.9436');
        setEventCapacity('1500');
        setEventGates('6');
        setEventVolunteersReq('80');
        break;
      case 'Concert':
        setEventTitle('Indra Stadium Live Concert');
        setEventLocationName('Indra National Stadium, Chennai');
        setEventLatitude('13.0827');
        setEventLongitude('80.2707');
        setEventCapacity('1000');
        setEventGates('4');
        setEventVolunteersReq('40');
        break;
      case 'Political Rally':
        setEventTitle('National Leadership Rally');
        setEventLocationName('Ramlila Ground, New Delhi');
        setEventLatitude('28.6369');
        setEventLongitude('77.2330');
        setEventCapacity('3000');
        setEventGates('10');
        setEventVolunteersReq('150');
        break;
    }
  };

  // Create Event Form Submit
  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventLocationName) return;
    try {
      setCreatingEvent(true);
      const newEv = await api.createEvent({
        title: eventTitle,
        description: `${eventType} crowd monitoring hub.`,
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
      setIncidentLat(newEv.latitude.toString());
      setIncidentLng(newEv.longitude.toString());
      setLostChildLat(newEv.latitude.toString());
      setLostChildLng(newEv.longitude.toString());
      setRoutingPath([]);
      
      setShowCreateEventModal(false);
    } catch (err) {
      console.error('Error creating event:', err);
    } finally {
      setCreatingEvent(false);
    }
  };

  // Timeline Addition Handler
  const handleAddTimelineLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogContent) return;
    const eventId = selectedEvent?.id || 'default';
    const newEntry = {
      id: Date.now().toString(),
      time: newLogTime,
      log: newLogContent
    };
    
    setTimelineLogs(prev => {
      const currentList = prev[eventId] || prev['default'] || [];
      const updatedList = [...currentList, newEntry].sort((a, b) => a.time.localeCompare(b.time));
      return { ...prev, [eventId]: updatedList };
    });
    setNewLogContent('');
  };

  // Digital Twin Simulator Handler
  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    setTwinSimulating(true);
    setTimeout(() => {
      const crowd = parseInt(twinExpectedCrowd) || 2000;
      const gates = parseInt(twinGatesCount) || 4;
      const cap = parseInt(twinCapacity) || 2000;
      const bottleneck = crowd / (gates * cap * 0.12);
      
      let risk = 'LOW';
      if (bottleneck > 2.0) risk = 'CRITICAL';
      else if (bottleneck > 1.3) risk = 'HIGH';
      else if (bottleneck > 0.8) risk = 'MEDIUM';

      const zones = [
        { name: 'Entrance Corridor A', status: bottleneck > 1.8 ? 'CRITICAL Hotspot' : 'Secure Flow', val: bottleneck > 1.8 ? 'danger' : 'safe' },
        { name: 'Central Seating Arena', status: bottleneck > 1.3 ? 'HIGH Crowding' : 'Optimal Capacity', val: bottleneck > 1.3 ? 'warning' : 'safe' },
        { name: 'Emergency Access Gate 2', status: 'Clear Exit Vector', val: 'safe' },
        { name: 'Food Court Transit Way', status: bottleneck > 1.5 ? 'Sector Bottleneck' : 'Steady Flow', val: bottleneck > 1.5 ? 'danger' : 'safe' }
      ];

      setTwinResult({
        bottleneckScore: parseFloat(bottleneck.toFixed(2)),
        evacuationFlow: gates * 55, // people/min
        riskLevel: risk,
        zones
      });
      setTwinSimulating(false);
    }, 1200);
  };

  // Lost Child Amber Alert Register Handler
  const handleRegisterLostChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lostChildName || !lostChildDesc) return;
    const newChild = {
      id: Date.now().toString(),
      name: lostChildName,
      age: parseInt(lostChildAge) || 8,
      description: lostChildDesc,
      lastSeen: lostChildLastSeen || 'Main gates entrance',
      latitude: parseFloat(lostChildLat) || (selectedEvent?.latitude || 13.0827),
      longitude: parseFloat(lostChildLng) || (selectedEvent?.longitude || 80.2707),
      status: 'SEARCHING'
    };

    setLostChildren(prev => [newChild, ...prev]);
    
    // Add child alert to the notifications feed
    setAlerts(prev => [
      {
        id: Date.now().toString(),
        title: `AMBER ALERT: Missing Child`,
        description: `Name: ${newChild.name} (${newChild.age}y). Last Area: ${newChild.lastSeen}. Desc: ${newChild.description}`,
        createdAt: new Date().toISOString(),
        isResolved: false
      },
      ...prev
    ]);

    setLostChildName('');
    setLostChildAge('');
    setLostChildDesc('');
    setLostChildLastSeen('');
  };

  const handleMarkChildFound = (childId: string) => {
    setLostChildren(prev => prev.map(c => c.id === childId ? { ...c, status: 'FOUND' } : c));
  };

  // Reports Exporter Handler
  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReportsGenerating(true);
    setTimeout(() => {
      const newReport = {
        id: `rep-${Date.now()}`,
        name: `${reportType === 'daily_summary' ? 'Daily Incident Summary' : reportType === 'crowd_audit' ? 'Post-Event Crowd Audit' : 'Volunteer Dispatch Log'} - ${selectedEvent?.title || 'Sector'}`,
        format: reportFormat,
        timestamp: new Date().toLocaleString(),
        hash: `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      };
      setReportsArchive(prev => [newReport, ...prev]);
      setReportsGenerating(false);
    }, 1500);
  };

  // Floating AI Chat Assistant Reply Generator
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, time: new Date().toLocaleTimeString() }]);
    setChatInput('');

    setTimeout(() => {
      let reply = '';
      const inputLower = userMsg.toLowerCase();
      
      if (inputLower.includes('crowd') || inputLower.includes('count') || inputLower.includes('how many')) {
        reply = `The currently selected sector "${selectedEvent?.title || 'Active Sector'}" has a live crowd count of ${liveCount} people, with a target capacity of ${selectedEvent?.capacity || 1000}. The live risk state is ${liveRisk || 'LOW'}.`;
      } else if (inputLower.includes('sos') || inputLower.includes('emergency') || inputLower.includes('incident')) {
        const activeSos = sosRequests.filter(s => s.status !== 'RESOLVED').length;
        reply = `There are currently ${activeSos} active SOS signals on the telemetry grid and ${incidents.length} total incidents logged. Evacuation routes can be resolved instantly on the overview panel.`;
      } else if (inputLower.includes('volunteer') || inputLower.includes('who is available')) {
        const availVols = volunteers.filter(v => v.status === 'AVAILABLE').length;
        reply = `We have ${volunteers.length} total volunteers. Current live status maps ${availVols} as AVAILABLE. You can assign them using the Volunteers Dispatch panel.`;
      } else if (inputLower.includes('twin') || inputLower.includes('simulation') || inputLower.includes('bottleneck')) {
        reply = `I recommend heading to the "Twin Simulator" tab where you can enter anticipated attendee numbers and gate values to simulate crowd bottlenecks and danger zone vector flows.`;
      } else if (inputLower.includes('child') || inputLower.includes('lost') || inputLower.includes('amber')) {
        reply = `You can register and display missing children in the "Lost Child" tab. It plots a pink locator pin onto the MapComponent and broadcasts a marquee alert.`;
      } else {
        reply = `Copy that. Selected sector is operating under ${liveRisk || 'LOW'} risk parameters. Coordinates: ${selectedEvent?.latitude}, ${selectedEvent?.longitude}. How can I assist you with crowd safety protocols?`;
      }

      setChatMessages(prev => [...prev, { sender: 'ai', text: reply, time: new Date().toLocaleTimeString() }]);
    }, 700);
  };

  // Helper colors for status
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  // Diagnostic loading overlay view
  if (hudLoading) {
    return (
      <div className="min-h-screen bg-[#050508] text-zinc-100 flex items-center justify-center relative overflow-hidden font-mono">
        <div className="cyber-scanline" />
        <div className="scan-line" />
        
        <div className="max-w-xl w-full p-8 rounded-2xl border border-teal-500/25 bg-zinc-950/80 shadow-glow-blue relative z-20 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-teal-500/20 pb-4">
            <span className="font-extrabold text-glow-blue text-sm uppercase tracking-widest">// INDRANETRA SECURE HUD INITIALIZATION //</span>
            <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
          </div>

          <div className="space-y-2 h-44 overflow-y-auto pr-2 text-xs text-zinc-400 select-none">
            {loadingLogs.map((log, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.15 }}
                className={index === loadingLogs.length - 1 ? 'text-teal-400 font-bold' : ''}
              >
                {log}
              </motion.div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider">
              <span>Calibrating Sensors</span>
              <span className="font-bold text-zinc-300">{loadingProgress}%</span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
              <motion.div 
                className="bg-teal-600 h-full shadow-glow-blue" 
                style={{ width: `${loadingProgress}%` }}
                transition={{ ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ticker items marquee text setup
  const tickerItems = [
    `⚠️ [CRITICAL] Density threshold triggered in Gate 1 | Density: ${(liveDensity || 3.12).toFixed(2)}/m²`,
    `ℹ️ [INFO] Volunteer Dispatch Queue active: ${volunteers.filter(v => v.status === 'AVAILABLE').length} standing by`,
    `🔔 [ALERT] Risk assessed: ${liveRisk || 'LOW'} | Neural net confidence: 94.2%`,
    `⚠️ [WARNING] Bottleneck index on Twin Simulator reached threshold for Expected Crowd`,
    `🔴 [EMERGENCY] SOS Signal registered. A* Pathfinding route updated on Tactical Map`,
    `🟢 [INFO] Evacuation vectors cleared. Safe vector directions published to officer channels`
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#050508] text-zinc-100 flex flex-col relative"
    >
      <div className="cyber-scanline" />

      {/* Top Scrolling Alert Ticker Marquee */}
      <div className="ticker-wrap w-full bg-red-950/20 border-b border-red-500/10 py-1.5 px-4 text-xs font-mono text-red-400 select-none overflow-hidden relative z-50">
        <div className="ticker-content inline-block whitespace-nowrap animate-ticker">
          {tickerItems.concat(tickerItems).map((item, idx) => (
            <span key={idx} className="mx-12 font-bold tracking-wider inline-flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" /> {item}
            </span>
          ))}
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Unified Sidebar Navigation */}
        <aside className="w-64 bg-zinc-955/90 border-r border-zinc-900 p-5 flex flex-col justify-between relative z-30 select-none shrink-0 hidden md:flex">
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-5">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/30"
              >
                <Eye className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <span className="font-extrabold text-sm text-white tracking-tight block">INDRA<span className="text-teal-500">NETRA</span></span>
                <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase block">// COMMAND HUD V3</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1">
              {[
                { id: 'overview', label: 'Overview HUD', icon: Activity },
                { id: 'monitoring', label: 'Live Cameras', icon: Camera },
                { id: 'events', label: 'Events & Timeline', icon: Calendar },
                { id: 'analytics', label: 'Intel Analytics', icon: BarChart3 },
                { id: 'emergency', label: 'SOS Command', icon: ShieldAlert },
                { id: 'volunteers', label: 'Volunteer Dispatch', icon: Users },
                { id: 'ai_center', label: 'AI Prediction Hub', icon: Brain },
                { id: 'digital_twin', label: 'Twin Simulation', icon: Cpu },
                { id: 'lost_child', label: 'Lost Child Alert', icon: Search },
                { id: 'reports', label: 'Tactical Exporter', icon: FileText },
                { id: 'settings', label: 'System Settings', icon: Sliders },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide border transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-teal-600/10 border-teal-500/30 text-teal-400 shadow-glow-blue' 
                        : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400 animate-pulse' : 'text-zinc-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User profile footer info */}
          <div className="border-t border-zinc-900 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">OFFICER ON DUY</span>
                <span className="text-xs font-bold text-white max-w-[140px] truncate">{user?.name || 'Officer'}</span>
              </div>
              <span className="text-[9px] text-teal-400 font-bold px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/25 uppercase font-mono tracking-wider">
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-900 hover:bg-red-950/20 border border-zinc-800 hover:border-red-900/30 text-zinc-400 hover:text-red-400 text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-6 relative z-10 space-y-6">
          
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/40 border border-zinc-900 p-4 rounded-2xl">
            <div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">// Active Monitoring Sector</div>
              <div className="flex items-center gap-3">
                <select
                  className="bg-transparent border-0 font-extrabold text-xl text-white focus:outline-none focus:ring-0 p-0 pr-8 cursor-pointer hover:text-teal-400 transition-colors"
                  value={selectedEvent?.id || ''}
                  onChange={(e) => {
                    const ev = events.find(event => event.id === e.target.value);
                    setSelectedEvent(ev);
                    if (ev) {
                      setIncidentLat(ev.latitude.toString());
                      setIncidentLng(ev.longitude.toString());
                      setLostChildLat(ev.latitude.toString());
                      setLostChildLng(ev.longitude.toString());
                      setRoutingPath([]);
                    }
                  }}
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id} className="bg-zinc-950 text-white font-semibold">{e.title}</option>
                  ))}
                </select>
                <div className="text-xs text-zinc-400 flex items-center gap-2 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-teal-500 animate-bounce" /> {selectedEvent?.locationName || 'Unknown Venue'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-start">
              {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                <button
                  onClick={() => setShowCreateEventModal(true)}
                  className="px-4 py-2 rounded-xl border border-teal-500/30 bg-teal-600/10 hover:bg-teal-600/20 text-teal-400 text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  + Create Event
                </button>
              )}
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl relative overflow-hidden">
                <span className="w-2 h-2 rounded-full bg-emerald-500 relative flex items-center justify-center">
                  <span className="radar-ping bg-emerald-500" />
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 font-mono">LIVE TELEMETRY SYNCED</span>
              </div>
            </div>
          </div>

          {/* Active View Router */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* Tab: Overview (Baseline Command Console) */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column (Span 8) */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Status metrics grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/70 hover:border-zinc-800 transition-all">
                        <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1.5 font-mono">Crowd Size</div>
                        <div className="text-2xl font-black text-white text-glow-blue">{liveCount || '0'}</div>
                        <div className="text-[8px] text-zinc-500 mt-2 font-mono">CAPACITY: {selectedEvent?.capacity || 1000}</div>
                      </div>

                      <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/70 hover:border-zinc-800 transition-all">
                        <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1.5 font-mono">Density Index</div>
                        <div className="text-2xl font-black text-white text-glow-blue">{liveDensity ? liveDensity.toFixed(2) : '0.00'}<span className="text-[8px] text-zinc-500 font-medium">/m²</span></div>
                        <div className="text-[8px] text-zinc-500 mt-2 font-mono">THRESHOLD: {settingsThreshold}</div>
                      </div>

                      <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/70 hover:border-zinc-800 transition-all">
                        <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1.5 font-mono">Risk Assessed</div>
                        <div className={`text-xs font-black px-2 py-0.5 rounded border text-center ${getRiskColor(liveRisk)}`}>
                          {liveRisk}
                        </div>
                        <div className="text-[8px] text-zinc-500 mt-2.5 font-mono">ALGO: LSTM</div>
                      </div>

                      <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/70 hover:border-zinc-800 transition-all">
                        <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1.5 font-mono">Active Alerts</div>
                        <div className="text-2xl font-black text-red-500 text-glow-red">{alerts.filter(a => !a.isResolved).length}</div>
                        <div className="text-[8px] text-zinc-500 mt-2 font-mono">TOTAL LOGS: {alerts.length}</div>
                      </div>

                      <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/70 hover:border-zinc-800 transition-all">
                        <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1.5 font-mono">Entry Gates</div>
                        <div className="text-2xl font-black text-white text-glow-blue">{selectedEvent?.gatesCount || 4}</div>
                        <div className="text-[8px] text-zinc-500 mt-2 font-mono">VECTORS ACTIVE</div>
                      </div>

                      <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/70 hover:border-zinc-800 transition-all">
                        <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1.5 font-mono">Volunteers</div>
                        <div className="text-2xl font-black text-emerald-400 text-glow-emerald">
                          {volunteers.filter(v => v.status === 'AVAILABLE' || v.status === 'ASSIGNED').length} <span className="text-[10px] text-zinc-600">/ {selectedEvent?.volunteersCount || 0}</span>
                        </div>
                        <div className="text-[8px] text-zinc-500 mt-2 font-mono">STATUS: DEPLOYED</div>
                      </div>
                    </div>

                    {/* Leaflet Tactical Map component */}
                    <div className="p-4 rounded-2xl border border-zinc-900 bg-zinc-950/80 relative overflow-hidden">
                      <div className="scan-line" />
                      <div className="flex justify-between items-center mb-4 relative z-10">
                        <span className="font-bold text-xs text-zinc-300 flex items-center gap-2 font-mono uppercase tracking-wider">
                          <Radio className="w-4 h-4 text-red-500 animate-pulse" /> Live Tactical Map HUD
                        </span>
                        
                        {(user?.role === 'ADMIN' || user?.role === 'POLICE') && (
                          <button 
                            onClick={handleSolveRoute}
                            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 hover:shadow-glow-emerald text-white text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer border border-emerald-500/20"
                          >
                            <Navigation className="w-3.5 h-3.5 animate-pulse" /> Evacuation Route
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
                            lostChildren={lostChildren.filter(c => c.status === 'SEARCHING')}
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
                            <span>[PATH RESOLVED]: Safe evacuation vectors calculated. Direct attendees away from congested sectors.</span>
                            <button onClick={() => setRoutingPath([])} className="underline hover:text-emerald-300 font-bold cursor-pointer ml-4 shrink-0">Clear Route</button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Crowd Flow Recharts Line chart */}
                    <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/80">
                      <div className="text-xs font-bold text-zinc-300 mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
                        <TrendingUp className="w-4 h-4 text-teal-500" /> Crowd Trend (Real-time Flow)
                      </div>
                      <div className="h-44 font-mono text-[10px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#121217" />
                            <XAxis dataKey="time" stroke="#52525b" />
                            <YAxis stroke="#52525b" />
                            <Tooltip 
                              contentStyle={{ backgroundColor: 'rgba(10, 10, 14, 0.95)', borderColor: 'rgba(59, 130, 246, 0.2)', borderRadius: '12px', fontSize: 10 }}
                              labelStyle={{ color: '#fafafa', fontWeight: 'bold' }}
                            />
                            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (Span 4) */}
                  <div className="lg:col-span-4 space-y-6">
                    
                    {/* Distress buttons / status controls based on user role */}
                    {user?.role === 'PUBLIC_USER' && (
                      <div className="p-5 rounded-2xl border border-red-500/15 bg-zinc-950/90 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-2xl" />
                        <h3 className="font-extrabold text-sm text-white mb-1 tracking-tight">Public Emergency Alert</h3>
                        <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed font-mono">// Instantly request medical, security, or stampede safety assistance.</p>
                        
                        <button
                          onClick={() => handleTriggerSOS('STAMPEDE_RISK')}
                          disabled={sosSubmitted}
                          className={`w-28 h-28 rounded-full border-8 border-red-500/15 bg-red-600 text-white font-black text-xl shadow-lg transition-all active:scale-90 flex flex-col justify-center items-center gap-1.5 mx-auto cursor-pointer relative ${sosSubmitted ? 'opacity-70 border-zinc-800 bg-zinc-800' : 'pulse-sos hover:bg-red-500'}`}
                        >
                          {sosSubmitted ? (
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                          ) : (
                            <>
                              <ShieldAlert className="w-8 h-8 text-white animate-bounce" />
                              <span>SOS</span>
                            </>
                          )}
                        </button>
                        <div className="text-[9px] text-zinc-500 mt-4 font-mono">
                          {sosSubmitted ? '[TRANSMISSION SENT] Dispatchers Notified' : 'Tapping transmits coordinates.'}
                        </div>
                      </div>
                    )}

                    {user?.role === 'VOLUNTEER' && (
                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/85">
                        <h3 className="font-bold text-xs text-zinc-300 mb-3 font-mono uppercase tracking-wider">Dispatch Status</h3>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {['AVAILABLE', 'ASSIGNED', 'INACTIVE'].map((status) => {
                            const isSelected = volunteers.find(v => v.userId === user?.id)?.status === status;
                            return (
                              <button
                                key={status}
                                onClick={() => handleToggleVolunteerStatus(status)}
                                className={`py-1.5 rounded-xl text-[10px] font-bold border text-center transition-all cursor-pointer ${isSelected ? 'bg-teal-600 border-teal-500 text-white shadow-glow-blue' : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white'}`}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                        <div className="p-3.5 rounded-xl border border-teal-500/10 bg-teal-500/5 text-[11px] text-zinc-400 leading-relaxed font-mono">
                          <span className="font-bold text-white block mb-0.5 uppercase tracking-wider">// TELEMETRY CHANNEL ACTIVE</span>
                          Keep window open to stream live GPS coordinates to the tactical map control.
                        </div>
                      </div>
                    )}

                    {/* Public Incident report form */}
                    {user?.role === 'PUBLIC_USER' && (
                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/80">
                        <h3 className="font-bold text-xs text-zinc-300 mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                          <Send className="w-3.5 h-3.5 text-teal-500" /> Report Anomaly
                        </h3>
                        <form onSubmit={handleReportIncident} className="space-y-3">
                          <div>
                            <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">Title</label>
                            <input 
                              type="text" 
                              required
                              placeholder="e.g. Broken barricade at gate"
                              className="w-full px-3 py-2 rounded-lg border border-zinc-855 bg-zinc-900/40 text-xs text-white focus:outline-none focus:border-teal-500 focus:shadow-glow-blue transition-all"
                              value={incidentTitle}
                              onChange={(e) => setIncidentTitle(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">Details</label>
                            <textarea 
                              required
                              rows={2}
                              placeholder="Describe obstruction, density hotspots, or injury details..."
                              className="w-full px-3 py-2 rounded-lg border border-zinc-855 bg-zinc-900/40 text-xs text-white focus:outline-none focus:border-teal-500 focus:shadow-glow-blue transition-all resize-none"
                              value={incidentDesc}
                              onChange={(e) => setIncidentDesc(e.target.value)}
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white transition-all hover:shadow-glow-blue cursor-pointer"
                          >
                            Send Report
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Camera Feed Upload Portal */}
                    {(user?.role === 'ADMIN' || user?.role === 'POLICE' || user?.role === 'ORGANIZER') && (
                      <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/90 relative overflow-hidden">
                        <h3 className="font-bold text-xs text-zinc-300 mb-1 flex items-center gap-2 font-mono uppercase tracking-wider">
                          <Camera className="w-3.5 h-3.5 text-teal-500" /> AI Video Feed Input
                        </h3>
                        <p className="text-[10px] text-zinc-500 mb-3.5 font-mono">// Upload frames to trigger YOLOv8 object count and density inferences</p>
                        
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
                            className="w-full py-4 border border-dashed border-zinc-800 hover:border-teal-500/40 rounded-xl flex flex-col justify-center items-center gap-1.5 hover:bg-zinc-900/20 transition-all cursor-pointer"
                          >
                            <Camera className="w-5 h-5 text-zinc-400 animate-pulse" />
                            <span className="text-[11px] text-zinc-300 font-bold">{uploadingFrame ? 'Inference computing...' : 'Upload Feed Frame'}</span>
                          </label>
                        </div>

                        {liveHeatmap && (
                          <div className="mt-3 p-2 rounded-xl border border-zinc-900 bg-zinc-950/80 relative overflow-hidden group">
                            <div className="scan-line" />
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5 font-mono">// AI Density Segment Map</span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={liveHeatmap} alt="AI Heatmap" className="w-full rounded-lg border border-zinc-900" />
                          </div>
                        )}

                        {analysisResult && (
                          <div className="mt-3 p-3.5 rounded-xl border border-teal-500/20 bg-teal-500/5 text-xs text-zinc-300 space-y-1.5 font-mono">
                            <div className="font-bold text-white border-b border-teal-500/20 pb-1 mb-1 font-sans tracking-wide uppercase">YOLO Inference Metrics</div>
                            <div>Detected Targets: <span className="text-white font-bold">{analysisResult.people_count}</span></div>
                            <div>Density Score: <span className="text-white font-bold">{analysisResult.density_score}</span></div>
                            <div>Assessment: <span className="text-white font-bold text-glow-blue">{analysisResult.risk_level} ({Math.round(analysisResult.confidence * 100)}%)</span></div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Active SOS signals feed */}
                    <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/80">
                      <h3 className="font-bold text-xs text-zinc-300 mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                        <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" /> SOS Signals ({sosRequests.length})
                      </h3>
                      
                      {sosRequests.length === 0 ? (
                        <div className="text-center p-5 border border-zinc-900/60 rounded-xl bg-zinc-950/20 text-xs text-zinc-500 font-mono">
                          [NO ACTIVE EMERGENCIES]
                        </div>
                      ) : (
                        <div className="space-y-3.5 max-h-52 overflow-y-auto pr-1">
                          <AnimatePresence initial={false}>
                            {sosRequests.map((sos) => (
                              <motion.div 
                                key={sos.id}
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="p-3.5 rounded-xl border border-red-500/25 bg-red-500/5 text-xs relative overflow-hidden flex flex-col gap-1.5 shadow-glow-red"
                              >
                                <div className="absolute top-0 right-0 w-1 h-full bg-red-500" />
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-white uppercase text-[8px] bg-red-500/25 px-2 py-0.5 rounded-full border border-red-500/35 font-mono">
                                    {sos.issueType}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 font-mono">{new Date(sos.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <div className="text-zinc-300 text-xs font-bold">{sos.user?.name || 'Public User'}</div>
                                <p className="text-zinc-400 text-[11px] leading-relaxed font-mono">{sos.description || 'Emergency assistance requested'}</p>
                                
                                {(user?.role === 'ADMIN' || user?.role === 'POLICE' || user?.role === 'VOLUNTEER') && (
                                  <button
                                    onClick={() => handleResolveSOS(sos.id)}
                                    className="mt-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 hover:shadow-glow-emerald text-white font-extrabold text-[9px] flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer border border-emerald-500/20"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Mark Resolved
                                  </button>
                                )}
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* Incidents report feed */}
                    <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/80">
                      <h3 className="font-bold text-xs text-zinc-300 mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 text-orange-500" /> Incident Feed ({incidents.length})
                      </h3>
                      
                      {incidents.length === 0 ? (
                        <div className="text-center p-5 border border-zinc-900/60 rounded-xl bg-zinc-950/20 text-xs text-zinc-500 font-mono">
                          [NO ANOMALIES LOGGED]
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                          <AnimatePresence initial={false}>
                            {incidents.map((inc) => (
                              <motion.div 
                                key={inc.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="p-3.5 rounded-xl border border-zinc-900 bg-zinc-900/10 hover:border-zinc-800 transition-colors text-xs"
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-bold text-zinc-200">{inc.title}</span>
                                  <span className="text-[10px] text-zinc-500 font-mono">{new Date(inc.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-zinc-400 text-[10px] mb-2 leading-relaxed font-mono">{inc.description}</p>
                                <div className="flex justify-between items-center text-[9px] text-zinc-500 border-t border-zinc-900/50 pt-1.5 mt-1.5 font-mono">
                                  <span>REPORTER: {inc.user?.name || 'Anonymous'}</span>
                                  <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5 text-teal-500" /> {inc.latitude.toFixed(3)}, {inc.longitude.toFixed(3)}</span>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Monitoring Center */}
              {activeTab === 'monitoring' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { id: 'cam1', name: 'Cam #01: Entrance Gate North', loc: 'Entry vector 1', density: liveDensity * 0.9, count: Math.round(liveCount * 0.35) },
                      { id: 'cam2', name: 'Cam #02: Stage Corridor', loc: 'Main assembly point', density: liveDensity * 1.25, count: Math.round(liveCount * 0.45) },
                      { id: 'cam3', name: 'Cam #03: South Exit Corridor', loc: 'Escape route sector', density: liveDensity * 0.6, count: Math.round(liveCount * 0.12) },
                      { id: 'cam4', name: 'Cam #04: Food Pavilion Area', loc: 'Rest transit point', density: liveDensity * 0.8, count: Math.round(liveCount * 0.08) },
                    ].map((cam) => (
                      <div key={cam.id} className="rounded-2xl border border-zinc-900 bg-zinc-950/90 overflow-hidden relative group shadow-lg hover:border-teal-500/25 transition-all">
                        {/* Interactive Scanlines overlay */}
                        <div className="absolute inset-0 bg-zinc-950/20 pointer-events-none z-10" />
                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.01)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px] pointer-events-none z-10" />
                        <div className="radar-sweep" />

                        {/* Scanner HUD Overlay */}
                        <div className="p-4 border-b border-zinc-900 bg-zinc-900/25 flex justify-between items-center relative z-20">
                          <div>
                            <span className="font-mono text-xs font-bold text-white block">{cam.name}</span>
                            <span className="text-[9px] text-zinc-500 font-mono block uppercase">Sector: {cam.loc}</span>
                          </div>
                          <button
                            onClick={() => triggerCameraScan(cam.id)}
                            className="px-3 py-1.5 rounded-lg border border-teal-500/20 bg-teal-500/10 hover:bg-teal-600/20 text-teal-400 font-mono text-[9px] font-bold uppercase transition-all cursor-pointer"
                          >
                            {scanningCam === cam.id ? 'Scanning Inference...' : aiDetectedCams[cam.id] ? 'Disable YOLOv8' : 'Run YOLOv8 Scan'}
                          </button>
                        </div>

                        {/* Camera Stream viewport */}
                        <div className="h-56 bg-zinc-900 relative overflow-hidden flex items-center justify-center border-b border-zinc-900">
                          {scanningCam === cam.id && <div className="scan-line" />}
                          <div className="absolute inset-0 grid-bg-pulse opacity-15" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                          
                          <div className="text-center font-mono text-[10px] text-zinc-500 z-10 select-none">
                            <Radio className={`w-6 h-6 mx-auto mb-2 text-zinc-600 ${scanningCam === cam.id ? 'text-teal-500 animate-spin' : ''}`} />
                            [VIDEO STREAM INPUT FEED ACTIVE]
                          </div>

                          {/* Simulated YOLOv8 Bounding Boxes Overlay */}
                          {aiDetectedCams[cam.id] && (
                            <div className="absolute inset-0 z-20 pointer-events-none select-none font-mono">
                              <div className="absolute border-2 border-emerald-500 bg-emerald-500/5 px-1 py-0.5 rounded text-[8px] font-bold text-emerald-400" style={{ top: '25%', left: '20%', width: '60px', height: '100px' }}>
                                person 94%
                              </div>
                              <div className="absolute border-2 border-emerald-500 bg-emerald-500/5 px-1 py-0.5 rounded text-[8px] font-bold text-emerald-400" style={{ top: '35%', left: '45%', width: '55px', height: '90px' }}>
                                person 89%
                              </div>
                              <div className="absolute border-2 border-emerald-500 bg-emerald-500/5 px-1 py-0.5 rounded text-[8px] font-bold text-emerald-400" style={{ top: '15%', left: '65%', width: '65px', height: '110px' }}>
                                person 96%
                              </div>
                              <div className="absolute border-2 border-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded text-[8px] font-bold text-orange-400" style={{ top: '30%', left: '32%', width: '150px', height: '80px' }}>
                                Congestion vector density: {cam.density.toFixed(2)}/m²
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Stream stats overlay */}
                        <div className="p-4 flex justify-between items-center bg-zinc-950/80 relative z-20 text-xs font-mono">
                          <div>
                            <span className="text-zinc-500 uppercase text-[9px] block">LIVE COUNT</span>
                            <span className="font-black text-white">{cam.count} people</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 uppercase text-[9px] block">LOCAL DENSITY</span>
                            <span className="font-black text-white">{cam.density.toFixed(2)}/m²</span>
                          </div>
                          <div className="text-right">
                            <span className="text-zinc-500 uppercase text-[9px] block">VECTOR STATE</span>
                            <span className={`font-bold uppercase ${cam.density > 2.8 ? 'text-red-400' : cam.density > 1.8 ? 'text-orange-400' : 'text-emerald-400'}`}>
                              {cam.density > 2.8 ? 'CRITICAL' : cam.density > 1.8 ? 'HIGH RISK' : 'SECURE'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Manual AI Video Feed Input frame uploader inside Monitoring */}
                  <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/80">
                    <h3 className="font-bold text-xs text-zinc-300 mb-2 font-mono uppercase tracking-wider">Manual Frame Diagnostic Inference</h3>
                    <p className="text-[10px] text-zinc-500 mb-4 font-mono">// Force upload static frame snapshots to resolve exact density mappings.</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleCameraFrameUpload}
                        disabled={uploadingFrame}
                        className="hidden"
                        id="monitoring-diagnostic-upload"
                      />
                      <label 
                        htmlFor="monitoring-diagnostic-upload"
                        className="w-full sm:w-64 py-5 border border-dashed border-zinc-800 hover:border-teal-500/40 rounded-xl flex flex-col justify-center items-center gap-1.5 hover:bg-zinc-900/20 transition-all cursor-pointer shrink-0"
                      >
                        <Camera className="w-5 h-5 text-zinc-400" />
                        <span className="text-[11px] text-zinc-300 font-bold">{uploadingFrame ? 'Inference computing...' : 'Diagnose frame'}</span>
                      </label>

                      {analysisResult && (
                        <div className="flex-1 p-4 rounded-xl border border-teal-500/25 bg-teal-500/5 text-xs text-zinc-300 grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                          <div>
                            <span className="text-[9px] text-zinc-500 uppercase block">People Count</span>
                            <span className="font-extrabold text-white">{analysisResult.people_count}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-500 uppercase block">Density Score</span>
                            <span className="font-extrabold text-white">{analysisResult.density_score}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-500 uppercase block">Calculated Risk</span>
                            <span className="font-extrabold text-glow-blue text-white">{analysisResult.risk_level}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-500 uppercase block">Confidence index</span>
                            <span className="font-extrabold text-white">{Math.round(analysisResult.confidence * 100)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Events & Timeline */}
              {activeTab === 'events' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
                  
                  {/* Event Details Panel (Left Column Span 5) */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/80 space-y-4">
                      <h3 className="font-bold text-sm text-zinc-300 border-b border-zinc-900 pb-3 uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-teal-500" /> Event Parameters
                      </h3>
                      
                      <div className="space-y-3.5">
                        <div>
                          <span className="text-zinc-500 text-[9px] uppercase tracking-wider block">Event Title</span>
                          <span className="text-sm font-extrabold text-white block">{selectedEvent?.title}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 text-[9px] uppercase tracking-wider block">Description</span>
                          <span className="text-zinc-300 block">{selectedEvent?.description || 'No description provided.'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-zinc-500 text-[9px] uppercase tracking-wider block">Venue Name</span>
                            <span className="text-zinc-300 block font-bold">{selectedEvent?.locationName}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-[9px] uppercase tracking-wider block">Capacity Max</span>
                            <span className="text-zinc-300 block font-bold">{selectedEvent?.capacity || 1000} people</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <span className="text-zinc-500 text-[9px] uppercase tracking-wider block">Gates Count</span>
                            <span className="text-zinc-300 block font-bold">{selectedEvent?.gatesCount || 4} entryways</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-[9px] uppercase tracking-wider block">Volunteers Req</span>
                            <span className="text-zinc-300 block font-bold">{selectedEvent?.volunteersCount || 40} targets</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-[9px] uppercase tracking-wider block">Coordinates</span>
                            <span className="text-zinc-400 block font-bold">{(selectedEvent?.latitude || 0).toFixed(4)}, {(selectedEvent?.longitude || 0).toFixed(4)}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-zinc-900 pt-3">
                          <div>
                            <span className="text-zinc-500 text-[9px] uppercase tracking-wider block">Start Date/Time</span>
                            <span className="text-zinc-400 block">{selectedEvent ? new Date(selectedEvent.startDate).toLocaleString() : '-'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-[9px] uppercase tracking-wider block">End Date/Time</span>
                            <span className="text-zinc-400 block">{selectedEvent ? new Date(selectedEvent.endDate).toLocaleString() : '-'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Event Timeline Logs (Right Column Span 7) */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/80 flex flex-col gap-5">
                      <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                        <h3 className="font-bold text-sm text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                          <Clock className="w-4 h-4 text-teal-500" /> Event Timeline Log
                        </h3>
                        <span className="text-[10px] text-zinc-500">// Real-time incident logs</span>
                      </div>

                      {/* Add timeline logs input form */}
                      {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                        <form onSubmit={handleAddTimelineLog} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 rounded-xl border border-zinc-900 bg-zinc-900/20">
                          <div className="sm:col-span-3">
                            <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Time</label>
                            <input 
                              type="text" 
                              required
                              placeholder="e.g. 13:00"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:outline-none focus:border-teal-500"
                              value={newLogTime}
                              onChange={(e) => setNewLogTime(e.target.value)}
                            />
                          </div>
                          <div className="sm:col-span-7">
                            <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Timeline Content Log</label>
                            <input 
                              type="text" 
                              required
                              placeholder="Describe crowd state transitions or operations..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:outline-none focus:border-teal-500"
                              value={newLogContent}
                              onChange={(e) => setNewLogContent(e.target.value)}
                            />
                          </div>
                          <div className="sm:col-span-2 flex items-end">
                            <button
                              type="submit"
                              className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer transition-all"
                            >
                              Add Log
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Render Timeline vertical lines list */}
                      <div className="relative border-l border-zinc-800 pl-6 space-y-5 py-2">
                        {(timelineLogs[selectedEvent?.id || 'default'] || timelineLogs['default']).map((log) => (
                          <div key={log.id} className="relative">
                            <span className="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full bg-teal-500 border border-[#050508]" />
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 text-[10px]">{log.time}</span>
                              <span className="text-zinc-500 text-[9px]">// Log Recorded</span>
                            </div>
                            <p className="text-zinc-300 text-xs leading-relaxed font-mono">{log.log}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Intelligence Analytics */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  
                  {/* Performance stats summaries */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {[
                      { name: 'Incident Resolution Efficiency', value: '98.2%', state: 'OPTIONAL' },
                      { name: 'Average Dispatch Lag Time', value: '3.45 min', state: 'SECURE' },
                      { name: 'Average Density Margin', value: '1.42/m²', state: 'SECURE' },
                      { name: 'Co-efficient Flow Index', value: '1.18', state: 'STEADY' }
                    ].map((stat, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/80">
                        <span className="text-zinc-500 text-[9px] uppercase tracking-wider font-mono block mb-1">{stat.name}</span>
                        <span className="text-xl font-black text-white block">{stat.value}</span>
                        <span className="text-[8px] text-emerald-400 font-mono mt-1 block">STATUS: {stat.state}</span>
                      </div>
                    ))}
                  </div>

                  {/* Recharts Grid (Area, Bar, and Line) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Area Chart: Expected vs Actual Crowd growth */}
                    <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/80">
                      <h4 className="font-bold text-xs text-zinc-300 mb-4 font-mono uppercase tracking-wider">Anticipated vs Actual Capacity Growth</h4>
                      <div className="h-56 font-mono text-[9px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={[
                            { hour: '08:00', actual: 400, expected: 500 },
                            { hour: '10:00', actual: 1100, expected: 1200 },
                            { hour: '12:00', actual: 1900, expected: 1800 },
                            { hour: '14:00', actual: 2350, expected: 2500 },
                            { hour: '16:00', actual: 2100, expected: 2200 },
                          ]}>
                            <defs>
                              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#121217" />
                            <XAxis dataKey="hour" stroke="#52525b" />
                            <YAxis stroke="#52525b" />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(10,10,14,0.95)', borderColor: 'rgba(59,130,246,0.2)' }} />
                            <Legend />
                            <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#actualGrad)" />
                            <Area type="monotone" dataKey="expected" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#expGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Bar Chart: Incidents breakdown by Category */}
                    <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/80">
                      <h4 className="font-bold text-xs text-zinc-300 mb-4 font-mono uppercase tracking-wider">Incidents count by Category</h4>
                      <div className="h-56 font-mono text-[9px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { type: 'STAMPEDE', count: 2 },
                            { type: 'MEDICAL', count: 5 },
                            { type: 'FIRE', count: 0 },
                            { type: 'LOST CHILD', count: lostChildren.length },
                            { type: 'BARRICADE', count: incidents.length },
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#121217" />
                            <XAxis dataKey="type" stroke="#52525b" />
                            <YAxis stroke="#52525b" />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(10,10,14,0.95)', borderColor: 'rgba(59,130,246,0.2)' }} />
                            <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: SOS Command Center */}
              {activeTab === 'emergency' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
                  
                  {/* SOS queue left side (Span 6) */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/80 flex flex-col gap-4">
                      <h3 className="font-bold text-sm text-zinc-300 uppercase tracking-wider">SOS Emergency Priority Queue</h3>
                      
                      {sosRequests.length === 0 ? (
                        <div className="text-center py-12 border border-zinc-900/60 rounded-xl bg-zinc-950/20 text-zinc-500">
                          [NO PENDING DISTRESS SIGNALS REGISTERED]
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sosRequests.map((sos) => (
                            <div 
                              key={sos.id}
                              onClick={() => setDispatchSosId(sos.id)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                                dispatchSosId === sos.id 
                                  ? 'bg-red-500/10 border-red-500 shadow-glow-red' 
                                  : 'bg-zinc-900/30 border-zinc-900 hover:border-zinc-800'
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-[8px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 uppercase">
                                    {sos.issueType}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 font-bold">{sos.status || 'PENDING'}</span>
                                </div>
                                <div className="text-zinc-200 text-xs font-bold">{sos.user?.name || 'Anonymous Sender'}</div>
                                <p className="text-zinc-400 text-[10px] leading-relaxed">{sos.description || 'Distress coordinates recorded'}</p>
                              </div>
                              <span className="text-zinc-500 text-[10px] shrink-0 font-bold ml-4">{new Date(sos.createdAt).toLocaleTimeString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dispatch workflow tracker right side (Span 6) */}
                  <div className="lg:col-span-6 space-y-4">
                    {dispatchSosId ? (
                      (() => {
                        const activeSos = sosRequests.find(s => s.id === dispatchSosId);
                        if (!activeSos) return null;
                        const statusVal = activeSos.status || 'PENDING';
                        return (
                          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/80 space-y-6">
                            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                              <span className="font-extrabold text-sm text-white uppercase tracking-wider">// Dispatch Telemetry Node</span>
                              <button onClick={() => setDispatchSosId('')} className="text-zinc-500 hover:text-white font-bold cursor-pointer">[CLOSE]</button>
                            </div>

                            {/* Stepper Diagram (Received -> Assigned -> Reached -> Closed) */}
                            <div className="relative py-4 flex justify-between items-center select-none">
                              {/* Horizontal Connecting lines */}
                              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-900 -translate-y-1/2 z-0" />
                              
                              {[
                                { step: 'PENDING', label: 'SOS Received', color: 'bg-teal-500' },
                                { step: 'ASSIGNED', label: 'Assigned', color: 'bg-orange-500' },
                                { step: 'REACHED', label: 'Officer Reached', color: 'bg-yellow-500' },
                                { step: 'RESOLVED', label: 'Case Closed', color: 'bg-emerald-500' },
                              ].map((item, idx) => {
                                const isCurrent = statusVal === item.step;
                                const isPassed = 
                                  (statusVal === 'ASSIGNED' && idx === 0) ||
                                  (statusVal === 'REACHED' && (idx === 0 || idx === 1)) ||
                                  (statusVal === 'RESOLVED' && idx <= 2);
                                return (
                                  <div key={item.step} className="relative z-10 flex flex-col items-center gap-1.5">
                                    <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all ${
                                      isCurrent 
                                        ? `border-white ${item.color} shadow-glow-blue scale-110` 
                                        : isPassed 
                                          ? `${item.color} border-zinc-900` 
                                          : 'bg-zinc-950 border-zinc-900 text-zinc-600'
                                    }`}>
                                      {isPassed ? <Check className="w-3.5 h-3.5 text-white" /> : <span className="text-[10px] font-black">{idx + 1}</span>}
                                    </div>
                                    <span className={`text-[8px] uppercase tracking-wider font-bold ${isCurrent ? 'text-white font-black' : 'text-zinc-500'}`}>{item.label}</span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Dispatch status actions */}
                            <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-900 space-y-3">
                              <div className="flex justify-between font-mono text-[10px] text-zinc-500 uppercase">
                                <span>Assigned Responder:</span>
                                <span className="text-white font-bold">{activeSos.assignedVolunteer || 'UNASSIGNED'}</span>
                              </div>
                              
                              <div className="flex gap-3 pt-2">
                                {statusVal === 'PENDING' && (
                                  <button
                                    onClick={() => handleAdvanceSOSStatus(activeSos.id, 'PENDING')}
                                    className="flex-1 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-[10px] uppercase tracking-wider cursor-pointer"
                                  >
                                    Assign Closest Volunteer
                                  </button>
                                )}
                                {statusVal === 'ASSIGNED' && (
                                  <button
                                    onClick={() => handleAdvanceSOSStatus(activeSos.id, 'ASSIGNED')}
                                    className="flex-1 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-zinc-950 font-extrabold text-[10px] uppercase tracking-wider cursor-pointer"
                                  >
                                    Confirm Responder Reached
                                  </button>
                                )}
                                {statusVal === 'REACHED' && (
                                  <button
                                    onClick={() => handleAdvanceSOSStatus(activeSos.id, 'REACHED')}
                                    className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] uppercase tracking-wider cursor-pointer"
                                  >
                                    Close Emergency Case
                                  </button>
                                )}
                                <button
                                  onClick={() => handleResolveSOS(activeSos.id)}
                                  className="py-2 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-bold uppercase text-[9px] cursor-pointer"
                                >
                                  Force Resolve
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="p-6 rounded-2xl border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center py-20 text-zinc-500">
                        <ShieldAlert className="w-8 h-8 text-zinc-600 animate-pulse mb-3" />
                        <span>Select an active SOS alert from the queue to run status dispatches.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Volunteer Dispatch Console */}
              {activeTab === 'volunteers' && (
                <div className="space-y-6 font-mono text-xs">
                  
                  {/* Dispatch workflow selector */}
                  <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/80">
                    <h3 className="font-bold text-xs text-zinc-300 mb-4 uppercase tracking-wider">Manual Volunteer Dispatch Console</h3>
                    <form onSubmit={handleDispatchVolunteerSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1.5">Select Standing Volunteer</label>
                        <select
                          className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:outline-none focus:border-teal-500 cursor-pointer font-bold"
                          value={dispatchVolId}
                          onChange={(e) => setDispatchVolId(e.target.value)}
                        >
                          <option value="">-- Choose Available --</option>
                          {volunteers.map(v => (
                            <option key={v.id} value={v.id}>{v.user?.name || `Responder #${v.id}`} [{v.status}]</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1.5">Link SOS Distress Signal</label>
                        <select
                          className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:outline-none focus:border-teal-500 cursor-pointer font-bold"
                          value={dispatchSosId}
                          onChange={(e) => setDispatchSosId(e.target.value)}
                        >
                          <option value="">-- Select Distress --</option>
                          {sosRequests.map(s => (
                            <option key={s.id} value={s.id}>{s.issueType} by {s.user?.name || 'Anonymous'}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={!dispatchVolId || !dispatchSosId}
                          className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:bg-zinc-800 text-white font-extrabold tracking-wider uppercase text-[10px] cursor-pointer hover:shadow-glow-blue transition-all"
                        >
                          Dispatch Volunteer
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Volunteers Table list */}
                  <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/80">
                    <h3 className="font-bold text-xs text-zinc-300 mb-4 uppercase tracking-wider">Active Volunteers list & Performance Scores</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-900 text-[9px] text-zinc-500 uppercase tracking-wider">
                            <th className="pb-3 font-semibold">Name</th>
                            <th className="pb-3 font-semibold">Role</th>
                            <th className="pb-3 font-semibold">Availability</th>
                            <th className="pb-3 font-semibold text-center">Completed Tasks</th>
                            <th className="pb-3 font-semibold text-center">Response Lag</th>
                            <th className="pb-3 font-semibold text-right">Success Index</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-950 text-xs">
                          {volunteers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-zinc-600">No active volunteers registered.</td>
                            </tr>
                          ) : (
                            volunteers.map((vol) => {
                              // Generate deterministic simulated stats based on ID to look real and robust
                              const idNum = parseInt(vol.id.slice(-3)) || 10;
                              const tasksCount = (idNum % 8) + 3;
                              const responseMins = ((idNum % 4) + 2.5).toFixed(1);
                              const successRate = 95 + (idNum % 5);
                              return (
                                <tr key={vol.id} className="hover:bg-zinc-900/10 transition-colors">
                                  <td className="py-3 font-bold text-zinc-200">{vol.user?.name || `Responder #${vol.id.slice(0,6)}`}</td>
                                  <td className="py-3 text-zinc-400 uppercase text-[10px]">Volunteer</td>
                                  <td className="py-3">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase ${
                                      vol.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                      vol.status === 'ASSIGNED' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 
                                      'bg-zinc-800 text-zinc-500'
                                    }`}>
                                      {vol.status}
                                    </span>
                                  </td>
                                  <td className="py-3 text-center text-zinc-300 font-bold">{tasksCount}</td>
                                  <td className="py-3 text-center text-zinc-300 font-bold">{responseMins} min</td>
                                  <td className="py-3 text-right text-emerald-400 font-bold text-glow-emerald">{successRate}%</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: AI Predictor Hub */}
              {activeTab === 'ai_center' && (
                <div className="space-y-6 font-mono text-xs">
                  
                  {/* Neural Networks HUD stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                      { name: 'YOLOv8 Target Locator', state: 'ONLINE', accuracy: '94.2%', latency: '12ms' },
                      { name: 'LSTM Capacity Forecaster', state: 'ONLINE', accuracy: '89.5%', latency: '25ms' },
                      { name: 'A* Evacuation Route Solver', state: 'STANDBY', accuracy: 'Optimal', latency: '2ms' },
                    ].map((model, idx) => (
                      <div key={idx} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/80 space-y-3">
                        <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block">{model.name}</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-lg font-black text-white">{model.state}</span>
                          <span className="text-[10px] text-zinc-500">Latency: {model.latency}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] border-t border-zinc-900 pt-2 text-zinc-400">
                          <span>Accuracy Metric:</span>
                          <span className="font-bold text-white">{model.accuracy}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recharts Forecast curve */}
                  <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/80">
                    <h3 className="font-bold text-xs text-zinc-300 mb-4 uppercase tracking-wider">Crowd Capacity Forecast Vectors (2hr Interval)</h3>
                    <div className="h-60 text-[9px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                          { time: '12:00', actual: 1200, forecast: 1200 },
                          { time: '13:00', actual: 1600, forecast: 1650 },
                          { time: '14:00', actual: 2100, forecast: 2050 },
                          { time: '15:00', actual: 2450, forecast: 2400 },
                          { time: '16:00', actual: null, forecast: 2800 },
                          { time: '17:00', actual: null, forecast: 3100 },
                          { time: '18:00', actual: null, forecast: 2600 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#121217" />
                          <XAxis dataKey="time" stroke="#52525b" />
                          <YAxis stroke="#52525b" />
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(10,10,14,0.95)', borderColor: 'rgba(59,130,246,0.2)' }} />
                          <Legend />
                          <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6' }} />
                          <Line type="monotone" dataKey="forecast" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#f43f5e' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}



              {/* Tab: Reports Page */}
              {activeTab === 'reports' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
                  
                  {/* Generation form (Left Column Span 5) */}
                  <div className="lg:col-span-5 space-y-6">
                    <form onSubmit={handleGenerateReport} className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/80 space-y-4">
                      <h3 className="font-bold text-xs text-zinc-300 border-b border-zinc-900 pb-3 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-teal-500" /> Export Generator
                      </h3>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Report Data Class</label>
                          <select
                            className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:border-teal-500 cursor-pointer font-bold"
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                          >
                            <option value="daily_summary">Daily Incident Summary Log</option>
                            <option value="crowd_audit">Post-Event Crowd Density Audit</option>
                            <option value="volunteer_logs">Volunteer Performance & Dispatch Log</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">File Format Type</label>
                          <select
                            className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:border-teal-500 cursor-pointer font-bold"
                            value={reportFormat}
                            onChange={(e) => setReportFormat(e.target.value)}
                          >
                            <option value="PDF">Adobe PDF Document (.pdf)</option>
                            <option value="CSV">Comma Separated Values (.csv)</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={reportsGenerating}
                          className="w-full mt-2 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:bg-zinc-800 disabled:opacity-50 text-white font-extrabold uppercase tracking-wider text-[10px] cursor-pointer flex justify-center items-center gap-1.5 transition-all"
                        >
                          {reportsGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                          {reportsGenerating ? 'Compiling structures...' : 'Generate Report'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Generated Archives (Right Column Span 7) */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/80 space-y-4">
                      <h3 className="font-bold text-xs text-zinc-300 border-b border-zinc-900 pb-3 uppercase tracking-wider">// Generated Reports Archive</h3>
                      
                      <div className="divide-y divide-zinc-900">
                        {reportsArchive.map((rep) => (
                          <div key={rep.id} className="py-3.5 flex justify-between items-center gap-4">
                            <div className="space-y-1">
                              <span className="font-extrabold text-xs text-zinc-200 block">{rep.name}</span>
                              <div className="flex gap-3 text-[10px] text-zinc-500">
                                <span>Format: <span className="text-zinc-300 font-bold">{rep.format}</span></span>
                                <span>Hash: <span className="text-zinc-400">{rep.hash}</span></span>
                              </div>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-bold shrink-0">{rep.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Settings Control */}
              {activeTab === 'settings' && (
                <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/80 max-w-xl space-y-6 font-mono text-xs">
                  <h3 className="font-bold text-xs text-zinc-300 border-b border-zinc-900 pb-3 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-teal-500" /> HUD Sensitivity Settings
                  </h3>

                  <div className="space-y-5">
                    
                    {/* Range: Density alarm threshold */}
                    <div className="space-y-2">
                      <div className="flex justify-between uppercase text-[10px] text-zinc-500">
                        <span>Density alarm threshold</span>
                        <span className="font-bold text-zinc-300">{settingsThreshold} people/m²</span>
                      </div>
                      <input 
                        type="range" 
                        min="1.0" 
                        max="8.0" 
                        step="0.1" 
                        className="w-full bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        value={settingsThreshold}
                        onChange={(e) => setSettingsThreshold(parseFloat(e.target.value))}
                      />
                    </div>

                    {/* Range: Alert Dispatch Radius */}
                    <div className="space-y-2">
                      <div className="flex justify-between uppercase text-[10px] text-zinc-500">
                        <span>Incident Dispatch Radius</span>
                        <span className="font-bold text-zinc-300">{settingsRadius} meters</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" 
                        max="500" 
                        step="10" 
                        className="w-full bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        value={settingsRadius}
                        onChange={(e) => setSettingsRadius(parseInt(e.target.value))}
                      />
                    </div>

                    {/* Toggle parameters */}
                    <div className="space-y-4.5 border-t border-zinc-900 pt-4">
                      
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-zinc-400 font-bold">Auto-SMS stand-by Responders</span>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded text-teal-600 bg-zinc-900 border-zinc-800"
                          checked={settingsEnableSMS} 
                          onChange={(e) => setSettingsEnableSMS(e.target.checked)} 
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-zinc-400 font-bold">Flash Red HUD marquee on warnings</span>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded text-teal-600 bg-zinc-900 border-zinc-800"
                          checked={settingsEnableSound} 
                          onChange={(e) => setSettingsEnableSound(e.target.checked)} 
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-zinc-400 font-bold">Auto-Assign nearest Volunteer to SOS</span>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded text-teal-600 bg-zinc-900 border-zinc-800"
                          checked={settingsAutoAssign} 
                          onChange={(e) => setSettingsAutoAssign(e.target.checked)} 
                        />
                      </label>

                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

        </main>
      </div>

      {/* Floating AI Chat Assistant Icon & Panel */}
      <div className="fixed bottom-6 right-6 z-50 font-mono text-xs">
        
        {/* Toggle Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/40 hover:shadow-teal-500/60 transition-all hover:scale-105 active:scale-95 cursor-pointer relative"
        >
          {chatOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
        </button>

        {/* Chat Panel Window */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="absolute bottom-16 right-0 w-80 h-96 rounded-2xl border border-teal-500/20 bg-zinc-950/95 shadow-glow-blue overflow-hidden flex flex-col"
            >
              <div className="p-3.5 border-b border-zinc-900 bg-zinc-900/20 flex justify-between items-center">
                <span className="font-extrabold text-[10px] text-white tracking-widest uppercase">// AI Assistant Hub</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[8px] text-zinc-500 mb-0.5">{msg.time}</span>
                    <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-teal-600 text-white rounded-tr-none' 
                        : 'bg-zinc-900 text-zinc-200 rounded-tl-none border border-zinc-850'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-900 bg-zinc-900/10 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask about live counts, SOS, etc..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:outline-none focus:border-teal-500"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer transition-all active:scale-95"
                >
                  Send
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateEventModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg p-6 rounded-2xl border border-teal-500/20 bg-zinc-950/95 shadow-glow-blue relative overflow-hidden max-h-[90vh] overflow-y-auto font-mono text-xs"
            >
              <div className="scan-line" />
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-5">
                <span className="font-extrabold text-sm text-white uppercase tracking-wider">// Provision New Crowd Event</span>
                <button 
                  onClick={() => setShowCreateEventModal(false)}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                >
                  [CLOSE]
                </button>
              </div>

              <form onSubmit={handleCreateEventSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Category</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                      value={eventType}
                      onChange={(e) => handleTypeChange(e.target.value)}
                    >
                      <option value="Concert">Concert</option>
                      <option value="Kumbh Mela">Kumbh Mela</option>
                      <option value="Cricket Match">Cricket Match</option>
                      <option value="Temple Festival">Temple Festival</option>
                      <option value="Political Rally">Political Rally</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Event Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Indra Stadium Mega Concert"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:outline-none focus:border-teal-500"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">Location Venue Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Indra National Stadium, Chennai"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:outline-none focus:border-teal-500"
                    value={eventLocationName}
                    onChange={(e) => setEventLocationName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Latitude</label>
                    <input 
                      type="number" 
                      step="any"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:outline-none"
                      value={eventLatitude}
                      onChange={(e) => setEventLatitude(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">Longitude</label>
                    <input 
                      type="number" 
                      step="any"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:outline-none font-mono"
                      value={eventLongitude}
                      onChange={(e) => setEventLongitude(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Start Date/Time</label>
                    <input 
                      type="datetime-local" 
                      required
                      className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:outline-none"
                      value={eventStartDate}
                      onChange={(e) => setEventStartDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">End Date/Time</label>
                    <input 
                      type="datetime-local" 
                      required
                      className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:outline-none"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-zinc-900 pt-3">
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Expected Crowd</label>
                    <input 
                      type="number" 
                      required
                      className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:outline-none font-mono"
                      value={eventCapacity}
                      onChange={(e) => setEventCapacity(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Gates Count</label>
                    <input 
                      type="number" 
                      required
                      className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:outline-none font-mono"
                      value={eventGates}
                      onChange={(e) => setEventGates(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Volunteers Req</label>
                    <input 
                      type="number" 
                      required
                      className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white focus:outline-none font-mono"
                      value={eventVolunteersReq}
                      onChange={(e) => setEventVolunteersReq(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingEvent}
                  className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-extrabold uppercase tracking-wider text-[10px] cursor-pointer flex justify-center items-center gap-1.5 hover:shadow-glow-blue transition-all disabled:opacity-50"
                >
                  {creatingEvent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Provision Event'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
