import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
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
} from '../types/types';

// ============================================
// Initial Mock Data
// ============================================

const initialAlerts: Alert[] = [
    {
        id: 'ALT-001',
        type: 'SOS',
        severity: 'critical',
        location: 'Taj Mahal, Agra',
        coordinates: '27.1751, 78.0421',
        tourist: 'John Smith',
        phone: '+1-555-0123',
        description: 'Tourist reported being followed by suspicious individuals',
        time: '2 minutes ago',
        createdAt: new Date().toISOString(),
        status: 'active',
        assignedTeam: 'Alpha Team',
        priority: 1,
    },
    {
        id: 'ALT-002',
        type: 'Medical Emergency',
        severity: 'high',
        location: 'Red Fort, Delhi',
        coordinates: '28.6562, 77.2410',
        tourist: 'Sarah Johnson',
        phone: '+44-7700-900123',
        description: 'Tourist collapsed, possible heat stroke',
        time: '8 minutes ago',
        createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
        status: 'responding',
        assignedTeam: 'Bravo Team',
        priority: 2,
    },
    {
        id: 'ALT-003',
        type: 'Theft',
        severity: 'medium',
        location: 'Marine Drive, Mumbai',
        coordinates: '18.9220, 72.8347',
        tourist: 'Maria Garcia',
        phone: '+34-600-123456',
        description: 'Purse stolen while taking photos, passport missing',
        time: '15 minutes ago',
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        status: 'investigating',
        assignedTeam: 'Charlie Team',
        priority: 3,
    },
];

const initialEmergencies: Emergency[] = [
    {
        id: 'EMG-001',
        type: 'Medical Emergency',
        location: 'Red Fort, Delhi',
        tourist: 'Sarah Johnson',
        severity: 'critical',
        timeElapsed: '8 minutes',
        createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
        assignedTeam: 'Bravo',
        status: 'in_progress',
        coordinates: '28.6562, 77.2410',
    },
    {
        id: 'EMG-002',
        type: 'Security Threat',
        location: 'Taj Mahal, Agra',
        tourist: 'John Smith',
        severity: 'high',
        timeElapsed: '2 minutes',
        createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
        assignedTeam: 'Alpha',
        status: 'dispatched',
        coordinates: '27.1751, 78.0421',
    },
];

const initialTeams: ResponseTeam[] = [
    { id: 'Alpha-5', name: 'Alpha Team', location: 'Mumbai Central', type: 'Medical', status: 'available', members: 4, eta: '4 min' },
    { id: 'Bravo-8', name: 'Bravo Team', location: 'Delhi CP', type: 'Security', status: 'responding', members: 3, eta: '6 min' },
    { id: 'Charlie-3', name: 'Charlie Team', location: 'Agra Station', type: 'Tourist Aid', status: 'available', members: 5, eta: '8 min' },
    { id: 'Delta-1', name: 'Delta Team', location: 'Jaipur Zone', type: 'Search & Rescue', status: 'patrol', members: 4, eta: '5 min' },
];

const initialConversations: Conversation[] = [
    {
        id: 1,
        participant: 'Alpha Team Leader',
        type: 'radio',
        status: 'active',
        lastMessage: 'Responding to SOS at Taj Mahal, ETA 3 minutes',
        time: '2m ago',
        priority: 'high',
        unread: 2,
    },
    {
        id: 2,
        participant: 'Tourist - John Smith',
        type: 'phone',
        status: 'waiting',
        lastMessage: 'Need help with directions to hotel',
        time: '5m ago',
        priority: 'medium',
        unread: 1,
    },
];

const initialMessages: Message[] = [
    { id: 1, conversationId: 1, sender: 'Alpha Team Leader', message: 'Responding to SOS at Taj Mahal, ETA 3 minutes', time: '14:32', isOwnMessage: false },
    { id: 2, conversationId: 1, sender: 'Command Center', message: 'Copy that. Medical unit standing by.', time: '14:33', isOwnMessage: true },
    { id: 3, conversationId: 1, sender: 'Alpha Team Leader', message: 'Arrived on scene. Tourist is conscious. Requesting medical support.', time: '14:35', isOwnMessage: false },
    { id: 4, conversationId: 1, sender: 'Command Center', message: 'Medical team dispatched. ETA 2 minutes.', time: '14:36', isOwnMessage: true },
];

const initialNotifications: Notification[] = [
    { id: 1, type: 'emergency', title: 'Critical Alert - Medical Emergency', message: 'Tourist emergency at Taj Mahal requires immediate response', time: '2 min ago', read: false, severity: 'critical' },
    { id: 2, type: 'system', title: 'System Update Complete', message: 'GPS tracking system successfully updated', time: '15 min ago', read: false, severity: 'info' },
    { id: 3, type: 'weather', title: 'Weather Advisory', message: 'Heavy rain expected in Mumbai region', time: '1 hour ago', read: true, severity: 'warning' },
];

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

    // UI State
    activeView: string;
    selectedAlertId: string | null;
    selectedConversationId: number | null;
    searchQuery: string;

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
            alerts: initialAlerts,
            emergencies: initialEmergencies,
            teams: initialTeams,
            conversations: initialConversations,
            messages: initialMessages,
            notifications: initialNotifications,
            tourists: [],

            // Initial UI State
            activeView: 'overview',
            selectedAlertId: null,
            selectedConversationId: null,
            searchQuery: '',

            // Initial Metrics
            metrics: {
                activeEmergencies: 2,
                avgResponseTime: 5.8,
                availableTeams: 8,
                totalTeams: 12,
                touristsTracked: 12847,
                touristsChange: 247,
            },

            systemStatus: {
                gpsTracking: 'online',
                communications: 'online',
                database: 'online',
                websocket: 'connected',
            },

            // Alert Actions
            addAlert: (alert) => set((state) => ({
                alerts: [alert, ...state.alerts],
                metrics: { ...state.metrics, activeEmergencies: state.metrics.activeEmergencies + 1 }
            })),

            updateAlertStatus: (id, status) => set((state) => ({
                alerts: state.alerts.map((a) =>
                    a.id === id ? { ...a, status, time: 'just now' } : a
                ),
            })),

            assignTeamToAlert: (alertId, teamId) => set((state) => ({
                alerts: state.alerts.map((a) =>
                    a.id === alertId ? { ...a, assignedTeam: teamId } : a
                ),
                teams: state.teams.map((t) =>
                    t.id === teamId ? { ...t, status: 'responding' as const, currentAssignment: alertId } : t
                ),
            })),

            // Emergency Actions
            addEmergency: (emergency) => set((state) => ({
                emergencies: [emergency, ...state.emergencies],
                metrics: { ...state.metrics, activeEmergencies: state.metrics.activeEmergencies + 1 }
            })),

            updateEmergencyStatus: (id, status) => set((state) => ({
                emergencies: state.emergencies.map((e) =>
                    e.id === id ? { ...e, status } : e
                ),
            })),

            resolveEmergency: (id) => set((state) => ({
                emergencies: state.emergencies.filter((e) => e.id !== id),
                metrics: { ...state.metrics, activeEmergencies: Math.max(0, state.metrics.activeEmergencies - 1) }
            })),

            // Team Actions
            updateTeamStatus: (id, status) => set((state) => ({
                teams: state.teams.map((t) =>
                    t.id === id ? { ...t, status } : t
                ),
            })),

            deployTeam: (teamId, assignmentId) => set((state) => ({
                teams: state.teams.map((t) =>
                    t.id === teamId ? { ...t, status: 'responding' as const, currentAssignment: assignmentId } : t
                ),
                metrics: { ...state.metrics, availableTeams: state.metrics.availableTeams - 1 }
            })),

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

            // Data refresh (placeholder for API integration)
            refreshData: async () => {
                // This will be implemented when connecting to the backend
                console.log('Refreshing data...');
            },
        }),
        { name: 'TouristDashboard' }
    )
);

// ============================================
// Selector Hooks
// ============================================

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
