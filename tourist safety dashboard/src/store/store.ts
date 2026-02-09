
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
            alerts: [],
            emergencies: [],
            teams: [],
            activeTeamId: null,
            conversations: [],
            messages: [],
            notifications: [],
            metrics: null,
            tourists: [],
            anchors: [],
            activeView: 'overview',
            systemStatus: {
                gpsTracking: 'online',
                communications: 'online',
                database: 'online',
                websocket: 'connecting'
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
                const toArray = <T>(data: T[] | { data?: T[] } | any): T[] => {
                    if (Array.isArray(data)) return data;
                    if (data && typeof data === 'object' && Array.isArray(data.data)) return data.data;
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
