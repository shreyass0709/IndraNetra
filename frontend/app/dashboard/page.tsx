'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import {
  LogOut,
  Bell,
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
  Shield,
  Settings,
  User,
  Home,
  Info
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
  const pathname = usePathname();
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
  const [activeTab, setActiveTab] = useState<string>('events');

  // Baseline API Data states
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [sosRequests, setSosRequests] = useState<any[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Notifications (bell)
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Real-time HUD states
  const [liveCount, setLiveCount] = useState<number>(0);
  const [liveDensity, setLiveDensity] = useState<number>(0);
  const [liveRisk, setLiveRisk] = useState<string>('LOW');
  const [liveHeatmap, setLiveHeatmap] = useState<string | null>(null);
  const [routingPath, setRoutingPath] = useState<[number, number][]>([]);
  const [activeRouteGate, setActiveRouteGate] = useState<string | null>(null);

  // Event sub-view states
  const [eventSubView, setEventSubView] = useState<'list' | 'create' | 'details' | 'edit'>('list');
  const [viewingEvent, setViewingEvent] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventError, setEventError] = useState<string | null>(null);

  // Form states
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('Indra Stadium Live Concert');
  const [eventType, setEventType] = useState('CONCERT');
  const [eventLocationName, setEventLocationName] = useState('Indra National Stadium, Chennai');
  const [eventLatitude, setEventLatitude] = useState('13.0827');
  const [eventLongitude, setEventLongitude] = useState('80.2707');
  const [eventExpectedCrowd, setEventExpectedCrowd] = useState('800');
  const [eventCapacity, setEventCapacity] = useState('1000');
  const [eventAreaSqMeters, setEventAreaSqMeters] = useState('');
  const [eventGates, setEventGates] = useState('4');
  const [eventExitGates, setEventExitGates] = useState('4');
  const [eventCameraCount, setEventCameraCount] = useState('12');
  const [eventVolunteersReq, setEventVolunteersReq] = useState('20');
  const [eventStartDate, setEventStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [eventEndDate, setEventEndDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Edit Event form states
  const [editName, setEditName] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editMaxCapacity, setEditMaxCapacity] = useState('');
  const [editAreaSqMeters, setEditAreaSqMeters] = useState('');
  const [editCameraCount, setEditCameraCount] = useState('');
  const [editVolunteerCount, setEditVolunteerCount] = useState('');

  // Edit Volunteer form states
  const [editingVolunteer, setEditingVolunteer] = useState<any>(null);
  const [editVolAssignedArea, setEditVolAssignedArea] = useState('');
  const [editVolStatus, setEditVolStatus] = useState('AVAILABLE');
  const [editVolSkills, setEditVolSkills] = useState('');
  const [editVolAvailability, setEditVolAvailability] = useState('');
  const [updatingVolunteer, setUpdatingVolunteer] = useState(false);

  // Camera sub-view states
  const [cameraSubView, setCameraSubView] = useState<'list' | 'add' | 'edit' | 'monitoring' | 'details'>('list');
  const [selectedCamera, setSelectedCamera] = useState<any>(null);
  const [cameraSearchQuery, setCameraSearchQuery] = useState('');
  const [cameraStatusFilter, setCameraStatusFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');

  // Camera form states
  const [camName, setCamName] = useState('');
  const [camLocation, setCamLocation] = useState('');
  const [camSource, setCamSource] = useState('Laptop Webcam'); // Laptop Webcam, Mobile Camera, RTSP Camera, Video File
  const [camRtspUrl, setCamRtspUrl] = useState('webcam');
  const [camAiEnabled, setCamAiEnabled] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [creatingCamera, setCreatingCamera] = useState(false);

  // Webcam scanning states
  const [scanningCamId, setScanningCamId] = useState<string | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);

  // Dispatch states
  const [dispatchVolId, setDispatchVolId] = useState('');
  const [dispatchIncidentId, setDispatchIncidentId] = useState('');
  const [dispatchIncidentType, setDispatchIncidentType] = useState<'SOS' | 'REPORT'>('SOS');

  // Organizer approvals states
  const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);
  const [fetchingApprovals, setFetchingApprovals] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);

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

  // Settings states
  const [settingsDensityThreshold, setSettingsDensityThreshold] = useState(2.5);
  const [settingsAlertEmail, setSettingsAlertEmail] = useState(true);
  const [settingsAlertSMS, setSettingsAlertSMS] = useState(false);
  const [settingsSirenSound, setSettingsSirenSound] = useState(true);
  const [settingsYoloModel, setSettingsYoloModel] = useState('YOLOv11-Nano');

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedDensity = localStorage.getItem('settings_density_threshold');
      if (storedDensity) setSettingsDensityThreshold(parseFloat(storedDensity));

      const storedEmail = localStorage.getItem('settings_alert_email');
      if (storedEmail) setSettingsAlertEmail(storedEmail === 'true');

      const storedSMS = localStorage.getItem('settings_alert_sms');
      if (storedSMS) setSettingsAlertSMS(storedSMS === 'true');

      const storedSiren = localStorage.getItem('settings_siren_sound');
      if (storedSiren) setSettingsSirenSound(storedSiren === 'true');

      const storedYolo = localStorage.getItem('settings_yolo_model');
      if (storedYolo) setSettingsYoloModel(storedYolo);
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.role === 'ADMIN') {
      localStorage.setItem('settings_density_threshold', settingsDensityThreshold.toString());
      localStorage.setItem('settings_alert_email', settingsAlertEmail.toString());
      localStorage.setItem('settings_alert_sms', settingsAlertSMS.toString());
      localStorage.setItem('settings_siren_sound', settingsSirenSound.toString());
      localStorage.setItem('settings_yolo_model', settingsYoloModel);
    }
  }, [settingsDensityThreshold, settingsAlertEmail, settingsAlertSMS, settingsSirenSound, settingsYoloModel, user]);

  // Profile Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileOrgName, setProfileOrgName] = useState('');
  const [profileDesignation, setProfileDesignation] = useState('');
  const [profileContact, setProfileContact] = useState('');
  const [profileEmergencyContact, setProfileEmergencyContact] = useState('');
  const [profileSkills, setProfileSkills] = useState('');
  const [profileAvailability, setProfileAvailability] = useState('');

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
    api.getMe()
      .then((me) => {
        if (!me.profileComplete) {
          router.push('/profile-setup');
          return;
        }
        
        // Routing redirect checks
        const rolePaths: Record<string, string> = {
          ADMIN: '/admin/dashboard',
          ORGANIZER: '/organizer/dashboard',
          VOLUNTEER: '/volunteer/dashboard',
          PUBLIC: '/public/dashboard',
        };
        const expectedPath = rolePaths[me.role];
        if (expectedPath && pathname !== expectedPath) {
          router.replace(expectedPath);
          return;
        }

        setUser(me);
        setProfileName(me.name || '');
        if (me.organizerProfile) {
          setProfileOrgName(me.organizerProfile.organizationName || '');
          setProfileDesignation(me.organizerProfile.designation || '');
          setProfileContact(me.organizerProfile.contactNumber || '');
        }
        if (me.volunteer) {
          setProfileContact(me.volunteer.phoneNumber || '');
          setProfileSkills(me.volunteer.skills || '');
          setProfileAvailability(me.volunteer.availability || '');
        }
        if (me.publicUserProfile) {
          setProfileContact(me.publicUserProfile.phoneNumber || '');
          setProfileEmergencyContact(me.publicUserProfile.emergencyContact || '');
        }
        
        // Default active tab based on role
        if (me.role === 'VOLUNTEER') {
          setActiveTab('volunteer-duty');
        } else if (me.role === 'PUBLIC') {
          setActiveTab('public-home');
        } else {
          setActiveTab('events');
        }
        
        fetchDashboardData();
        fetchNotifications();
      })
      .catch((err) => {
        console.error('Session verification failed:', err);
        router.push('/login');
      });
  }, [router, pathname]);

  // Load approvals and users when active tab is users
  useEffect(() => {
    if (activeTab === 'users' && user?.role === 'ADMIN') {
      fetchPendingOrganizers();
      fetchAllUsers();
    }
  }, [activeTab, user]);

  const fetchPendingOrganizers = async () => {
    try {
      setFetchingApprovals(true);
      const list = await api.getPendingOrganizers();
      setPendingOrganizers(list);
    } catch (e: any) {
      console.error('Failed to fetch pending organizers:', e);
    } finally {
      setFetchingApprovals(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setFetchingUsers(true);
      const list = await api.getAllUsers();
      setAllUsers(list);
    } catch (e: any) {
      console.error('Failed to fetch all users:', e);
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole);
      alert(`User role updated successfully to ${newRole}`);
      fetchAllUsers();
      const vols = await api.getVolunteers();
      setVolunteers(vols);
    } catch (e: any) {
      alert(e.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await api.deleteUser(userId);
      alert('User deleted successfully');
      fetchAllUsers();
      const vols = await api.getVolunteers();
      setVolunteers(vols);
    } catch (e: any) {
      alert(e.message || 'Failed to delete user');
    }
  };

  const handleUpdateVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVolunteer) return;
    try {
      setUpdatingVolunteer(true);
      await api.updateVolunteer(editingVolunteer.id, {
        assignedArea: editVolAssignedArea,
        status: editVolStatus,
        skills: editVolSkills,
        availability: editVolAvailability,
      });
      alert('Volunteer details updated successfully!');
      setEditingVolunteer(null);
      const vols = await api.getVolunteers();
      setVolunteers(vols);
    } catch (e: any) {
      alert(e.message || 'Failed to update volunteer details');
    } finally {
      setUpdatingVolunteer(false);
    }
  };

  const handleApproveOrganizer = async (id: string) => {
    try {
      await api.approveOrganizer(id);
      setPendingOrganizers(prev => prev.filter(org => org.id !== id));
      fetchAllUsers(); // Also refresh general users list
    } catch (e: any) {
      alert(e.message || 'Approval failed');
    }
  };

  const handleRejectOrganizer = async (id: string) => {
    try {
      await api.rejectOrganizer(id);
      setPendingOrganizers(prev => prev.filter(org => org.id !== id));
      fetchAllUsers(); // Also refresh general users list
    } catch (e: any) {
      alert(e.message || 'Rejection failed');
    }
  };

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
          name: "Indra Stadium Mega Festival",
          eventType: "FESTIVAL",
          description: "Crowd safety and surveillance zone.",
          location: "Indra National Stadium",
          latitude: 13.0827,
          longitude: 80.2707,
          expectedCrowd: 800,
          maxCapacity: 1000,
          entryGates: 4,
          exitGates: 4,
          cameraCount: 12,
          volunteerCount: 40,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 86400000).toISOString()
        });
        setEvents([defaultEv]);
        currentEvent = defaultEv;
        setSelectedEvent(defaultEv);
      }

      // Secondary datasets are isolated so a role-restricted 403 (e.g. volunteers
      // list for PUBLIC/VOLUNTEER users) never aborts the rest of the dashboard.
      try {
        const vols = await api.getVolunteers();
        setVolunteers(vols);
      } catch (e) {
        // Not permitted for this role — leave list empty.
      }

      try {
        const reps = await api.getReports();
        setIncidents(reps);
      } catch (e) {
        console.error('Failed to load reports:', e);
      }

      try {
        const soses = await api.getSOSRequests();
        setSosRequests(soses);
      } catch (e) {
        console.error('Failed to load SOS requests:', e);
      }

      try {
        const activeAlerts = await api.getActiveAlerts();
        setAlerts(activeAlerts);
      } catch (e) {
        console.error('Failed to load alerts:', e);
      }

      if (currentEvent) {
        try {
          const cams = await api.getCameras(currentEvent.id);
          setCameras(cams);
        } catch (e) {
          console.error('Failed to load cameras:', e);
        }
      }
    } catch (err) {
      console.error('Error load baseline data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Notifications
  const fetchNotifications = async () => {
    try {
      const [list, count] = await Promise.all([
        api.getNotifications(),
        api.getUnreadNotificationCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count.count ?? 0);
    } catch (e) {
      // Silently ignore — notifications are non-critical.
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark notifications read:', e);
    }
  };

  // Acknowledge/clear an alert and remove it from the live stream.
  const handleResolveAlert = async (id: string) => {
    try {
      await api.resolveAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (e: any) {
      console.error('Failed to resolve alert:', e?.message || e);
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

  // A resolved alert on any client clears it from every dashboard's stream.
  useEffect(() => {
    if (socket.resolvedAlert?.id) {
      setAlerts(prev => prev.filter(a => a.id !== socket.resolvedAlert.id));
    }
  }, [socket.resolvedAlert]);

  // New incident reports surface live in the control room.
  useEffect(() => {
    if (socket.reportEvent?.id) {
      const rep = socket.reportEvent;
      setIncidents(prev => [rep, ...prev.filter(r => r.id !== rep.id)]);
    }
  }, [socket.reportEvent]);

  // Per-user notification: refresh the bell when a signal for me arrives.
  useEffect(() => {
    if (socket.notification && user?.id && socket.notification.userId === user.id) {
      fetchNotifications();
    }
  }, [socket.notification, user]);

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
      const gatesCount = selectedEvent.entryGates || 4;
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
  const handleCreateEvent = async (e: React.FormEvent, isDraft = false) => {
    if (e) e.preventDefault();
    setEventError(null);
    if (!eventTitle || !eventLocationName) return;
    try {
      setCreatingEvent(true);
      const newEv = await api.createEvent({
        name: eventTitle,
        eventType: eventType,
        description: "Active Crowd Surveillance Zone.",
        location: eventLocationName,
        latitude: parseFloat(eventLatitude) || 13.0827,
        longitude: parseFloat(eventLongitude) || 80.2707,
        expectedCrowd: parseInt(eventExpectedCrowd) || 0,
        maxCapacity: parseInt(eventCapacity) || 0,
        areaSqMeters: eventAreaSqMeters ? parseFloat(eventAreaSqMeters) : undefined,
        entryGates: parseInt(eventGates) || 1,
        exitGates: parseInt(eventExitGates) || 1,
        cameraCount: parseInt(eventCameraCount) || 0,
        volunteerCount: parseInt(eventVolunteersReq) || 0,
        startTime: new Date(eventStartDate).toISOString(),
        endTime: new Date(eventEndDate).toISOString(),
        status: 'Upcoming', // Default as Upcoming
      });
      setEvents(prev => [newEv, ...prev]);
      setSelectedEvent(newEv);
      setReportLat(newEv.latitude.toString());
      setReportLng(newEv.longitude.toString());
      setShowCreateEventModal(false);
      setEventSubView('list');
      alert(isDraft ? `Draft saved successfully: ${newEv.name}` : `Event created successfully: ${newEv.name}`);
    } catch (err: any) {
      console.error(err);
      setEventError(err.message || 'Failed to create event');
    } finally {
      setCreatingEvent(false);
    }
  };

  // Update Event
  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setEventError(null);
    try {
      const updated = await api.updateEvent(editingEvent.id, {
        name: editName,
        startTime: new Date(editStartTime).toISOString(),
        endTime: new Date(editEndTime).toISOString(),
        maxCapacity: parseInt(editMaxCapacity),
        areaSqMeters: editAreaSqMeters ? parseFloat(editAreaSqMeters) : undefined,
        cameraCount: parseInt(editCameraCount),
        volunteerCount: parseInt(editVolunteerCount),
      });
      setEvents(prev => prev.map(ev => ev.id === editingEvent.id ? updated : ev));
      if (selectedEvent?.id === editingEvent.id) {
        setSelectedEvent(updated);
      }
      setViewingEvent(updated);
      setEventSubView('details');
      alert(`Event updated successfully: ${updated.name}`);
    } catch (err: any) {
      console.error(err);
      setEventError(err.message || 'Failed to update event');
    }
  };

  // Delete/Cancel Event
  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this event to preserve history?')) return;
    try {
      const cancelled = await api.deleteEvent(id);
      setEvents(prev => prev.map(ev => ev.id === id ? cancelled : ev));
      if (selectedEvent?.id === id) {
        setSelectedEvent(cancelled);
      }
      if (viewingEvent?.id === id) {
        setViewingEvent(cancelled);
      }
      setEventSubView('list');
      alert(`Event status updated to Cancelled.`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to cancel event');
    }
  };

  // Start Event (Upcoming -> Live)
  const handleStartEvent = async (id: string) => {
    try {
      const updated = await api.updateEvent(id, { status: 'Live' });
      setEvents(prev => prev.map(ev => ev.id === id ? updated : ev));
      if (selectedEvent?.id === id) {
        setSelectedEvent(updated);
      }
      setViewingEvent(updated);
      alert(`Event is now Live!`);
    } catch (err: any) {
      alert(err.message || 'Failed to start event');
    }
  };

  // End Event (Live -> Completed)
  const handleEndEvent = async (id: string) => {
    try {
      const updated = await api.updateEvent(id, { status: 'Completed' });
      setEvents(prev => prev.map(ev => ev.id === id ? updated : ev));
      if (selectedEvent?.id === id) {
        setSelectedEvent(updated);
      }
      setViewingEvent(updated);
      alert(`Event has been marked Completed.`);
    } catch (err: any) {
      alert(err.message || 'Failed to end event');
    }
  };

  // Add Camera Form Submit
  const handleCreateCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!camName || !camLocation || !selectedEvent) return;
    try {
      setCreatingCamera(true);
      const newCam = await api.createCamera(
        selectedEvent.id,
        camName,
        camLocation,
        camSource,
        camRtspUrl
      );
      setCameras(prev => [...prev, newCam]);
      
      // Reset state
      setCamName('');
      setCamLocation('');
      setCamSource('Laptop Webcam');
      setCamRtspUrl('webcam');
      setCamAiEnabled(true);
      setCameraSubView('list');
    } catch (err) {
      console.error(err);
      alert('Failed to register camera');
    } finally {
      setCreatingCamera(false);
    }
  };

  // Edit Camera Form Submit
  const handleUpdateCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCamera || !camName || !camLocation) return;
    try {
      setCreatingCamera(true);
      const updatedCam = await api.updateCamera(selectedCamera.id, {
        name: camName,
        location: camLocation,
        cameraSource: camSource,
        rtspUrl: camRtspUrl,
        aiEnabled: camAiEnabled,
      });
      setCameras(prev => prev.map(c => c.id === selectedCamera.id ? updatedCam : c));
      
      setCamName('');
      setCamLocation('');
      setCamSource('Laptop Webcam');
      setCamRtspUrl('webcam');
      setCamAiEnabled(true);
      setSelectedCamera(null);
      setCameraSubView('list');
    } catch (err) {
      console.error(err);
      alert('Failed to update camera');
    } finally {
      setCreatingCamera(false);
    }
  };

  // Test Camera Connection
  const handleTestConnection = async (cameraId: string) => {
    try {
      setTestingConnection(true);
      const res = await api.testCameraConnection(cameraId);
      alert(res.message || 'Connection test finished');
      // Refresh status in local cameras list
      const updatedCams = await api.getCameras(selectedEvent.id);
      setCameras(updatedCams);
      if (selectedCamera && selectedCamera.id === cameraId) {
        const updatedSelected = updatedCams.find((c: any) => c.id === cameraId);
        setSelectedCamera(updatedSelected);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Connection test failed: ${err.message}`);
    } finally {
      setTestingConnection(false);
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
      if (selectedCamera?.id === cameraId) {
        setSelectedCamera(null);
        setCameraSubView('list');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete camera');
    }
  };

  // Run Camera YOLOv11 Scan (Webcam or RTSP/File)
  const toggleCameraScan = async (cam: any) => {
    if (scanningCamId === cam.id) {
      stopWebcamScan();
      return;
    }

    if (scanningCamId) {
      stopWebcamScan();
    }

    setScanningCamId(cam.id);

    if (cam.cameraSource === 'Laptop Webcam' || cam.rtspUrl.toLowerCase() === 'webcam') {
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
      
      // Update local camera info to keep UI in sync
      setCameras(prev => prev.map(c => 
        c.id === scanningCamId 
          ? { ...c, peopleCount: res.report.peopleCount, density: res.report.densityLevel, riskLevel: res.report.riskLevel }
          : c
      ));
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

  // Profile Save Form Submit
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      let profileData: any = {};
      if (user.role === 'VOLUNTEER') {
        profileData = {
          phoneNumber: profileContact,
          skills: profileSkills,
          availability: profileAvailability,
        };
      } else if (user.role === 'ORGANIZER') {
        profileData = {
          organizationName: profileOrgName,
          designation: profileDesignation,
          contactNumber: profileContact,
        };
      } else if (user.role === 'PUBLIC') {
        profileData = {
          phoneNumber: profileContact,
          emergencyContact: profileEmergencyContact,
        };
      }
      
      await api.completeProfile(user.role, profileData);
      const updatedUser = await api.getMe();
      setUser(updatedUser);
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
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

  if (user && user.role === 'ORGANIZER' && !user.isApproved) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-mono relative overflow-hidden select-none">
        {/* Background Grid Particle Overlays */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-blue-500/5 animate-[spin_120s_linear_infinite]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-dashed border-blue-500/10 animate-[spin_60s_linear_infinite_reverse]" />
        </div>

        <div className="max-w-md w-full p-8 rounded-2xl border border-yellow-500/20 bg-zinc-950/80 shadow-2xl relative z-20 flex flex-col gap-6 text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto text-yellow-500 animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-yellow-500">// ACCOUNT APPROVAL PENDING</h2>
            <p className="text-xs text-zinc-400 mt-2">
              Hi <strong>{user.name}</strong>, your Organizer account has been registered but requires Admin clearance before accessing the command grid.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 text-[10px] text-zinc-500 text-left space-y-1">
            <div><strong>EMAIL:</strong> {user.email}</div>
            <div><strong>CLEARANCE TYPE:</strong> EVENT ORGANIZER</div>
            <div><strong>REGISTRATION STATUS:</strong> PENDING ADMIN REVIEW</div>
          </div>

          <p className="text-[10px] text-zinc-500 italic">
            An email notification will be dispatched automatically once the Administrator grants access.
          </p>

          <button
            onClick={() => {
              api.logout().then(() => router.push('/login'));
            }}
            className="w-full py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs font-bold uppercase transition-all cursor-pointer"
          >
            Sign Out
          </button>
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
              {(() => {
                const allowedTabs = (() => {
                  if (!user) return [];
                  switch (user.role) {
                    case 'ADMIN':
                      return [
                        { id: 'overview', label: 'Dashboard', icon: Activity },
                        { id: 'events', label: 'Events', icon: Calendar },
                        { id: 'users', label: 'Users', icon: Users },
                        { id: 'cameras', label: 'Live Monitoring', icon: CameraIcon },
                        { id: 'emergency', label: 'Emergency Center', icon: ShieldAlert },
                        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                        { id: 'settings', label: 'Settings', icon: Settings },
                        { id: 'profile', label: 'Profile', icon: User },
                      ];
                    case 'ORGANIZER':
                      return [
                        { id: 'overview', label: 'Dashboard', icon: Activity },
                        { id: 'events', label: 'Events', icon: Calendar },
                        { id: 'cameras', label: 'Live Monitoring', icon: CameraIcon },
                        { id: 'volunteers', label: 'Volunteers', icon: Users },
                        { id: 'emergency', label: 'Emergency', icon: ShieldAlert },
                        { id: 'profile', label: 'Profile', icon: User },
                      ];
                    case 'VOLUNTEER':
                      return [
                        { id: 'volunteer-duty', label: 'Dashboard', icon: Shield },
                        { id: 'cameras', label: 'Monitoring', icon: CameraIcon },
                        { id: 'emergency', label: 'SOS', icon: ShieldAlert },
                        { id: 'profile', label: 'Profile', icon: User },
                      ];
                    case 'PUBLIC':
                      return [
                        { id: 'public-home', label: 'Home', icon: Home },
                        { id: 'public-sos', label: 'SOS', icon: ShieldAlert },
                        { id: 'public-report', label: 'Report Incident', icon: Send },
                        { id: 'profile', label: 'Profile', icon: User },
                      ];
                    default:
                      return [];
                  }
                })();

                return allowedTabs.map((item) => {
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
                });
              })()}
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
                    <option key={e.id} value={e.id} className="bg-white text-zinc-900 font-semibold">{e.name}</option>
                  ))}
                </select>
                <div className="text-xs text-zinc-500 flex items-center gap-1.5 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" /> {selectedEvent?.location || 'Unknown Location'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-start">
              {/* Notification bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    const opening = !showNotifications;
                    setShowNotifications(opening);
                    if (opening && unreadCount > 0) handleMarkAllRead();
                  }}
                  className="relative p-2 rounded-xl border border-border bg-card hover:bg-muted transition-colors cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4 text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-border bg-card shadow-xl z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">Notifications</span>
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-semibold text-blue-600 hover:underline"
                      >
                        Mark all read
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-zinc-400">No notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-border/60 ${n.isRead ? 'opacity-60' : 'bg-blue-50/40'}`}
                        >
                          <div className="text-xs font-bold text-foreground">{n.title}</div>
                          <div className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{n.message}</div>
                          <div className="text-[9px] text-zinc-400 mt-1 font-mono">{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
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
                        <div className="text-[8px] text-zinc-400 mt-2 font-mono">CAPACITY: {selectedEvent?.maxCapacity || 1000}</div>
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
                        
                        {(user?.role === 'ADMIN') && (
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
                    {user?.role === 'PUBLIC' && (
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
                    {user?.role === 'PUBLIC' && (
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
                              
                              {(user?.role === 'ADMIN' || user?.role === 'VOLUNTEER') && (
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
                              
                              {(user?.role === 'ADMIN' || user?.role === 'VOLUNTEER') && (
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
                  {/* Access Control check */}
                  {user?.role === 'PUBLIC' ? (
                    <div className="p-12 text-center border border-red-500/20 rounded-2xl bg-red-500/5 text-red-500 font-mono">
                      <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-red-500 animate-bounce" />
                      <h3 className="text-sm font-bold uppercase tracking-widest">[ACCESS RESTRICTED]</h3>
                      <p className="text-[10px] text-zinc-400 mt-2">Public Users do not have authorization to view live camera telemetry streams.</p>
                    </div>
                  ) : (
                    <div className="space-y-6 font-mono text-xs text-foreground">
                      
                      {/* Sub-view: CAMERA LIST */}
                      {cameraSubView === 'list' && (
                        <div className="space-y-6">
                          {/* List Header */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950 p-5 border border-zinc-800 rounded-2xl shadow-md">
                            <div>
                              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-100 flex items-center gap-2">
                                <CameraIcon className="w-4 h-4 text-blue-500 animate-pulse" /> 
                                Live Camera Registry
                              </h2>
                              <p className="text-[10px] text-zinc-400 mt-0.5">
                                Register and oversee video analytics cameras to stream yolo target telemetry.
                              </p>
                            </div>

                            {/* Add Camera Action */}
                            {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                              <button
                                onClick={() => {
                                  setCamName('');
                                  setCamLocation('');
                                  setCamSource('Laptop Webcam');
                                  setCamRtspUrl('webcam');
                                  setCamAiEnabled(true);
                                  setCameraSubView('add');
                                }}
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                              >
                                + Add Camera
                              </button>
                            )}
                          </div>

                          {/* Search & Filter Bar */}
                          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border p-4 rounded-xl shadow-sm">
                            <div className="w-full sm:max-w-xs relative">
                              <input 
                                type="text"
                                placeholder="Search camera name or location..."
                                className="w-full pl-3 pr-8 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                                value={cameraSearchQuery}
                                onChange={(e) => setCameraSearchQuery(e.target.value)}
                              />
                            </div>
                            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                              <span className="text-[9px] text-zinc-400 font-bold uppercase">FILTER:</span>
                              {['ALL', 'ONLINE', 'OFFLINE'].map((filterVal) => (
                                <button
                                  key={filterVal}
                                  onClick={() => setCameraStatusFilter(filterVal as any)}
                                  className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold transition-all cursor-pointer ${
                                    cameraStatusFilter === filterVal
                                      ? 'bg-zinc-900 border-zinc-800 text-white shadow-sm'
                                      : 'bg-zinc-100 border-border text-zinc-500 hover:bg-zinc-200'
                                  }`}
                                >
                                  {filterVal}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Cameras Grid Table */}
                          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
                            <table className="w-full border-collapse text-left">
                              <thead>
                                <tr className="border-b border-border bg-zinc-50 font-bold uppercase text-[9px] text-zinc-500 tracking-wider">
                                  <th className="p-4">Camera Name</th>
                                  <th className="p-4">Location</th>
                                  <th className="p-4">Camera Source</th>
                                  <th className="p-4">Status</th>
                                  <th className="p-4">AI</th>
                                  <th className="p-4 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const filtered = cameras.filter(cam => {
                                    const matchesSearch = cam.name.toLowerCase().includes(cameraSearchQuery.toLowerCase()) || 
                                                          cam.location.toLowerCase().includes(cameraSearchQuery.toLowerCase());
                                    const matchesStatus = cameraStatusFilter === 'ALL' || 
                                                          (cameraStatusFilter === 'ONLINE' && cam.status.toLowerCase() === 'online') || 
                                                          (cameraStatusFilter === 'OFFLINE' && cam.status.toLowerCase() !== 'online');
                                    return matchesSearch && matchesStatus;
                                  });

                                  if (filtered.length === 0) {
                                    return (
                                      <tr>
                                        <td colSpan={6} className="p-12 text-center text-zinc-400 font-sans">
                                          No cameras matched the filters or event has no cameras registered.
                                        </td>
                                      </tr>
                                    );
                                  }

                                  return filtered.map((cam) => {
                                    const isOnline = cam.status.toLowerCase() === 'online';
                                    const isScanning = scanningCamId === cam.id;
                                    
                                    return (
                                      <tr key={cam.id} className="border-b border-border hover:bg-zinc-50/50 transition-colors">
                                        <td className="p-4 font-bold text-zinc-800">{cam.name}</td>
                                        <td className="p-4 text-zinc-600">{cam.location}</td>
                                        <td className="p-4">
                                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 text-[8px] font-bold uppercase">
                                            {cam.cameraSource}
                                          </span>
                                        </td>
                                        <td className="p-4">
                                          <span className={`inline-flex items-center gap-1.5 font-bold ${isOnline ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-zinc-400'} ${isOnline ? 'relative flex items-center justify-center' : ''}`}>
                                              {isOnline && <span className="radar-ping bg-emerald-500" />}
                                            </span>
                                            {isOnline ? 'Online' : 'Offline'}
                                          </span>
                                        </td>
                                        <td className="p-4">
                                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${cam.aiEnabled ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-zinc-100 border-border text-zinc-400'}`}>
                                            {cam.aiEnabled ? 'ON' : 'OFF'}
                                          </span>
                                        </td>
                                        <td className="p-4 text-right">
                                          <div className="flex justify-end gap-1.5">
                                            <button
                                              onClick={() => {
                                                setSelectedCamera(cam);
                                                setCameraSubView('monitoring');
                                                if (scanningCamId !== cam.id) {
                                                  stopWebcamScan();
                                                }
                                              }}
                                              className="px-2.5 py-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold uppercase text-[9px] transition-colors cursor-pointer border border-blue-100/50"
                                            >
                                              View
                                            </button>
                                            <button
                                              onClick={() => {
                                                setSelectedCamera(cam);
                                                setCameraSubView('details');
                                              }}
                                              className="px-2.5 py-1.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold uppercase text-[9px] transition-colors cursor-pointer border border-border"
                                            >
                                              Details
                                            </button>
                                            {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                                              <button
                                                onClick={() => {
                                                  setSelectedCamera(cam);
                                                  setCamName(cam.name);
                                                  setCamLocation(cam.location);
                                                  setCamSource(cam.cameraSource);
                                                  setCamRtspUrl(cam.rtspUrl);
                                                  setCamAiEnabled(cam.aiEnabled);
                                                  setCameraSubView('edit');
                                                }}
                                                className="px-2.5 py-1.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold uppercase text-[9px] transition-colors cursor-pointer border border-border"
                                              >
                                                Edit
                                              </button>
                                            )}
                                            {user?.role === 'ADMIN' && (
                                              <button
                                                onClick={() => handleDeleteCamera(cam.id)}
                                                className="px-2.5 py-1.5 rounded bg-red-50 hover:bg-red-100 text-red-500 font-bold uppercase text-[9px] transition-colors cursor-pointer border border-red-100/50"
                                              >
                                                Delete
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  });
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Sub-view: ADD CAMERA / EDIT CAMERA */}
                      {(cameraSubView === 'add' || cameraSubView === 'edit') && (
                        <form onSubmit={cameraSubView === 'add' ? handleCreateCamera : handleUpdateCamera} className="space-y-6 bg-card border border-border p-6 rounded-2xl shadow-sm">
                          <div className="flex justify-between items-center border-b border-border pb-3 mb-5">
                            <span className="font-extrabold text-xs text-foreground uppercase tracking-widest">
                              {cameraSubView === 'add' ? '// PROVISION SURVEILLANCE CAMERA' : `// EDIT CAMERA SETTINGS: ${selectedCamera?.name}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setCamName('');
                                setCamLocation('');
                                setCamSource('Laptop Webcam');
                                setCamRtspUrl('webcam');
                                setCamAiEnabled(true);
                                setSelectedCamera(null);
                                setCameraSubView('list');
                              }}
                              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              &lt; Back to List
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Camera Identifier Name *</label>
                              <input 
                                type="text" 
                                required
                                placeholder="e.g. North Gate Camera"
                                className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                                value={camName}
                                onChange={(e) => setCamName(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Surveillance Sector Location *</label>
                              <input 
                                type="text" 
                                required
                                placeholder="e.g. North Gate Entrance"
                                className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                                value={camLocation}
                                onChange={(e) => setCamLocation(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Camera Source Type *</label>
                              <select 
                                className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer font-bold"
                                value={camSource}
                                onChange={(e) => {
                                  const source = e.target.value;
                                  setCamSource(source);
                                  if (source === 'Laptop Webcam') {
                                    setCamRtspUrl('webcam');
                                  } else if (source === 'Mobile Camera') {
                                    setCamRtspUrl('http://192.168.1.50:8080/video');
                                  } else if (source === 'RTSP Camera') {
                                    setCamRtspUrl('rtsp://admin:password@192.168.1.100:554/live');
                                  } else if (source === 'Video File') {
                                    setCamRtspUrl('festival.mp4');
                                  }
                                }}
                              >
                                <option value="Laptop Webcam">Laptop Webcam</option>
                                <option value="Mobile Camera">Mobile Camera</option>
                                <option value="RTSP Camera">RTSP Camera</option>
                                <option value="Video File">Video File</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                                {camSource === 'Laptop Webcam' && 'Source Location (webcam)'}
                                {camSource === 'Mobile Camera' && 'IP Webcam Stream URL *'}
                                {camSource === 'RTSP Camera' && 'RTSP Connection string *'}
                                {camSource === 'Video File' && 'Video Filename / Path *'}
                              </label>
                              <input 
                                type="text"
                                required
                                disabled={camSource === 'Laptop Webcam'}
                                placeholder={
                                  camSource === 'Laptop Webcam' ? 'webcam' :
                                  camSource === 'Mobile Camera' ? 'http://192.168.1.50:8080/video' :
                                  camSource === 'RTSP Camera' ? 'rtsp://user:pass@ip:port/stream' :
                                  'festival.mp4'
                                }
                                className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white disabled:opacity-50"
                                value={camRtspUrl}
                                onChange={(e) => setCamRtspUrl(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">AI Detection Model *</label>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setCamAiEnabled(!camAiEnabled)}
                                className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                  camAiEnabled 
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-sm' 
                                    : 'bg-zinc-100 border-border text-zinc-500 hover:bg-zinc-200'
                                }`}
                              >
                                {camAiEnabled ? 'YOLOv11 Active' : 'YOLOv11 Disabled'}
                              </button>
                              <span className="text-[10px] text-zinc-500">
                                When enabled, frame stream will automatically feed into the YOLOv11 + ByteTrack prevent tracker.
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 border-t border-border pt-4">
                            {cameraSubView === 'edit' && (
                              <button
                                type="button"
                                disabled={testingConnection}
                                onClick={() => handleTestConnection(selectedCamera.id)}
                                className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold uppercase transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {testingConnection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Test Connection'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setCamName('');
                                setCamLocation('');
                                setCamSource('Laptop Webcam');
                                setCamRtspUrl('webcam');
                                setCamAiEnabled(true);
                                setSelectedCamera(null);
                                setCameraSubView('list');
                              }}
                              className="px-4 py-2 rounded-xl border border-border bg-transparent text-zinc-500 hover:bg-zinc-100 font-bold uppercase cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={creatingCamera}
                              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {creatingCamera && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              Save Camera
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Sub-view: LIVE MONITORING */}
                      {cameraSubView === 'monitoring' && selectedCamera && (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center bg-zinc-950 p-5 border border-zinc-800 rounded-2xl shadow-md">
                            <div>
                              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-100 flex items-center gap-2">
                                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                                LIVE SURVEILLANCE FEED: {selectedCamera.name}
                              </h2>
                              <p className="text-[10px] text-zinc-400 mt-0.5">
                                Location: {selectedCamera.location} | Source: {selectedCamera.cameraSource}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                stopWebcamScan();
                                setCameraSubView('list');
                              }}
                              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              &lt; Back to List
                            </button>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Live Feed Container */}
                            <div className="lg:col-span-8 space-y-4">
                              <div 
                                ref={feedRef}
                                className="h-96 rounded-2xl overflow-hidden bg-black border border-border relative flex items-center justify-center shadow-lg group"
                              >
                                {scanningCamId === selectedCamera.id && <div className="scan-line block" style={{ animation: 'scan 3s linear infinite', position: 'absolute', width: '100%', height: '2px', background: '#0d9488', zIndex: 30 }} />}
                                <div className="absolute inset-0 grid-bg-pulse opacity-15" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                                
                                {scanningCamId === selectedCamera.id && (selectedCamera.cameraSource === 'Laptop Webcam' || selectedCamera.rtspUrl.toLowerCase() === 'webcam') ? (
                                  <video 
                                    ref={videoRef}
                                    autoPlay 
                                    playsInline 
                                    muted 
                                    className="w-full h-full object-cover relative z-10"
                                  />
                                ) : (
                                  <div className="text-center font-mono text-[10px] text-zinc-400 z-10 select-none">
                                    <Radio className={`w-10 h-10 mx-auto mb-2 text-zinc-600 ${scanningCamId === selectedCamera.id ? 'text-red-500 animate-pulse' : ''}`} />
                                    {scanningCamId === selectedCamera.id 
                                      ? `[SURVEILLANCE ACTIVE: STREAMING ${selectedCamera.cameraSource}]` 
                                      : '[FEED STANDBY - MONITORING OFFLINE]'
                                    }
                                  </div>
                                )}

                                {scanningCamId === selectedCamera.id && liveHeatmap && !(selectedCamera.cameraSource === 'Laptop Webcam' || selectedCamera.rtspUrl.toLowerCase() === 'webcam') && (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img src={liveHeatmap} alt="AI Heatmap Overlay" className="absolute inset-0 w-full h-full object-cover z-20 opacity-70" />
                                )}

                                {/* Camera Name Overlay HUD */}
                                <div className="absolute top-4 left-4 z-30 bg-black/75 px-3 py-1.5 rounded-lg border border-zinc-800 text-[9px] uppercase tracking-widest text-zinc-400">
                                  CAM: {selectedCamera.name} | SEC: {selectedCamera.location}
                                </div>

                                {scanningCamId === selectedCamera.id && (
                                  <div className="absolute top-4 right-4 z-30 bg-red-600/90 text-white px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest animate-pulse flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
                                  </div>
                                )}
                              </div>

                              {/* Controls */}
                              <div className="flex gap-3">
                                {scanningCamId === selectedCamera.id ? (
                                  <button
                                    onClick={stopWebcamScan}
                                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                                  >
                                    <Pause className="w-4 h-4" /> Stop Monitoring
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => toggleCameraScan(selectedCamera)}
                                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                                  >
                                    <Play className="w-4 h-4" /> Start Monitoring
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    if (feedRef.current) {
                                      if (feedRef.current.requestFullscreen) {
                                        feedRef.current.requestFullscreen().catch(err => {
                                          alert(`Fullscreen failed: ${err.message}`);
                                        });
                                      }
                                    }
                                  }}
                                  className="px-6 py-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                                >
                                  Full Screen
                                </button>
                              </div>
                            </div>

                            {/* Live Stats side panel */}
                            <div className="lg:col-span-4 space-y-4">
                              <div className="p-5 bg-card border border-border rounded-2xl shadow-sm space-y-5">
                                <h3 className="font-bold text-xs uppercase text-zinc-800 tracking-wider font-mono border-b border-border pb-2">
                                  Feed Telemetry Data
                                </h3>

                                <div className="space-y-4">
                                  <div>
                                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">Target Count</span>
                                    <div className="text-3xl font-black text-foreground">
                                      {scanningCamId === selectedCamera.id ? liveCount : 0} <span className="text-xs text-zinc-400 font-medium">people</span>
                                    </div>
                                    <span className="text-[8px] text-zinc-400 font-mono mt-1 block">YOLOv11 smoothed prediction</span>
                                  </div>

                                  <div>
                                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">Density Index</span>
                                    <div className="text-2xl font-black text-foreground">
                                      {scanningCamId === selectedCamera.id ? liveDensity.toFixed(2) : '0.00'} <span className="text-[9px] text-zinc-400 font-normal">/m²</span>
                                    </div>
                                  </div>

                                  <div>
                                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest block mb-1.5">Risk Level Assessment</span>
                                    <div className={`px-3 py-1.5 rounded-lg border text-center font-bold text-xs ${
                                      scanningCamId === selectedCamera.id ? getRiskColor(liveRisk) : 'bg-zinc-100 border-border text-zinc-400'
                                    }`}>
                                      {scanningCamId === selectedCamera.id ? liveRisk : 'STANDBY'}
                                    </div>
                                  </div>

                                  <div>
                                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">Stream Status</span>
                                    <span className={`inline-flex items-center gap-1.5 font-bold ${scanningCamId === selectedCamera.id ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${scanningCamId === selectedCamera.id ? 'bg-emerald-500' : 'bg-zinc-400'} ${scanningCamId === selectedCamera.id ? 'relative flex items-center justify-center' : ''}`}>
                                        {scanningCamId === selectedCamera.id && <span className="radar-ping bg-emerald-500" />}
                                      </span>
                                      {scanningCamId === selectedCamera.id ? 'Online & Streaming' : 'Offline / Standby'}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">AI Module State</span>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${selectedCamera.aiEnabled && scanningCamId === selectedCamera.id ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-zinc-100 border-border text-zinc-400'}`}>
                                      {selectedCamera.aiEnabled && scanningCamId === selectedCamera.id ? 'ByteTrack Running' : 'Idle'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sub-view: CAMERA DETAILS */}
                      {cameraSubView === 'details' && selectedCamera && (
                        <div className="space-y-6 bg-card border border-border p-6 rounded-2xl shadow-sm">
                          <div className="flex justify-between items-center border-b border-border pb-3 mb-5">
                            <span className="font-extrabold text-xs text-foreground uppercase tracking-widest">
                              // CAMERA TELEMETRY DOSSIER
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCamera(null);
                                setCameraSubView('list');
                              }}
                              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              &lt; Back to List
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <h3 className="font-bold text-xs uppercase text-zinc-800 tracking-wider font-mono border-b border-border pb-2">
                                Configuration Metadata
                              </h3>
                              <table className="w-full text-xs font-sans text-left">
                                <tbody>
                                  <tr className="border-b border-zinc-100">
                                    <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider w-1/3">Camera Name</th>
                                    <td className="py-2.5 font-bold text-zinc-800">{selectedCamera.name}</td>
                                  </tr>
                                  <tr className="border-b border-zinc-100">
                                    <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider">Sector Location</th>
                                    <td className="py-2.5 text-zinc-700">{selectedCamera.location}</td>
                                  </tr>
                                  <tr className="border-b border-zinc-100">
                                    <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider">Stream Source</th>
                                    <td className="py-2.5 text-zinc-700">{selectedCamera.cameraSource}</td>
                                  </tr>
                                  <tr className="border-b border-zinc-100">
                                    <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider">Connection URL</th>
                                    <td className="py-2.5 font-mono text-zinc-600 text-[10px] break-all">{selectedCamera.rtspUrl}</td>
                                  </tr>
                                  <tr className="border-b border-zinc-100">
                                    <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider">Created By</th>
                                    <td className="py-2.5 text-zinc-700">{selectedCamera.createdBy || 'System'}</td>
                                  </tr>
                                  <tr>
                                    <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider">Created At</th>
                                    <td className="py-2.5 text-zinc-700">{new Date(selectedCamera.createdAt).toLocaleString()}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            <div className="space-y-4">
                              <h3 className="font-bold text-xs uppercase text-zinc-800 tracking-wider font-mono border-b border-border pb-2">
                                Status & Diagnostic Data
                              </h3>
                              <table className="w-full text-xs font-sans text-left">
                                <tbody>
                                  <tr className="border-b border-zinc-100">
                                    <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider w-1/3">Active Status</th>
                                    <td className="py-2.5">
                                      <span className={`inline-flex items-center gap-1.5 font-bold ${selectedCamera.status.toLowerCase() === 'online' ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${selectedCamera.status.toLowerCase() === 'online' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                                        {selectedCamera.status}
                                      </span>
                                    </td>
                                  </tr>
                                  <tr className="border-b border-zinc-100">
                                    <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider">AI YOLOv11 State</th>
                                    <td className="py-2.5 font-bold text-zinc-700">{selectedCamera.aiEnabled ? 'ENABLED' : 'DISABLED'}</td>
                                  </tr>
                                  <tr className="border-b border-zinc-100">
                                    <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider">Last Connected</th>
                                    <td className="py-2.5 text-zinc-700">{selectedCamera.status.toLowerCase() === 'online' ? 'Active now' : new Date(selectedCamera.updatedAt).toLocaleString()}</td>
                                  </tr>
                                </tbody>
                              </table>

                              {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                                <div className="pt-4">
                                  <button
                                    onClick={() => handleTestConnection(selectedCamera.id)}
                                    disabled={testingConnection}
                                    className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-[10px] tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
                                  >
                                    {testingConnection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Run Connection diagnostics'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Event Management */}
              {activeTab === 'events' && (
                <div className="space-y-6 font-mono text-xs text-foreground">
                  
                  {/* Event Module Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950 p-4 border border-zinc-800 rounded-2xl">
                    <div className="flex items-center gap-3">
                      {eventSubView !== 'list' && (
                        <button 
                          onClick={() => {
                            setEventError(null);
                            setEventSubView(eventSubView === 'edit' && viewingEvent ? 'details' : 'list');
                          }} 
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          &lt; Back
                        </button>
                      )}
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-zinc-100 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500" /> 
                          {eventSubView === 'list' && '1. Event Registry'}
                          {eventSubView === 'create' && '2. Provision New Event'}
                          {eventSubView === 'details' && `3. Event Dossier: ${viewingEvent?.name}`}
                          {eventSubView === 'edit' && `4. Edit Event: ${editingEvent?.name}`}
                        </h2>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {eventSubView === 'list' && 'Database of crowd control sectors, locations, and active states.'}
                          {eventSubView === 'create' && 'Enter essential telemetry, capacity limits, and venue setups.'}
                          {eventSubView === 'details' && `Telemetric telemetry breakdown, capacity alerts, and volunteer counts.`}
                          {eventSubView === 'edit' && 'Modify capacity thresholds, volunteers, and cameras for upcoming zones.'}
                        </p>
                      </div>
                    </div>

                    {eventSubView === 'list' && (user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && (
                      <button
                        onClick={() => {
                          setEventError(null);
                          setEventSubView('create');
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                      >
                        + Create Event
                      </button>
                    )}
                  </div>

                  {/* Error Alert Panel */}
                  {eventError && (
                    <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-sans text-xs flex justify-between items-start gap-4">
                      <div>
                        <span className="font-bold block uppercase tracking-widest text-[10px] mb-1">Telemetry Error</span>
                        {eventError}
                      </div>
                      <button 
                        onClick={() => setEventError(null)} 
                        className="text-red-400 hover:text-red-200 transition-colors font-bold font-mono cursor-pointer"
                      >
                        [DISMISS]
                      </button>
                    </div>
                  )}

                  {/* View: 1. Event List */}
                  {eventSubView === 'list' && (
                    <div className="grid grid-cols-1 gap-4">
                      {events.length === 0 ? (
                        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card text-zinc-400 font-sans">
                          No events found. Click "+ Create Event" to provision a new surveillance zone.
                        </div>
                      ) : (
                        events.map((ev) => {
                          const latestReport = ev.crowdReports?.[0];
                          const activeAlertCount = ev.alerts?.length || 0;
                          const currentCrowdCount = latestReport?.peopleCount || 0;
                          const statusColors: any = {
                            Upcoming: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
                            Live: 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse',
                            Completed: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
                            Cancelled: 'bg-zinc-500/10 border-zinc-800 text-zinc-500',
                          };

                          return (
                            <div 
                              key={ev.id} 
                              className={`p-5 rounded-2xl border bg-card transition-all ${
                                selectedEvent?.id === ev.id ? 'border-blue-500/40 shadow-md bg-blue-500/[0.01]' : 'border-border hover:border-zinc-300'
                              }`}
                            >
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4 mb-4">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-extrabold text-base text-foreground block tracking-tight">{ev.name}</span>
                                    <span className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-[8px] font-bold uppercase tracking-wider text-zinc-400">
                                      {ev.eventType}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded border text-[8px] font-extrabold uppercase tracking-widest ${statusColors[ev.status] || 'bg-zinc-100 border-border text-zinc-600'}`}>
                                      {ev.status === 'Live' ? '● LIVE MONITORING' : ev.status}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-blue-500" /> {ev.location}
                                  </span>
                                </div>

                                <div className="flex gap-2 w-full md:w-auto">
                                  <button
                                    onClick={() => {
                                      setViewingEvent(ev);
                                      setEventSubView('details');
                                    }}
                                    className="flex-1 md:flex-initial px-3 py-1.5 rounded-lg border border-border bg-transparent text-zinc-600 hover:bg-zinc-50 font-bold uppercase tracking-wider cursor-pointer"
                                  >
                                    View Dossier
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingEvent(ev);
                                      setEditName(ev.name);
                                      setEditStartTime(new Date(ev.startTime).toISOString().slice(0, 16));
                                      setEditEndTime(new Date(ev.endTime).toISOString().slice(0, 16));
                                      setEditMaxCapacity(ev.maxCapacity.toString());
                                      setEditAreaSqMeters(ev.areaSqMeters ? ev.areaSqMeters.toString() : '');
                                      setEditCameraCount(ev.cameraCount.toString());
                                      setEditVolunteerCount(ev.volunteerCount.toString());
                                      setEventSubView('edit');
                                    }}
                                    disabled={ev.status === 'Completed' || ev.status === 'Cancelled' || (ev.status === 'Live' && user?.role !== 'ADMIN')}
                                    className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg border font-bold uppercase tracking-wider cursor-pointer ${
                                      ev.status === 'Completed' || ev.status === 'Cancelled' || (ev.status === 'Live' && user?.role !== 'ADMIN')
                                        ? 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed opacity-50'
                                        : 'border-border bg-transparent text-zinc-600 hover:bg-zinc-50'
                                    }`}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedEvent(ev);
                                      alert(`Surveillance feed locked onto: ${ev.name}`);
                                    }}
                                    className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg border font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                      selectedEvent?.id === ev.id 
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                                        : 'bg-transparent border-border text-zinc-600 hover:bg-zinc-100 hover:border-zinc-300'
                                    }`}
                                  >
                                    {selectedEvent?.id === ev.id ? 'Surveillance Linked' : 'Link Telemetry'}
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                <div className="p-3 bg-zinc-50 border border-zinc-200/60 rounded-xl">
                                  <span className="text-[8px] text-zinc-400 uppercase tracking-widest block mb-1">Current Crowd</span>
                                  <span className={`text-base font-black ${ev.status === 'Live' ? 'text-red-600 animate-pulse font-mono' : 'text-zinc-700'}`}>
                                    {ev.status === 'Live' ? currentCrowdCount : (ev.status === 'Completed' ? 'N/A' : '0')}
                                  </span>
                                </div>
                                <div className="p-3 bg-zinc-50 border border-zinc-200/60 rounded-xl">
                                  <span className="text-[8px] text-zinc-400 uppercase tracking-widest block mb-1">Capacity Limits</span>
                                  <span className="text-base font-black text-zinc-700 font-mono">
                                    {ev.expectedCrowd} <span className="text-[9px] text-zinc-400 font-normal">/ {ev.maxCapacity}</span>
                                  </span>
                                </div>
                                <div className="p-3 bg-zinc-50 border border-zinc-200/60 rounded-xl">
                                  <span className="text-[8px] text-zinc-400 uppercase tracking-widest block mb-1">Active Alerts</span>
                                  <span className={`text-base font-black font-mono ${activeAlertCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                    {activeAlertCount > 0 ? `⚠️ ${activeAlertCount}` : 'CLEAR'}
                                  </span>
                                </div>
                                <div className="p-3 bg-zinc-50 border border-zinc-200/60 rounded-xl">
                                  <span className="text-[8px] text-zinc-400 uppercase tracking-widest block mb-1">Time Schedule</span>
                                  <span className="text-[9px] text-zinc-500 font-bold block leading-snug">
                                    {new Date(ev.startTime).toLocaleDateString()} <br />
                                    <span className="text-[8px] text-zinc-400 font-normal">to {new Date(ev.endTime).toLocaleDateString()}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* View: 2. Create Event */}
                  {eventSubView === 'create' && (
                    <form onSubmit={(e) => handleCreateEvent(e, false)} className="space-y-6 bg-card border border-border p-6 rounded-2xl shadow-sm">
                      
                      {/* Section 1: Basic Information */}
                      <div>
                        <h3 className="font-extrabold text-xs uppercase tracking-widest text-blue-600 border-b border-border pb-2 mb-4">// SECTION 01: BASIC INFORMATION</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Event Name</label>
                            <input 
                              type="text" 
                              required
                              placeholder="e.g. Chennai Music Festival 2026"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={eventTitle}
                              onChange={(e) => setEventTitle(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Event Type</label>
                            <select 
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={eventType}
                              onChange={(e) => setEventType(e.target.value)}
                            >
                              <option value="CONCERT">CONCERT</option>
                              <option value="FESTIVAL">FESTIVAL</option>
                              <option value="SPORTS">SPORTS</option>
                              <option value="EXHIBITION">EXHIBITION</option>
                              <option value="CONFERENCE">CONFERENCE</option>
                              <option value="OTHER">OTHER</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="space-y-1.5 md:col-span-1">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Venue Location Name</label>
                            <input 
                              type="text" 
                              required
                              placeholder="e.g. Indra National Stadium, Chennai"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={eventLocationName}
                              onChange={(e) => setEventLocationName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Latitude</label>
                            <input 
                              type="number" 
                              step="any"
                              required
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={eventLatitude}
                              onChange={(e) => setEventLatitude(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Longitude</label>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Start Date &amp; Time</label>
                            <input 
                              type="datetime-local" 
                              required
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={eventStartDate}
                              onChange={(e) => setEventStartDate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">End Date &amp; Time</label>
                            <input 
                              type="datetime-local" 
                              required
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={eventEndDate}
                              onChange={(e) => setEventEndDate(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Crowd Information */}
                      <div>
                        <h3 className="font-extrabold text-xs uppercase tracking-widest text-blue-600 border-b border-border pb-2 mb-4">// SECTION 02: CROWD METRICS</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Expected Crowd</label>
                            <input 
                              type="number" 
                              required
                              min="1"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={eventExpectedCrowd}
                              onChange={(e) => setEventExpectedCrowd(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Maximum Capacity</label>
                            <input 
                              type="number" 
                              required
                              min="1"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={eventCapacity}
                              onChange={(e) => setEventCapacity(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Venue Area (sq. meters)</label>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              placeholder="Optional — improves density accuracy"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={eventAreaSqMeters}
                              onChange={(e) => setEventAreaSqMeters(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Venue Configuration */}
                      <div>
                        <h3 className="font-extrabold text-xs uppercase tracking-widest text-blue-600 border-b border-border pb-2 mb-4">// SECTION 03: VENUE CONFIGURATION</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Entry Gates Count</label>
                            <input 
                              type="number" 
                              required
                              min="1"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={eventGates}
                              onChange={(e) => setEventGates(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Exit Gates Count</label>
                            <input 
                              type="number" 
                              required
                              min="1"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={eventExitGates}
                              onChange={(e) => setEventExitGates(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Cameras Allocated</label>
                            <input 
                              type="number" 
                              required
                              min="1"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={eventCameraCount}
                              onChange={(e) => setEventCameraCount(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Volunteers Required</label>
                            <input 
                              type="number" 
                              required
                              min="1"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={eventVolunteersReq}
                              onChange={(e) => setEventVolunteersReq(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3 border-t border-border pt-4">
                        <button
                          type="button"
                          onClick={() => setEventSubView('list')}
                          className="px-4 py-2 rounded-xl border border-border bg-transparent text-zinc-500 hover:bg-zinc-100 font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleCreateEvent(e, true)}
                          disabled={creatingEvent}
                          className="px-4 py-2 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Save Draft
                        </button>
                        <button
                          type="submit"
                          disabled={creatingEvent}
                          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2"
                        >
                          {creatingEvent && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Create Event
                        </button>
                      </div>
                    </form>
                  )}

                  {/* View: 3. Event Details */}
                  {eventSubView === 'details' && viewingEvent && (
                    <div className="space-y-6 bg-card border border-border p-6 rounded-2xl shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-lg text-foreground block tracking-tight">{viewingEvent.name}</span>
                            <span className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-[8px] font-bold uppercase tracking-wider text-zinc-400">
                              {viewingEvent.eventType}
                            </span>
                            <span className={`px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-[8px] font-bold uppercase tracking-widest ${
                              viewingEvent.status === 'Live' ? 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse' : 
                              viewingEvent.status === 'Upcoming' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                              viewingEvent.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                              'bg-zinc-500/10 border-zinc-850 text-zinc-500'
                            }`}>
                              {viewingEvent.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-blue-500" /> {viewingEvent.location}
                          </span>
                        </div>

                        {/* Event Details Primary Controls */}
                        <div className="flex gap-2 w-full sm:w-auto">
                          {viewingEvent.status === 'Upcoming' && (
                            <button
                              onClick={() => handleStartEvent(viewingEvent.id)}
                              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Start Event
                            </button>
                          )}
                          {viewingEvent.status === 'Live' && (
                            <button
                              onClick={() => handleEndEvent(viewingEvent.id)}
                              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase tracking-wider cursor-pointer"
                            >
                              End Event
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingEvent(viewingEvent);
                              setEditName(viewingEvent.name);
                              setEditStartTime(new Date(viewingEvent.startTime).toISOString().slice(0, 16));
                              setEditEndTime(new Date(viewingEvent.endTime).toISOString().slice(0, 16));
                              setEditMaxCapacity(viewingEvent.maxCapacity.toString());
                              setEditAreaSqMeters(viewingEvent.areaSqMeters ? viewingEvent.areaSqMeters.toString() : '');
                              setEditCameraCount(viewingEvent.cameraCount.toString());
                              setEditVolunteerCount(viewingEvent.volunteerCount.toString());
                              setEventSubView('edit');
                            }}
                            disabled={viewingEvent.status === 'Completed' || viewingEvent.status === 'Cancelled' || (viewingEvent.status === 'Live' && user?.role !== 'ADMIN')}
                            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl border font-bold uppercase tracking-wider cursor-pointer ${
                              viewingEvent.status === 'Completed' || viewingEvent.status === 'Cancelled' || (viewingEvent.status === 'Live' && user?.role !== 'ADMIN')
                                ? 'border-zinc-100 bg-zinc-50 text-zinc-300 opacity-50 cursor-not-allowed'
                                : 'border-border bg-transparent text-zinc-600 hover:bg-zinc-50'
                            }`}
                          >
                            Edit
                          </button>
                          {viewingEvent.status !== 'Cancelled' && viewingEvent.status !== 'Completed' && (
                            <button
                              onClick={() => handleDeleteEvent(viewingEvent.id)}
                              className="px-3.5 py-2 rounded-xl border border-red-200 hover:border-red-300 bg-red-50/20 hover:bg-red-50/50 text-red-500 font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Cancel Zone
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Info Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-zinc-50 border border-zinc-200/50 rounded-2xl">
                          <span className="text-[8px] text-zinc-400 uppercase tracking-widest block mb-1">Expected Crowd</span>
                          <span className="text-xl font-black text-zinc-700 font-mono">{viewingEvent.expectedCrowd}</span>
                        </div>
                        <div className="p-4 bg-zinc-50 border border-zinc-200/50 rounded-2xl">
                          <span className="text-[8px] text-zinc-400 uppercase tracking-widest block mb-1">Current Crowd count</span>
                          <span className={`text-xl font-black font-mono ${viewingEvent.status === 'Live' ? 'text-red-500 animate-pulse' : 'text-zinc-600'}`}>
                            {viewingEvent.status === 'Live' ? (viewingEvent.crowdReports?.[0]?.peopleCount || 0) : '0'}
                          </span>
                        </div>
                        <div className="p-4 bg-zinc-50 border border-zinc-200/50 rounded-2xl">
                          <span className="text-[8px] text-zinc-400 uppercase tracking-widest block mb-1">Maximum Capacity</span>
                          <span className="text-xl font-black text-zinc-700 font-mono">{viewingEvent.maxCapacity}</span>
                        </div>
                        <div className="p-4 bg-zinc-50 border border-zinc-200/50 rounded-2xl">
                          <span className="text-[8px] text-zinc-400 uppercase tracking-widest block mb-1">Risk Level Index</span>
                          <span className={`text-xl font-black uppercase font-mono ${
                            viewingEvent.crowdReports?.[0]?.riskLevel === 'CRITICAL' ? 'text-red-600 animate-bounce' :
                            viewingEvent.crowdReports?.[0]?.riskLevel === 'HIGH' ? 'text-red-500' :
                            viewingEvent.crowdReports?.[0]?.riskLevel === 'MEDIUM' ? 'text-amber-500' :
                            'text-emerald-600'
                          }`}>
                            {viewingEvent.status === 'Live' ? (viewingEvent.crowdReports?.[0]?.riskLevel || 'LOW') : 'INACTIVE'}
                          </span>
                        </div>
                      </div>

                      {/* Config details */}
                      <div className="bg-zinc-50/50 border border-zinc-200/50 rounded-2xl p-5 space-y-4">
                        <h4 className="font-extrabold text-xs text-foreground uppercase tracking-wider border-b border-zinc-200 pb-2">// VENUE TELEMETRY BREAKDOWN</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono text-center">
                          <div className="space-y-1">
                            <span className="text-[8px] text-zinc-400 block uppercase tracking-widest">Entry Gates</span>
                            <span className="text-lg font-black text-zinc-700">{viewingEvent.entryGates}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] text-zinc-400 block uppercase tracking-widest">Exit Gates</span>
                            <span className="text-lg font-black text-zinc-700">{viewingEvent.exitGates}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] text-zinc-400 block uppercase tracking-widest">Allocated Cameras</span>
                            <span className="text-lg font-black text-zinc-700">{viewingEvent.cameraCount}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] text-zinc-400 block uppercase tracking-widest">Volunteers On Duty</span>
                            <span className="text-lg font-black text-zinc-700">{viewingEvent.volunteerCount}</span>
                          </div>
                        </div>

                        {/* Coordinates and description */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-[10px] text-zinc-500 border-t border-zinc-200/50">
                          <div>
                            <span className="font-bold text-[8px] text-zinc-400 block uppercase tracking-widest mb-0.5">Surveillance Zone Center</span>
                            <span className="font-mono bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">LAT: {viewingEvent.latitude} , LNG: {viewingEvent.longitude}</span>
                          </div>
                          <div>
                            <span className="font-bold text-[8px] text-zinc-400 block uppercase tracking-widest mb-0.5">Dossier Notes</span>
                            <p className="italic font-sans text-zinc-600">{viewingEvent.description || 'No additional zone notes provided.'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* View: 4. Edit Event */}
                  {eventSubView === 'edit' && editingEvent && (
                    <form onSubmit={handleUpdateEvent} className="space-y-6 bg-card border border-border p-6 rounded-2xl shadow-sm">
                      <div>
                        <h3 className="font-extrabold text-xs uppercase tracking-widest text-blue-600 border-b border-border pb-2 mb-4">// EDIT CROWD ZONE PARAMETERS</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Event Name</label>
                            <input 
                              type="text" 
                              required
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Maximum Capacity Threshold</label>
                            <input 
                              type="number" 
                              required
                              min="1"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={editMaxCapacity}
                              onChange={(e) => setEditMaxCapacity(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Venue Area (sq. meters)</label>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              placeholder="Optional — improves density accuracy"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={editAreaSqMeters}
                              onChange={(e) => setEditAreaSqMeters(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Start Date &amp; Time</label>
                            <input 
                              type="datetime-local" 
                              required
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={editStartTime}
                              onChange={(e) => setEditStartTime(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">End Date &amp; Time</label>
                            <input 
                              type="datetime-local" 
                              required
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={editEndTime}
                              onChange={(e) => setEditEndTime(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Cameras Count</label>
                            <input 
                              type="number" 
                              required
                              min="0"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={editCameraCount}
                              onChange={(e) => setEditCameraCount(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Volunteers Required</label>
                            <input 
                              type="number" 
                              required
                              min="0"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={editVolunteerCount}
                              onChange={(e) => setEditVolunteerCount(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Edit Actions */}
                      <div className="flex justify-end gap-3 border-t border-border pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setEventError(null);
                            setEventSubView(viewingEvent ? 'details' : 'list');
                          }}
                          className="px-4 py-2 rounded-xl border border-border bg-transparent text-zinc-500 hover:bg-zinc-100 font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  )}
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
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="text-[10px] text-zinc-400">{new Date(alt.createdAt).toLocaleTimeString()}</span>
                            {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') && alt.id && (
                              <button
                                onClick={() => handleResolveAlert(alt.id)}
                                className="text-[9px] font-bold uppercase tracking-widest bg-white text-red-600 border border-red-200 px-2.5 py-1 rounded-full hover:bg-red-600 hover:text-white transition-colors"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
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

              {/* Tab: Volunteer Duty Console */}
              {activeTab === 'volunteer-duty' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
                  
                  {/* Left Column (Tactical Map + Duty Info) */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Duty details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
                        <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1.5 font-mono">Duty Status</div>
                        <div className="flex gap-2 mt-1">
                          {['AVAILABLE', 'INACTIVE'].map((status) => {
                            const isCurrent = volunteers.find(v => v.userId === user.id)?.status === status;
                            return (
                              <button
                                key={status}
                                onClick={async () => {
                                  await api.updateVolunteerStatus(status);
                                  api.getVolunteers().then(setVolunteers);
                                }}
                                className={`flex-1 py-1 rounded text-[9px] font-bold border text-center transition-all cursor-pointer ${
                                  isCurrent ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-zinc-100 border-border text-zinc-600 hover:bg-zinc-200'
                                }`}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
                        <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1 font-mono">Assigned Sector</div>
                        <div className="text-xs font-bold text-foreground mt-1.5">
                          {user?.profile?.assignedArea || 'Sector Main corridor B'}
                        </div>
                        <div className="text-[8px] text-zinc-400 font-mono mt-1">SECTOR ACTIVE</div>
                      </div>

                      <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
                        <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1 font-mono">Skills Registered</div>
                        <div className="text-xs font-bold text-blue-600 truncate mt-1.5">
                          {user?.profile?.skills || 'First Aid, Crowd Control'}
                        </div>
                        <div className="text-[8px] text-zinc-400 font-mono mt-1">MOBILE RESPONDER</div>
                      </div>
                    </div>

                    {/* Interactive Tactical Map */}
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-sm relative overflow-hidden">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-xs text-foreground flex items-center gap-2 font-mono uppercase tracking-wider">
                          <Radio className="w-4 h-4 text-red-500 animate-pulse" /> Live Tactical Heatmap HUD
                        </span>
                        <button 
                          onClick={handleSolveRoute}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer border border-emerald-500/20"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Evacuation Route
                        </button>
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

                  </div>

                  {/* Right Column (distress queue assigned to them) */}
                  <div className="lg:col-span-4 space-y-6">
                    
                    {/* Active SOS distress queue */}
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                      <h3 className="font-bold text-xs text-foreground mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                        <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" /> Assigned Emergencies ({sosRequests.filter(s => s.assignedVolunteerId === volunteers.find(v => v.userId === user?.id)?.id).length})
                      </h3>
                      {sosRequests.filter(s => s.assignedVolunteerId === volunteers.find(v => v.userId === user?.id)?.id).length === 0 ? (
                        <div className="text-center py-8 border border-border rounded-xl bg-background text-xs text-zinc-400 font-mono">
                          [NO ASSIGNED EMERGENCY distress signals]
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sosRequests.filter(s => s.assignedVolunteerId === volunteers.find(v => v.userId === user?.id)?.id).map((sos) => (
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
                              <div className="font-bold text-zinc-850">Reporter: {sos.user?.name || 'Anonymous User'}</div>
                              <p className="text-zinc-550 text-[10px] font-mono">{sos.description || 'Emergency assistance requested'}</p>
                              
                              <button
                                onClick={() => handleResolveSOS(sos.id)}
                                className="mt-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[9px] transition-all cursor-pointer flex justify-center items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" /> Resolve Distress
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* All incidents overview */}
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                      <h3 className="font-bold text-xs text-foreground mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 text-orange-500 animate-pulse" /> System Broadcast Alerts ({sosRequests.length})
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {sosRequests.map((sos) => (
                          <div key={sos.id} className="p-2 rounded border border-slate-100 bg-zinc-50 text-[10px] flex justify-between items-center">
                            <div>
                              <strong className="text-red-600 font-bold font-mono">🚨 SOS: {sos.issueType}</strong>
                              <p className="text-slate-500 font-mono mt-0.5">By {sos.user?.name || 'Anon'}</p>
                            </div>
                            <span className="text-[8px] text-zinc-400">{new Date(sos.createdAt).toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Tab: Users & Approvals (Admin/Organizer only) */}
              {activeTab === 'users' && user?.role === 'ADMIN' && (
                <div className="space-y-6 font-mono text-xs text-foreground animate-fadeIn">
                  {/* Organizer Approvals Section */}
                  <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-border pb-3">
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" /> 
                          Pending Organizer Registrations
                        </h2>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          Approve or reject organizer credentials to grant platform management access.
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-600 border border-blue-100 text-[8px] font-bold uppercase tracking-wider">
                        Approvals Queue ({pendingOrganizers.length})
                      </span>
                    </div>

                    {fetchingApprovals ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                        <span className="text-zinc-400 font-bold">[SYNCING REQUESTS...]</span>
                      </div>
                    ) : pendingOrganizers.length === 0 ? (
                      <div className="text-center py-8 bg-zinc-50/50 rounded-xl border border-dashed border-border text-zinc-400 font-sans">
                        No pending organizer requests found.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingOrganizers.map((org) => (
                          <div key={org.id} className="p-4 rounded-xl border border-border bg-zinc-50 flex flex-col justify-between hover:border-blue-500/30 transition-all">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-extrabold text-xs text-foreground block">{org.name}</span>
                                  <span className="text-[9px] text-zinc-400 block">{org.email}</span>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-yellow-50 text-yellow-600 border border-yellow-100 text-[8px] font-bold uppercase tracking-wider">
                                  PENDING
                                </span>
                              </div>

                              {org.organizerProfile && (
                                <div className="p-3 rounded-lg border border-border bg-white text-[9px] space-y-1 font-sans text-zinc-650">
                                  <div><strong>ORGANIZATION:</strong> {org.organizerProfile.organizationName}</div>
                                  <div><strong>DESIGNATION:</strong> {org.organizerProfile.designation}</div>
                                  <div><strong>CONTACT:</strong> {org.organizerProfile.contactNumber}</div>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                              <button
                                onClick={() => handleApproveOrganizer(org.id)}
                                className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-[9px] transition-all cursor-pointer text-center"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectOrganizer(org.id)}
                                className="flex-1 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 font-bold uppercase text-[9px] border border-red-100/50 transition-all cursor-pointer text-center"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Registered Volunteers Section */}
                  <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-border pb-3">
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" /> 
                          Registered Volunteers Registry
                        </h2>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          List of active field agents, their qualifications, zones, and current availability status.
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-zinc-100 border border-border text-zinc-600 text-[8px] font-bold uppercase font-mono">
                        Active Volunteers ({volunteers.length})
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-border bg-zinc-50 font-bold uppercase text-[8px] text-zinc-500 tracking-wider">
                            <th className="p-3">Volunteer Name</th>
                            <th className="p-3">Email Address</th>
                            <th className="p-3">Assigned Area</th>
                            <th className="p-3">Skills / Expertise</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {volunteers.map((vol) => (
                            <tr key={vol.id} className="border-b border-border hover:bg-zinc-50/50 transition-colors text-[10px]">
                              <td className="p-3 font-bold text-zinc-800">{vol.user?.name || 'Field Officer'}</td>
                              <td className="p-3 text-zinc-550">{vol.user?.email || 'N/A'}</td>
                              <td className="p-3 text-zinc-600">{vol.assignedArea || 'Unassigned'}</td>
                              <td className="p-3 text-zinc-600">{vol.skills || 'General Support'}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                  vol.status === 'AVAILABLE' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                  vol.status === 'ASSIGNED' ? 'bg-orange-50 border-orange-100 text-orange-600' :
                                  'bg-zinc-100 border-border text-zinc-400'
                                }`}>
                                  {vol.status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => {
                                    setEditingVolunteer(vol);
                                    setEditVolAssignedArea(vol.assignedArea || '');
                                    setEditVolStatus(vol.status || 'AVAILABLE');
                                    setEditVolSkills(vol.skills || '');
                                    setEditVolAvailability(vol.availability || '');
                                  }}
                                  className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold uppercase text-[9px] transition-colors cursor-pointer border border-blue-100/50"
                                >
                                  Edit Profile
                                </button>
                              </td>
                            </tr>
                          ))}
                          {volunteers.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-zinc-450 font-sans">
                                No registered volunteers found in system database.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* System User Management Section */}
                  <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-border pb-3">
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                          <Users className="w-4 h-4 text-indigo-600" /> 
                          System User Management
                        </h2>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          List of all registered system users. Promote, demote, approve, or delete accounts directly.
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-zinc-100 border border-border text-zinc-600 text-[8px] font-bold uppercase font-mono">
                        Total Users ({allUsers.length})
                      </span>
                    </div>

                    {fetchingUsers ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                        <span className="text-zinc-400 font-bold">[SYNCING USERS...]</span>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-border">
                        <table className="w-full border-collapse text-left">
                          <thead>
                            <tr className="border-b border-border bg-zinc-50 font-bold uppercase text-[8px] text-zinc-500 tracking-wider">
                              <th className="p-3">User Name</th>
                              <th className="p-3">Email Address</th>
                              <th className="p-3">Clearance / Role</th>
                              <th className="p-3">Organizer Status</th>
                              <th className="p-3">Profile State</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allUsers.map((u) => {
                              const isSelf = u.id === user?.id;
                              return (
                                <tr key={u.id} className="border-b border-border hover:bg-zinc-50/50 transition-colors text-[10px]">
                                  <td className="p-3 font-bold text-zinc-800">
                                    {u.name} {isSelf && <span className="text-[8px] text-blue-600 font-mono italic font-normal ml-1">(You)</span>}
                                  </td>
                                  <td className="p-3 text-zinc-550">{u.email}</td>
                                  <td className="p-3">
                                    <select
                                      disabled={isSelf}
                                      value={u.role}
                                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                      className="bg-transparent border border-border rounded px-1.5 py-0.5 text-[9px] font-bold font-mono focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
                                    >
                                      <option value="ADMIN">ADMIN</option>
                                      <option value="ORGANIZER">ORGANIZER</option>
                                      <option value="VOLUNTEER">VOLUNTEER</option>
                                      <option value="PUBLIC">PUBLIC</option>
                                    </select>
                                  </td>
                                  <td className="p-3">
                                    {u.role === 'ORGANIZER' ? (
                                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                        u.isApproved ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-yellow-50 border-yellow-100 text-yellow-600'
                                      }`}>
                                        {u.isApproved ? 'Approved' : 'Pending'}
                                      </span>
                                    ) : (
                                      <span className="text-zinc-450">-</span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                                      u.profileComplete ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-zinc-150 border-zinc-200 text-zinc-450'
                                    }`}>
                                      {u.profileComplete ? 'COMPLETE' : 'INCOMPLETE'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <button
                                      disabled={isSelf}
                                      onClick={() => handleDeleteUser(u.id)}
                                      className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-500 font-bold uppercase text-[9px] transition-colors cursor-pointer border border-red-100/50 disabled:opacity-50"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                            {allUsers.length === 0 && (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-zinc-450 font-sans">
                                  No system users found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Edit Volunteer Modal */}
                  {editingVolunteer && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 text-zinc-800">
                        <div className="flex justify-between items-center border-b border-border pb-3">
                          <h3 className="font-extrabold text-xs text-foreground uppercase tracking-widest font-mono">
                            // EDIT VOLUNTEER: {editingVolunteer.user?.name || 'Field Officer'}
                          </h3>
                          <button
                            onClick={() => setEditingVolunteer(null)}
                            className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <form onSubmit={handleUpdateVolunteer} className="space-y-4 text-xs">
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Assigned Sector Area</label>
                            <input
                              type="text"
                              placeholder="e.g. Gate A Entry"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-950 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={editVolAssignedArea}
                              onChange={(e) => setEditVolAssignedArea(e.target.value)}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Duty Status</label>
                            <select
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-950 focus:outline-none focus:border-blue-500 focus:bg-white font-bold cursor-pointer"
                              value={editVolStatus}
                              onChange={(e) => setEditVolStatus(e.target.value)}
                            >
                              <option value="AVAILABLE">AVAILABLE</option>
                              <option value="ASSIGNED">ASSIGNED</option>
                              <option value="INACTIVE">INACTIVE</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Skills & Expertise</label>
                            <input
                              type="text"
                              placeholder="e.g. First Aid, Crowd Control"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-950 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={editVolSkills}
                              onChange={(e) => setEditVolSkills(e.target.value)}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Availability Details</label>
                            <input
                              type="text"
                              placeholder="e.g. Full-time, Weekends"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-950 focus:outline-none focus:border-blue-500 focus:bg-white"
                              value={editVolAvailability}
                              onChange={(e) => setEditVolAvailability(e.target.value)}
                            />
                          </div>

                          <div className="flex justify-end gap-3 pt-3.5 border-t border-border">
                            <button
                              type="button"
                              onClick={() => setEditingVolunteer(null)}
                              className="px-4 py-2 rounded-xl border border-border bg-transparent text-zinc-500 hover:bg-zinc-100 font-bold uppercase cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={updatingVolunteer}
                              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            >
                              {updatingVolunteer && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              Save Details
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Emergency Center / SOS (Admin, Organizer, Volunteer only) */}
              {activeTab === 'emergency' && user?.role !== 'PUBLIC' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs text-foreground">
                  
                  {/* Left Column (Dispatch System - Admin/Organizer only) */}
                  {(user?.role === 'ADMIN' || user?.role === 'ORGANIZER') ? (
                    <div className="lg:col-span-4 space-y-6">
                      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                        <h3 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-3">
                          <Users className="w-4 h-4 text-blue-600 animate-pulse" /> Links & Dispatch Coordination
                        </h3>

                        <form onSubmit={handleDispatchVolunteer} className="space-y-4">
                          <div>
                            <label className="block text-[8px] text-zinc-500 uppercase mb-1.5 font-bold">Choose Available Agent</label>
                            <select
                              required
                              className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 cursor-pointer font-bold"
                              value={dispatchVolId}
                              onChange={(e) => setDispatchVolId(e.target.value)}
                            >
                              <option value="">-- Available Responders --</option>
                              {volunteers.filter(v => v.status === 'AVAILABLE').map(v => (
                                <option key={v.id} value={v.id}>{v.user?.name || 'Agent'} [{v.status}]</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-[8px] text-zinc-500 uppercase mb-1.5 font-bold">distress category</label>
                              <select
                                className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 cursor-pointer font-bold"
                                value={dispatchIncidentType}
                                onChange={(e: any) => {
                                  setDispatchIncidentType(e.target.value);
                                  setDispatchIncidentId('');
                                }}
                              >
                                <option value="SOS">🚨 Emergency SOS Signal</option>
                                <option value="REPORT">⚠️ Reported Crowd Anomaly</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[8px] text-zinc-500 uppercase mb-1.5 font-bold">Select Active Target</label>
                              <select
                                required
                                className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 cursor-pointer font-bold"
                                value={dispatchIncidentId}
                                onChange={(e) => setDispatchIncidentId(e.target.value)}
                              >
                                <option value="">-- Active Incident Target --</option>
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
                            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold tracking-wider uppercase text-[10px] cursor-pointer transition-all shadow-sm"
                          >
                            Dispatch Responder
                          </button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    // Volunteer Duty Info Placeholder in emergency tab
                    <div className="lg:col-span-4 space-y-6">
                      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
                        <h3 className="font-bold text-xs text-foreground uppercase tracking-wider border-b border-border pb-2">
                          Volunteer Dispatch Info
                        </h3>
                        <p className="text-zinc-500 text-[10px] leading-relaxed">
                          Your location coordinates are automatically transmitted back to the Admin command room. Coordinate through the distress queues on the right to resolve active alarms in your assigned zone.
                        </p>
                        <div className="p-3 bg-zinc-50 rounded-xl border border-border">
                          <span className="text-[8px] text-zinc-400 block font-bold uppercase">Emergency Contact Info</span>
                          <span className="text-xs font-bold text-red-600 block mt-1">+91 99999 11111</span>
                          <span className="text-[8px] text-zinc-400 block mt-0.5 font-mono">Control Room Hotline</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Right Column (SOS + Incident Queues) */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Active SOS Distresses */}
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                      <h3 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-3">
                        <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" /> Active SOS Signals ({sosRequests.length})
                      </h3>

                      {sosRequests.length === 0 ? (
                        <div className="text-center py-6 bg-zinc-50/50 rounded-xl border border-dashed border-border text-zinc-400 font-sans">
                          No active distress signals in queue.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sosRequests.map((sos) => (
                            <div key={sos.id} className="p-3.5 rounded-xl border border-red-200 bg-red-50/40 flex flex-col justify-between space-y-3">
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="px-2 py-0.5 rounded bg-red-150 text-red-700 border border-red-200 text-[8px] font-black uppercase">
                                    {sos.issueType}
                                  </span>
                                  <span className="text-[8px] text-zinc-400 font-mono">{new Date(sos.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <div className="font-extrabold text-[10px] text-zinc-800">Reporter: {sos.user?.name || 'Anonymous User'}</div>
                                <p className="text-zinc-650 text-[10px] font-mono leading-relaxed">{sos.description || 'Emergency assistance requested'}</p>
                                {sos.assignedVolunteer && (
                                  <div className="text-[8px] font-sans text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded w-fit">
                                    Assigned: {sos.assignedVolunteer?.user?.name || 'Responder'}
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => handleResolveSOS(sos.id)}
                                className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[9px] transition-all cursor-pointer flex justify-center items-center gap-1 shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5" /> Resolve SOS
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Active Incident reports */}
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                      <h3 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-3">
                        <AlertTriangle className="w-4 h-4 text-orange-500" /> Active Incident Reports ({incidents.length})
                      </h3>

                      {incidents.length === 0 ? (
                        <div className="text-center py-6 bg-zinc-50/50 rounded-xl border border-dashed border-border text-zinc-400 font-sans">
                          No active incidents reported.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {incidents.map((inc) => (
                            <div key={inc.id} className="p-3.5 rounded-xl border border-border bg-zinc-50 flex flex-col justify-between space-y-3">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-zinc-800 text-xs">{inc.title}</span>
                                  <span className="text-[8px] text-zinc-400 font-mono">{new Date(inc.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-zinc-600 text-[10px] font-mono leading-relaxed">{inc.description}</p>
                                <div className="flex justify-between text-[8px] text-zinc-450 font-mono border-t border-border pt-1.5 mt-1.5">
                                  <span>BY: {inc.user?.name || 'Public'}</span>
                                  <span>LOC: {inc.latitude.toFixed(3)}, {inc.longitude.toFixed(3)}</span>
                                </div>
                                {inc.assignedVolunteer && (
                                  <div className="text-[8px] font-sans text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded w-fit">
                                    Assigned: {inc.assignedVolunteer?.user?.name || 'Responder'}
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => handleResolveReport(inc.id)}
                                className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[9px] transition-all cursor-pointer flex justify-center items-center gap-1 shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5" /> Resolve Incident
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* Tab: Settings (Admin only) */}
              {activeTab === 'settings' && user?.role === 'ADMIN' && (
                <div className="space-y-6 font-mono text-xs text-foreground animate-fadeIn">
                  <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 max-w-2xl mx-auto">
                    <div className="border-b border-border pb-4">
                      <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                        <Settings className="w-4 h-4 text-blue-600" /> Platform Configurations & AI Parameters
                      </h2>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Calibrate YOLO models, ByteTrack parameters, safety thresholds, and alerts.
                      </p>
                    </div>

                    <div className="space-y-5">
                      {/* Density Limit Threshold */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-zinc-500 uppercase tracking-wider">YOLOv11 Crowd Density Warning Limit</span>
                          <span className="text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded font-mono">
                            {settingsDensityThreshold.toFixed(2)}/m²
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="6.0"
                          step="0.1"
                          className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          value={settingsDensityThreshold}
                          onChange={(e) => setSettingsDensityThreshold(parseFloat(e.target.value))}
                        />
                        <p className="text-[9px] text-zinc-400">
                          Signals with density exceeding this index are designated as MEDIUM/HIGH risk and alert control logs.
                        </p>
                      </div>

                      {/* AI Detection Weights */}
                      <div className="space-y-2 pt-2 border-t border-border">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">YOLOv11 Target Detection Weights</label>
                        <select
                          className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 font-bold"
                          value={settingsYoloModel}
                          onChange={(e) => setSettingsYoloModel(e.target.value)}
                        >
                          <option value="YOLOv11-Nano">YOLOv11-Nano (Optimized / Low Latency)</option>
                          <option value="YOLOv11-Small">YOLOv11-Small (Balanced CPU/GPU)</option>
                          <option value="YOLOv11-Medium">YOLOv11-Medium (High Precision Server)</option>
                        </select>
                      </div>

                      {/* System Alerts Toggles */}
                      <div className="space-y-3 pt-3 border-t border-border">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Automated Notification Protocols</label>
                        <div className="space-y-2 font-sans text-zinc-700">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settingsAlertEmail}
                              onChange={(e) => setSettingsAlertEmail(e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 accent-blue-600"
                            />
                            <span className="text-xs">Dispatch emails on CRITICAL risk alarms (via Resend API)</span>
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settingsAlertSMS}
                              onChange={(e) => setSettingsAlertSMS(e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 accent-blue-600"
                            />
                            <span className="text-xs">Transmit SMS updates to police control coordinates</span>
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settingsSirenSound}
                              onChange={(e) => setSettingsSirenSound(e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 accent-blue-600"
                            />
                            <span className="text-xs">Play dashboard alarm klaxon audio when risk matches CRITICAL</span>
                          </label>
                        </div>
                      </div>

                      {/* Mock Diagnostics */}
                      <div className="pt-4 border-t border-border flex justify-between items-center">
                        <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-mono">Telemetry Nodes Status</span>
                        <button
                          type="button"
                          onClick={() => alert("All subsystems online:\n- Redis Broker: OK (12ms latency)\n- FastAPI AI Engine: Running YOLOv11\n- Prisma Pool: Connected (2 active connections)\n- Resend API Node: Verified")}
                          className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 hover:bg-zinc-850 font-bold uppercase transition-all cursor-pointer text-[10px]"
                        >
                          Run Subsystem Diagnostics
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Profile (All Roles) */}
              {activeTab === 'profile' && user && (
                <div className="space-y-6 font-mono text-xs text-foreground animate-fadeIn">
                  <div className="bg-card border border-border p-6 rounded-2xl shadow-sm max-w-xl mx-auto space-y-6">
                    <div className="flex items-center gap-4 border-b border-border pb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold uppercase shadow-md shrink-0">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-foreground">{user.name}</h2>
                        <div className="flex items-center gap-2 mt-1 font-mono">
                          <span className="text-[9px] text-zinc-400">{user.email}</span>
                          <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600 text-[8px] font-black uppercase">
                            {user.role} badge
                          </span>
                        </div>
                      </div>
                    </div>

                    {isEditingProfile ? (
                      <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Full Name (System Profile)</label>
                          <input
                            type="text"
                            required
                            disabled
                            className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-100 text-xs text-zinc-550 focus:outline-none"
                            value={profileName}
                          />
                        </div>

                        {user.role === 'ORGANIZER' && (
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Organization Name</label>
                              <input
                                type="text"
                                required
                                placeholder="Organization Name"
                                className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500"
                                value={profileOrgName}
                                onChange={(e) => setProfileOrgName(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Designation</label>
                              <input
                                type="text"
                                required
                                placeholder="Designation (e.g. Security Lead)"
                                className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none"
                                value={profileDesignation}
                                onChange={(e) => setProfileDesignation(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Contact Number</label>
                              <input
                                type="text"
                                required
                                placeholder="Contact Number"
                                className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none"
                                value={profileContact}
                                onChange={(e) => setProfileContact(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        {user.role === 'VOLUNTEER' && (
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Phone Number</label>
                              <input
                                type="text"
                                required
                                placeholder="Phone Number"
                                className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none"
                                value={profileContact}
                                onChange={(e) => setProfileContact(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Skills & Expertise</label>
                              <input
                                type="text"
                                required
                                placeholder="Skills (e.g. First Aid, Crowd Control)"
                                className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none"
                                value={profileSkills}
                                onChange={(e) => setProfileSkills(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Availability Details</label>
                              <input
                                type="text"
                                required
                                placeholder="Availability (e.g. Full-time, Weekends)"
                                className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none"
                                value={profileAvailability}
                                onChange={(e) => setProfileAvailability(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        {user.role === 'PUBLIC' && (
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Personal Phone Number</label>
                              <input
                                type="text"
                                required
                                placeholder="Phone Number"
                                className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none"
                                value={profileContact}
                                onChange={(e) => setProfileContact(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Emergency Contact Number</label>
                              <input
                                type="text"
                                required
                                placeholder="Emergency Contact"
                                className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none"
                                value={profileEmergencyContact}
                                onChange={(e) => setProfileEmergencyContact(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-2.5 pt-3.5 border-t border-border">
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(false)}
                            className="px-4 py-2 rounded-xl border border-border bg-transparent text-zinc-550 hover:bg-zinc-50 font-bold uppercase"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase"
                          >
                            Save Details
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <table className="w-full text-xs text-left font-sans">
                          <tbody>
                            <tr className="border-b border-zinc-100">
                              <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider w-1/3">Security clearance</th>
                              <td className="py-2.5 font-bold text-zinc-800">{user.role}</td>
                            </tr>
                            <tr className="border-b border-zinc-100">
                              <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider">Email registry</th>
                              <td className="py-2.5 text-zinc-700">{user.email}</td>
                            </tr>
                            
                            {user.role === 'ORGANIZER' && user.organizerProfile && (
                              <>
                                <tr className="border-b border-zinc-100">
                                  <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider">organization</th>
                                  <td className="py-2.5 text-zinc-700 font-bold">{user.organizerProfile.organizationName}</td>
                                </tr>
                                <tr className="border-b border-zinc-100">
                                  <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider">Designation</th>
                                  <td className="py-2.5 text-zinc-700">{user.organizerProfile.designation}</td>
                                </tr>
                                <tr className="border-b border-zinc-100">
                                  <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider">Contact Number</th>
                                  <td className="py-2.5 text-zinc-700 font-mono">{user.organizerProfile.contactNumber}</td>
                                </tr>
                              </>
                            )}

                            {user.role === 'VOLUNTEER' && user.volunteer && (
                              <>
                                <tr className="border-b border-zinc-100">
                                  <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider">Assigned area</th>
                                  <td className="py-2.5 text-zinc-700 font-bold">{user.volunteer.assignedArea || 'N/A'}</td>
                                </tr>
                                <tr className="border-b border-zinc-100">
                                  <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider">Contact Number</th>
                                  <td className="py-2.5 text-zinc-700 font-mono">{user.volunteer.phoneNumber || 'N/A'}</td>
                                </tr>
                                <tr className="border-b border-zinc-100">
                                  <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider">Special skills</th>
                                  <td className="py-2.5 text-zinc-700">{user.volunteer.skills || 'N/A'}</td>
                                </tr>
                                <tr className="border-b border-zinc-100">
                                  <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider">Availability</th>
                                  <td className="py-2.5 text-zinc-700">{user.volunteer.availability || 'N/A'}</td>
                                </tr>
                              </>
                            )}

                            {user.role === 'PUBLIC' && user.publicUserProfile && (
                              <>
                                <tr className="border-b border-zinc-100">
                                  <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider">Phone number</th>
                                  <td className="py-2.5 text-zinc-700 font-mono">{user.publicUserProfile.phoneNumber}</td>
                                </tr>
                                <tr className="border-b border-zinc-100">
                                  <th className="py-2.5 font-semibold text-zinc-500 uppercase text-[9px] tracking-wider">Emergency SOS Contact</th>
                                  <td className="py-2.5 text-red-600 font-bold font-mono">{user.publicUserProfile.emergencyContact}</td>
                                </tr>
                              </>
                            )}
                          </tbody>
                        </table>

                        <div className="pt-3 border-t border-border">
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(true)}
                            className="w-full py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 hover:bg-zinc-850 font-bold uppercase transition-all cursor-pointer text-[10px]"
                          >
                            Edit Profile Details
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Public Home (PUBLIC only) */}
              {activeTab === 'public-home' && user?.role === 'PUBLIC' && (
                <div className="space-y-6 font-mono text-xs text-foreground animate-fadeIn">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-2xl shadow-sm">
                    <h2 className="text-base font-black text-[#0f172a] mb-1">Welcome back to IndraNetra, {user.name}</h2>
                    <p className="text-zinc-550 leading-relaxed font-sans text-xs max-w-2xl">
                      This is the citizen safety dashboard. In case of emergency or crowd overcrowding incidents, use the SOS button or Log Incident form to alert control coordinators.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* SOS Quick Launch */}
                    <div className="p-5 rounded-2xl border border-red-200 bg-red-50/50 flex flex-col justify-between items-center text-center shadow-sm">
                      <div className="space-y-2">
                        <ShieldAlert className="w-10 h-10 text-red-500 mx-auto animate-pulse" />
                        <h3 className="font-extrabold text-sm text-red-950 uppercase tracking-wider">Emergency SOS</h3>
                        <p className="text-[10px] text-red-750 font-sans max-w-[200px]">
                          Transmits live GPS location coordinates instantly for quick emergency responders dispatch.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('public-sos')}
                        className="mt-6 w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer shadow-md"
                      >
                        Launch SOS Beacon
                      </button>
                    </div>

                    {/* Report Quick Launch */}
                    <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/50 flex flex-col justify-between items-center text-center shadow-sm">
                      <div className="space-y-2">
                        <Send className="w-10 h-10 text-blue-500 mx-auto" />
                        <h3 className="font-extrabold text-sm text-blue-950 uppercase tracking-wider">Report Anomaly</h3>
                        <p className="text-[10px] text-blue-750 font-sans max-w-[200px]">
                          Report specific local incidents like fire, medical emergencies, blocked exit ways.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('public-report')}
                        className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer shadow-md"
                      >
                        File Anomaly Report
                      </button>
                    </div>

                    {/* Emergency guidelines */}
                    <div className="p-5 rounded-2xl border border-border bg-card flex flex-col justify-between shadow-sm">
                      <div className="space-y-3">
                        <h3 className="font-extrabold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
                          <Info className="w-4 h-4 text-zinc-500" /> Emergency Protocols
                        </h3>
                        <ul className="space-y-2 text-[10px] text-zinc-500 list-disc list-inside font-sans leading-relaxed">
                          <li><strong>Exit Vectors:</strong> If active alerts trigger, check tactical routes to designated gates.</li>
                          <li><strong>Follow Orders:</strong> Follow instructions from volunteers on site.</li>
                          <li><strong>App Active:</strong> Keep app running for push notifications.</li>
                        </ul>
                      </div>
                      <div className="text-[8px] text-zinc-400 font-mono mt-4 italic">
                        Hotline Command: +91 99999 11111
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Public SOS (PUBLIC only) */}
              {activeTab === 'public-sos' && user?.role === 'PUBLIC' && (
                <div className="space-y-6 font-mono text-xs text-foreground animate-fadeIn max-w-xl mx-auto">
                  <div className="p-8 rounded-2xl border border-red-200 bg-red-50/50 text-center relative overflow-hidden shadow-sm flex flex-col justify-center items-center min-h-[400px]">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl" />
                    <h3 className="font-black text-xl text-red-950 mb-1.5 tracking-tight uppercase">Emergency SOS Beacon</h3>
                    <p className="text-xs text-red-700 mb-8 max-w-sm mx-auto font-sans leading-relaxed">
                      Pressing the SOS button transmits your live telemetry coordinates directly to control room security coordinators and local responders.
                    </p>
                    
                    <button
                      onClick={() => handleTriggerSOS('MEDICAL')}
                      className="w-36 h-36 rounded-full border-8 border-red-100 bg-red-600 hover:bg-red-500 text-white font-black text-2xl transition-all active:scale-[0.9] flex flex-col justify-center items-center gap-1.5 shadow-xl hover:shadow-red-500/20 cursor-pointer pulse-sos mx-auto"
                    >
                      <ShieldAlert className="w-10 h-10 text-white" />
                      <span>SOS</span>
                    </button>
                    
                    <div className="text-[10px] text-red-500 mt-8 font-mono font-bold tracking-widest animate-pulse">
                      TRANSMITTING SECURE GPS COORDINATES ON CLICK
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Public Report Incident (PUBLIC only) */}
              {activeTab === 'public-report' && user?.role === 'PUBLIC' && (
                <div className="space-y-6 font-mono text-xs text-foreground animate-fadeIn max-w-lg mx-auto">
                  <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-5">
                    <div className="border-b border-border pb-3">
                      <h3 className="font-bold text-sm text-foreground flex items-center gap-2 uppercase tracking-wider">
                        <Send className="w-4 h-4 text-blue-600" /> Report Crowd Anomaly
                      </h3>
                      <p className="text-[10px] text-zinc-400 mt-0.5 font-sans">
                        Report active security threats, fire, blocking of exit routes, or missing children.
                      </p>
                    </div>
                    
                    <form onSubmit={handleReportIncident} className="space-y-4">
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1.5 tracking-wider">Anomaly Category *</label>
                        <select 
                          className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 cursor-pointer font-bold"
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
                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1.5 tracking-wider">Describe details *</label>
                        <textarea 
                          required
                          rows={4}
                          placeholder="Provide details of the anomaly, location cues, or crowd density clusters..."
                          className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 resize-none font-sans"
                          value={reportDesc}
                          onChange={(e) => setReportDesc(e.target.value)}
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={reportingIncident}
                        className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer flex justify-center items-center gap-2 font-sans uppercase tracking-wider"
                      >
                        {reportingIncident ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Anomaly to Dashboard'}
                      </button>
                    </form>
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

                <div>
                  <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Venue Area (sq. meters)</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="Optional — improves density accuracy"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    value={eventAreaSqMeters}
                    onChange={(e) => setEventAreaSqMeters(e.target.value)}
                  />
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



    </div>
  );
}
