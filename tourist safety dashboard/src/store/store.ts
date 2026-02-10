
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { Alert, AlertStatus, Emergency, EmergencyStatus, ResponseTeam, TeamStatus, Tourist, Anchor, DashboardMetrics } from '../types/types';
import { alertsApi, emergenciesApi, teamsApi, communicationsApi, dashboardApi, touristsApi, anchorsApi } from '../api/api';

interface DashboardStore {
    alerts: Alert[];
    emergencies: Emergency[];
    teams: ResponseTeam[];
    activeTeamId: string | null;
    conversations: any[];
    messages: any[];
    notifications: any[];
    metrics: DashboardMetrics | null;
    tourists: Tourist[];
    anchors: Anchor[];

    // UI State
    activeView: string;
    setActiveView: (view: string) => void;

    // System Status
    systemStatus: {
        gpsTracking: 'online' | 'offline' | 'degraded';
        communications: 'online' | 'offline' | 'degraded';
        database: 'online' | 'offline' | 'degraded';
        websocket: 'online' | 'offline' | 'connecting';
    };

    // Actions
    fetchInitialData: () => Promise<void>;
    addAlert: (alert: Alert) => void;
    addNotification: (notification: any) => void;
    markNotificationRead: (notificationId: number) => void;
    updateAlertStatus: (id: string, status: AlertStatus) => void;
    addMessage: (message: any) => void;
    assignTeamToAlert: (alertId: string, teamId: string) => void;
    addEmergency: (emergency: Emergency) => void;
    updateEmergencyStatus: (id: string, status: EmergencyStatus) => void;
    resolveEmergency: (id: string) => void;
    updateTeamStatus: (teamId: string, status: TeamStatus) => void;
    deployTeam: (teamId: string, missionType: string) => void;
    refreshData: () => Promise<void>;

    socket: Socket | null;

    // Socket Actions
    connectSocket: () => void;
    disconnectSocket: () => void;

    // Internal state updaters
    handleLocationUpdate: (data: any) => void;
    handleSOSAlert: (data: any) => void;
    handleTouristOffline: (data: any) => void;
}

export const useDashboardStore = create<DashboardStore>()(
    devtools(
        (set, get) => ({
            alerts: [
                {
                    id: 'alert-001',
                    type: 'SOS',
                    severity: 'critical',
                    status: 'active',
                    location: 'Taj Mahal, Agra',
                    tourist: 'John Smith',
                    touristId: 't1',
                    phone: '+1 234 567 8900',
                    description: 'Tourist pressed SOS button, possible medical emergency',
                    time: '10:23 AM',
                    createdAt: new Date().toISOString(),
                    priority: 1
                },
                {
                    id: 'alert-002',
                    type: 'Lost',
                    severity: 'high',
                    status: 'responding',
                    location: 'Jaipur Fort, Rajasthan',
                    tourist: 'Maria Garcia',
                    touristId: 't2',
                    phone: '+34 612 345 678',
                    description: 'Tourist separated from group, GPS signal weak',
                    time: '09:45 AM',
                    assignedTeam: 'Team Alpha',
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    priority: 2
                }
            ],
            emergencies: [
                {
                    id: 'emg-001',
                    type: 'Medical',
                    severity: 'critical',
                    status: 'in_progress',
                    location: 'Taj Mahal, Agra',
                    coordinates: '27.1751,78.0421',
                    tourist: 'John Smith',
                    touristId: 't1',
                    timeElapsed: '12 min',
                    assignedTeam: 'Medical Team 1',
                    createdAt: new Date().toISOString()
                }
            ],
            teams: [
                {
                    id: 'team-alpha',
                    name: 'Team Alpha',
                    type: 'Search & Rescue',
                    status: 'responding',
                    location: 'Jaipur Fort',
                    members: 4,
                    eta: '8 min',
                    currentAssignment: 'alert-002'
                },
                {
                    id: 'team-beta',
                    name: 'Team Beta',
                    type: 'Medical',
                    status: 'available',
                    location: 'Agra Station',
                    members: 3,
                    eta: '5 min'
                },
                {
                    id: 'team-gamma',
                    name: 'Team Gamma',
                    type: 'Security',
                    status: 'available',
                    location: 'Delhi Hub',
                    members: 5,
                    eta: '12 min'
                },
                {
                    id: 'medical-1',
                    name: 'Medical Team 1',
                    type: 'Medical',
                    status: 'responding',
                    location: 'Taj Mahal',
                    members: 2,
                    eta: '3 min',
                    currentAssignment: 'emg-001'
                }
            ],
            activeTeamId: null,
            conversations: [
                { id: 1, participant: 'Team Alpha', type: 'radio', status: 'active', lastMessage: 'En route to location', time: '2 min ago', priority: 'high', unread: 0 },
                { id: 2, participant: 'Control Center', type: 'phone', status: 'waiting', lastMessage: 'Awaiting update', time: '5 min ago', priority: 'medium', unread: 1 }
            ],
            messages: [],
            notifications: [
                { id: 1, type: 'emergency', title: 'SOS Alert', message: 'New SOS from John Smith at Taj Mahal', time: '10:23 AM', read: false, severity: 'critical' },
                { id: 2, type: 'system', title: 'Team Deployed', message: 'Medical Team 1 dispatched to Taj Mahal', time: '10:24 AM', read: false, severity: 'info' },
                { id: 3, type: 'weather', title: 'Weather Alert', message: 'High heat warning for Agra region', time: '09:00 AM', read: true, severity: 'warning' }
            ],
            metrics: {
                activeEmergencies: 1,
                avgResponseTime: 5.8,
                availableTeams: 2,
                totalTeams: 4,
                touristsTracked: 1247,
                touristsChange: 23
            },
            tourists: [],
            anchors: [],
            activeView: 'overview',
            systemStatus: {
                gpsTracking: 'online',
                communications: 'online',
                database: 'online',
                websocket: 'online'
            },
            socket: null,

            setActiveView: (view) => set({ activeView: view }),

            addNotification: (notification) => set((state) => ({
                notifications: [notification, ...state.notifications]
            })),

            markNotificationRead: (notificationId) => set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            })),

            updateAlertStatus: (id, status) => set((state) => ({
                alerts: state.alerts.map((a) =>
                    a.id === id ? { ...a, status } : a
                )
            })),

            addEmergency: (emergency) => set((state) => ({
                emergencies: [emergency, ...state.emergencies]
            })),

            updateEmergencyStatus: (id, status) => set((state) => ({
                emergencies: state.emergencies.map((e) =>
                    e.id === id ? { ...e, status } : e
                )
            })),

            resolveEmergency: (id) => set((state) => ({
                emergencies: state.emergencies.map((e) =>
                    e.id === id ? { ...e, status: 'resolved' as EmergencyStatus } : e
                )
            })),

            addMessage: (message) => set((state) => ({
                messages: [message, ...state.messages]
            })),

            assignTeamToAlert: (alertId, teamId) => set((state) => ({
                alerts: state.alerts.map((a) =>
                    a.id === alertId ? { ...a, assignedTeam: teamId } : a
                )
            })),

            updateTeamStatus: (teamId, status) => set((state) => ({
                teams: state.teams.map((t) =>
                    t.id === teamId ? { ...t, status } : t
                )
            })),

            deployTeam: (teamId, missionType) => {
                set((state) => ({
                    teams: state.teams.map((t) =>
                        t.id === teamId ? { ...t, status: 'responding', currentAssignment: missionType } : t
                    )
                }));
                toast.success(`Team dispatched for ${missionType}`);
            },

            refreshData: async () => {
                await get().fetchInitialData();
            },

            fetchInitialData: async () => {
                // Helper to safely extract array from API response
                // Handles: raw arrays, { data: [] }, { alerts: [] }, { teams: [] }, etc.
                const toArray = <T>(data: T[] | Record<string, any> | null | undefined): T[] => {
                    if (!data) return [];
                    if (Array.isArray(data)) return data;
                    if (typeof data === 'object') {
                        // Check common wrapper keys
                        const keys = ['data', 'alerts', 'emergencies', 'teams', 'tourists', 'anchors', 'items', 'results'];
                        for (const key of keys) {
                            if (Array.isArray(data[key])) return data[key];
                        }
                    }
                    return [];
                };

                try {
                    const [alertsRes, emergenciesRes, teamsRes, touristsRes, anchorsRes, metrics] = await Promise.all([
                        alertsApi.getAll(),
                        emergenciesApi.getAll(),
                        teamsApi.getAll(),
                        touristsApi.getAll(),
                        anchorsApi.getAll(),
                        dashboardApi.getMetrics()
                    ]);
                    set({
                        alerts: toArray(alertsRes),
                        emergencies: toArray(emergenciesRes),
                        teams: toArray(teamsRes),
                        tourists: toArray(touristsRes),
                        anchors: toArray(anchorsRes),
                        metrics
                    });
                } catch (error) {
                    console.error(error);
                    toast.error('Failed to fetch initial data');
                }
            },

            addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),

            connectSocket: () => {
                const existingSocket = get().socket;
                if (existingSocket?.connected) return;

                const socket = io('http://localhost:5000', {
                    transports: ['websocket'],
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                });

                socket.on('connect', () => {
                    set((state) => ({
                        systemStatus: { ...state.systemStatus, websocket: 'online' }
                    }));
                    toast.success('Connected to real-time server');
                    socket.emit('subscribe_sos');
                });

                socket.on('disconnect', () => {
                    set((state) => ({
                        systemStatus: { ...state.systemStatus, websocket: 'offline' }
                    }));
                    toast.error('Disconnected from real-time server');
                });

                socket.on('location_update', (data) => {
                    get().handleLocationUpdate(data);
                });

                socket.on('sos_alert', (data) => {
                    get().handleSOSAlert(data);
                });

                socket.on('tourist_offline', (data) => {
                    get().handleTouristOffline(data);
                });

                // Handle anchor updates from IoT gateway
                socket.on('anchor:update', (data) => {
                    set((state) => {
                        const existingIndex = state.anchors.findIndex(a => a.id === data.id || a.anchor_id === data.anchor_id);
                        if (existingIndex >= 0) {
                            // Update existing anchor
                            const updatedAnchors = [...state.anchors];
                            updatedAnchors[existingIndex] = { ...updatedAnchors[existingIndex], ...data };
                            return { anchors: updatedAnchors };
                        } else {
                            // Add new anchor
                            return { anchors: [...state.anchors, data] };
                        }
                    });
                });

                set({ socket });
            },

            disconnectSocket: () => {
                const socket = get().socket;
                if (socket) {
                    socket.disconnect();
                    set({ socket: null });
                }
            },

            handleLocationUpdate: (data) => {
                set((state) => {
                    const updatedTourists = state.tourists.map(t =>
                        t.id === data.tourist_id ? {
                            ...t,
                            location: { x: data.x, y: data.y, lat: data.lat, lng: data.lng, address: t.location?.address || 'Unknown' },
                            status: data.status,
                            last_seen: new Date(data.timestamp)
                        } : t
                    );
                    return { tourists: updatedTourists };
                });
            },

            handleSOSAlert: (data) => {
                const newAlert: Alert = {
                    id: data.sos_id || `alert-${Date.now()}`,
                    type: 'sos',
                    status: 'active',
                    severity: 'critical',
                    location: `Lat: ${data.location.lat}, Lng: ${data.location.lng}`,
                    time: 'Just now',
                    description: `SOS from ${data.tourist_name}`,
                    assignedTeam: undefined,
                    // Add missing required fields based on lint error: tourist, phone, createdAt, priority
                    tourist: data.tourist_name || 'Unknown',
                    touristId: data.tourist_id || 'unknown',
                    phone: 'Unknown',
                    createdAt: new Date().toISOString(),
                    priority: 1 // High priority
                };

                get().addAlert(newAlert);
                toast.error(`SOS Alert: ${data.tourist_name}`);

                set((state) => ({
                    tourists: state.tourists.map(t =>
                        t.id === data.tourist_id ? { ...t, status: 'sos' as const } : t
                    )
                }));
            },

            handleTouristOffline: (data) => {
                set((state) => ({
                    tourists: state.tourists.map(t =>
                        t.id === data.tourist_id ? { ...t, status: 'offline' as const } : t
                    )
                }));
                toast.warning(`Tourist ${data.name} is offline`);
            },
        }),
        { name: 'DashboardStore' }
    )
);

export const useTourists = () => useDashboardStore((state) => state.tourists);
export const useAnchors = () => useDashboardStore((state) => state.anchors);
export const useAlerts = () => useDashboardStore((state) => state.alerts);
export const useEmergencies = () => useDashboardStore((state) => state.emergencies);
export const useTeams = () => useDashboardStore((state) => state.teams);
export const useConversations = () => useDashboardStore((state) => state.conversations);
export const useMessages = () => useDashboardStore((state) => state.messages);
export const useNotifications = () => useDashboardStore((state) => state.notifications);
export const useMetrics = () => useDashboardStore((state) => state.metrics);
export const useSystemStatus = () => useDashboardStore((state) => state.systemStatus);
export const useUnreadNotificationsCount = () => useDashboardStore((state) => state.notifications.filter((n) => !n.read).length);
export const useAvailableTeamsCount = () => useDashboardStore((state) => state.teams.filter((t) => t.status === 'available').length);
