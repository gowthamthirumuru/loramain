import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
    Alert,
    Emergency,
    ResponseTeam,
    Conversation,
    Message,
    Notification,
    DashboardMetrics,
    SystemStatus,
    Tourist,
    Anchor,
} from '../types/types';
import { alertsApi, emergenciesApi, teamsApi, communicationsApi, dashboardApi, touristsApi, anchorsApi, apiClient } from '../api/api';
import { toast } from 'sonner';

// ============================================
// Store Interface
// ============================================

interface DashboardStore {
    // Data
    alerts: Alert[];
    emergencies: Emergency[];
    teams: ResponseTeam[];
    conversations: Conversation[];
    messages: Message[];
    notifications: Notification[];
    tourists: Tourist[];
    anchors: Anchor[];

    // UI State
    activeView: string;
    selectedAlertId: string | null;
    selectedConversationId: number | null;
    searchQuery: string;
    isLoading: boolean;
    lastUpdated: Date | null;

    // Metrics
    metrics: DashboardMetrics;
    systemStatus: SystemStatus;

    // Alert Actions
    addAlert: (alert: Alert) => void;
    updateAlertStatus: (id: string, status: Alert['status']) => void;
    assignTeamToAlert: (alertId: string, teamId: string) => void;

    // Emergency Actions
    addEmergency: (emergency: Emergency) => void;
    updateEmergencyStatus: (id: string, status: Emergency['status']) => void;
    resolveEmergency: (id: string) => void;

    // Team Actions
    updateTeamStatus: (id: string, status: ResponseTeam['status']) => void;
    deployTeam: (teamId: string, assignmentId: string) => void;

    // Conversation Actions
    addConversation: (conversation: Conversation) => void;
    addMessage: (message: Omit<Message, 'id'>) => void;
    markConversationRead: (conversationId: number) => void;

    // Notification Actions
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    markNotificationRead: (id: number) => void;
    markAllNotificationsRead: () => void;

    // UI Actions
    setActiveView: (view: string) => void;
    setSelectedAlert: (id: string | null) => void;
    setSelectedConversation: (id: number | null) => void;
    setSearchQuery: (query: string) => void;

    // Data refresh
    refreshData: () => Promise<void>;
}

// ============================================
// Store Implementation
// ============================================

export const useDashboardStore = create<DashboardStore>()(
    devtools(
        (set, get) => ({
            // Initial Data
            alerts: [],
            emergencies: [],
            teams: [],
            conversations: [],
            messages: [],
            notifications: [],
            tourists: [],
            anchors: [],

            // Initial UI State
            activeView: 'overview',
            selectedAlertId: null,
            selectedConversationId: null,
            searchQuery: '',
            isLoading: false,
            lastUpdated: null,

            // Initial Metrics
            metrics: {
                activeEmergencies: 0,
                avgResponseTime: 0,
                availableTeams: 0,
                totalTeams: 0,
                touristsTracked: 0,
                touristsChange: 0,
            },

            systemStatus: {
                gpsTracking: 'online',
                communications: 'online',
                database: 'online',
                websocket: 'connecting',
            },

            // Alert Actions
            addAlert: (alert) => set((state) => ({
                alerts: [alert, ...state.alerts],
                metrics: { ...state.metrics, activeEmergencies: state.metrics.activeEmergencies + 1 }
            })),

            updateAlertStatus: (id, status) => {
                // Optimistic update
                set((state) => ({
                    alerts: state.alerts.map((a) =>
                        a.id === id ? { ...a, status, time: 'just now' } : a
                    ),
                }));
                // Call API
                alertsApi.updateStatus(id, status).catch(err => {
                    toast.error('Failed to update alert status');
                    get().refreshData(); // Revert on error
                });
            },

            assignTeamToAlert: (alertId, teamId) => {
                set((state) => ({
                    alerts: state.alerts.map((a) =>
                        a.id === alertId ? { ...a, assignedTeam: teamId } : a
                    ),
                    teams: state.teams.map((t) =>
                        t.id === teamId ? { ...t, status: 'responding' as const, currentAssignment: alertId } : t
                    ),
                }));
                alertsApi.assignTeam(alertId, teamId).catch(err => {
                    toast.error('Failed to assign team');
                    get().refreshData();
                });
            },

            // Emergency Actions
            addEmergency: (emergency) => set((state) => ({
                emergencies: [emergency, ...state.emergencies],
                metrics: { ...state.metrics, activeEmergencies: state.metrics.activeEmergencies + 1 }
            })),

            updateEmergencyStatus: (id, status) => {
                set((state) => ({
                    emergencies: state.emergencies.map((e) =>
                        e.id === id ? { ...e, status } : e
                    ),
                }));
                emergenciesApi.updateStatus(id, status).catch(err => {
                    toast.error('Failed to update emergency status');
                    get().refreshData();
                });
            },

            resolveEmergency: (id) => {
                set((state) => ({
                    emergencies: state.emergencies.filter((e) => e.id !== id),
                    metrics: { ...state.metrics, activeEmergencies: Math.max(0, state.metrics.activeEmergencies - 1) }
                }));
                emergenciesApi.resolve(id).catch(err => {
                    toast.error('Failed to resolve emergency');
                    get().refreshData();
                });
            },

            // Team Actions
            updateTeamStatus: (id, status) => {
                set((state) => ({
                    teams: state.teams.map((t) =>
                        t.id === id ? { ...t, status } : t
                    ),
                }));
                teamsApi.updateStatus(id, status).catch(err => {
                    toast.error('Failed to update team status');
                    get().refreshData();
                });
            },

            deployTeam: (teamId, assignmentId) => {
                set((state) => ({
                    teams: state.teams.map((t) =>
                        t.id === teamId ? { ...t, status: 'responding' as const, currentAssignment: assignmentId } : t
                    ),
                    metrics: { ...state.metrics, availableTeams: state.metrics.availableTeams - 1 }
                }));
                teamsApi.deploy(teamId, assignmentId).catch(err => {
                    toast.error('Failed to deploy team');
                    get().refreshData();
                });
            },

            // Conversation Actions
            addConversation: (conversation) => set((state) => ({
                conversations: [conversation, ...state.conversations],
            })),

            addMessage: (message) => set((state) => ({
                messages: [...state.messages, { ...message, id: state.messages.length + 1 }],
                conversations: state.conversations.map((c) =>
                    c.id === message.conversationId
                        ? { ...c, lastMessage: message.message, time: 'just now' }
                        : c
                ),
            })),

            markConversationRead: (conversationId) => set((state) => ({
                conversations: state.conversations.map((c) =>
                    c.id === conversationId ? { ...c, unread: 0 } : c
                ),
                messages: state.messages.map((m) =>
                    m.conversationId === conversationId ? { ...m, read: true } : m
                ),
            })),

            // Notification Actions
            addNotification: (notification) => set((state) => ({
                notifications: [{ ...notification, id: state.notifications.length + 1 }, ...state.notifications],
            })),

            markNotificationRead: (id) => set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, read: true } : n
                ),
            })),

            markAllNotificationsRead: () => set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, read: true })),
            })),

            // UI Actions
            setActiveView: (view) => set({ activeView: view }),
            setSelectedAlert: (id) => set({ selectedAlertId: id }),
            setSelectedConversation: (id) => set({ selectedConversationId: id }),
            setSearchQuery: (query) => set({ searchQuery: query }),

            // Data refresh
            refreshData: async () => {
                const state = get();
                // Prevent multiple simultaneous refreshes if already loading?
                // For now, let's allow it but set loading
                set({ isLoading: true });

                try {
                    const [metrics, alerts, emergencies, teams, conversations, tourists, anchors] = await Promise.all([
                        dashboardApi.getMetrics().catch(e => state.metrics),
                        alertsApi.getAll().catch(e => []),
                        emergenciesApi.getAll().catch(e => []),
                        teamsApi.getAll().catch(e => []),
                        communicationsApi.getConversations().catch(e => []),
                        touristsApi.getAll().catch(e => []),
                        anchorsApi.getAll().catch(e => [])
                    ]);

                    set({
                        metrics,
                        alerts,
                        emergencies,
                        teams,
                        conversations,
                        tourists,
                        anchors,
                        isLoading: false,
                        lastUpdated: new Date()
                    });
                } catch (error) {
                    console.error('Failed to refresh data', error);
                    set({ isLoading: false });
                }
            },
        }),
        { name: 'TouristDashboard' }
    )
);

// ============================================
// Selector Hooks
// ============================================

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

// Computed selectors - return primitives instead of filtered arrays to avoid infinite loops
export const useUnreadNotificationsCount = () =>
    useDashboardStore((state) => state.notifications.filter((n) => !n.read).length);

export const useAvailableTeamsCount = () =>
    useDashboardStore((state) => state.teams.filter((t) => t.status === 'available').length);
