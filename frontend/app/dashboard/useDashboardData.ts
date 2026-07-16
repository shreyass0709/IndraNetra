import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

/**
 * Owns every piece of shared state, effect, and handler the dashboard needs —
 * extracted verbatim from the original monolithic page.tsx so behavior is
 * unchanged. The JSX layer (page.tsx + tab components) only reads from this.
 */
export function useDashboardData() {
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

  // Analytics helper calculations
  const totalIncidentsCount = incidents.length + sosRequests.length;
  const peakCrowdCount = chartData.length > 0 ? Math.max(...chartData.map(c => c.count)) : 0;
  const averageCrowdCount = chartData.length > 0 ? Math.round(chartData.reduce((acc, curr) => acc + curr.count, 0) / chartData.length) : 0;
  const avgResponseTimeStr = "3.2 min";

  return {
    router, pathname,
    user, setUser, loading, setLoading, mounted,
    hudLoading, loadingProgress, loadingLogs, activeTab, setActiveTab,
    events, setEvents, selectedEvent, setSelectedEvent, volunteers, setVolunteers,
    incidents, setIncidents, sosRequests, setSosRequests, cameras, setCameras, alerts, setAlerts,
    notifications, setNotifications, unreadCount, setUnreadCount, showNotifications, setShowNotifications,
    liveCount, setLiveCount, liveDensity, setLiveDensity, liveRisk, setLiveRisk, liveHeatmap, setLiveHeatmap,
    routingPath, setRoutingPath, activeRouteGate, setActiveRouteGate,
    eventSubView, setEventSubView, viewingEvent, setViewingEvent, editingEvent, setEditingEvent, eventError, setEventError,
    showCreateEventModal, setShowCreateEventModal,
    eventTitle, setEventTitle, eventType, setEventType, eventLocationName, setEventLocationName,
    eventLatitude, setEventLatitude, eventLongitude, setEventLongitude,
    eventExpectedCrowd, setEventExpectedCrowd, eventCapacity, setEventCapacity, eventAreaSqMeters, setEventAreaSqMeters,
    eventGates, setEventGates, eventExitGates, setEventExitGates,
    eventCameraCount, setEventCameraCount, eventVolunteersReq, setEventVolunteersReq,
    eventStartDate, setEventStartDate, eventEndDate, setEventEndDate, creatingEvent, setCreatingEvent,
    editName, setEditName, editStartTime, setEditStartTime, editEndTime, setEditEndTime,
    editMaxCapacity, setEditMaxCapacity, editAreaSqMeters, setEditAreaSqMeters,
    editCameraCount, setEditCameraCount, editVolunteerCount, setEditVolunteerCount,
    editingVolunteer, setEditingVolunteer, editVolAssignedArea, setEditVolAssignedArea,
    editVolStatus, setEditVolStatus, editVolSkills, setEditVolSkills, editVolAvailability, setEditVolAvailability,
    updatingVolunteer, setUpdatingVolunteer,
    cameraSubView, setCameraSubView, selectedCamera, setSelectedCamera,
    cameraSearchQuery, setCameraSearchQuery, cameraStatusFilter, setCameraStatusFilter,
    camName, setCamName, camLocation, setCamLocation, camSource, setCamSource,
    camRtspUrl, setCamRtspUrl, camAiEnabled, setCamAiEnabled,
    testingConnection, setTestingConnection, creatingCamera, setCreatingCamera,
    scanningCamId, setScanningCamId, webcamStream, setWebcamStream, videoRef, scanIntervalRef, feedRef,
    dispatchVolId, setDispatchVolId, dispatchIncidentId, setDispatchIncidentId,
    dispatchIncidentType, setDispatchIncidentType,
    pendingOrganizers, setPendingOrganizers, fetchingApprovals, setFetchingApprovals,
    allUsers, setAllUsers, fetchingUsers, setFetchingUsers,
    reportTitle, setReportTitle, reportDesc, setReportDesc, reportLat, setReportLat, reportLng, setReportLng,
    reportImage, setReportImage, reportingIncident, setReportingIncident,
    chartData, setChartData,
    settingsDensityThreshold, setSettingsDensityThreshold, settingsAlertEmail, setSettingsAlertEmail,
    settingsAlertSMS, setSettingsAlertSMS, settingsSirenSound, setSettingsSirenSound,
    settingsYoloModel, setSettingsYoloModel,
    isEditingProfile, setIsEditingProfile, profileName, setProfileName, profileOrgName, setProfileOrgName,
    profileDesignation, setProfileDesignation, profileContact, setProfileContact,
    profileEmergencyContact, setProfileEmergencyContact, profileSkills, setProfileSkills,
    profileAvailability, setProfileAvailability,
    socket,
    fetchPendingOrganizers, fetchAllUsers, handleRoleChange, handleDeleteUser, handleUpdateVolunteer,
    handleApproveOrganizer, handleRejectOrganizer, fetchDashboardData, fetchNotifications, handleMarkAllRead,
    handleResolveAlert, handleSolveRoute, handleLogout, handleCreateEvent, handleUpdateEvent, handleDeleteEvent,
    handleStartEvent, handleEndEvent, handleCreateCamera, handleUpdateCamera, handleTestConnection, handleDeleteCamera,
    toggleCameraScan, stopWebcamScan, captureWebcamFrameAndAnalyze, updateLocalStats,
    handleTriggerSOS, handleDispatchVolunteer, handleResolveSOS, handleResolveReport,
    handleSaveProfile, handleReportIncident,
    totalIncidentsCount, peakCrowdCount, averageCrowdCount, avgResponseTimeStr,
  };
}
