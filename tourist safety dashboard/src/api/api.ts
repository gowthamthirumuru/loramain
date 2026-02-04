import axios, { AxiosInstance } from 'axios';
import type {
    Alert,
    Emergency,
    ResponseTeam,
    Conversation,
    Message,
    Tourist,
    GeneratedReport,
    DashboardMetrics,
    Anchor,
} from '../types/types';

// ============================================
// API Configuration
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for auth token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for error handling and data extraction
apiClient.interceptors.response.use(
    (response) => {
        // Backend returns { success, data, message } - extract data
        if (response.data && typeof response.data === 'object' && 'data' in response.data) {
            response.data = response.data.data;
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized - redirect to login
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ============================================
// Mock Data Generators
// ============================================

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// Alerts API
// ============================================

export const alertsApi = {
    getAll: async (): Promise<Alert[]> => {
        if (USE_MOCK) {
            await delay(300);
            // Return from store instead
            return [];
        }
        const response = await apiClient.get<Alert[]>('/alerts');
        return response.data;
    },

    getById: async (id: string): Promise<Alert> => {
        if (USE_MOCK) {
            await delay(200);
            throw new Error('Use store for mock data');
        }
        const response = await apiClient.get<Alert>(`/alerts/${id}`);
        return response.data;
    },

    create: async (alert: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> => {
        if (USE_MOCK) {
            await delay(300);
            return {
                ...alert,
                id: `ALT-${Date.now()}`,
                createdAt: new Date().toISOString(),
            } as Alert;
        }
        const response = await apiClient.post<Alert>('/alerts', alert);
        return response.data;
    },

    updateStatus: async (id: string, status: Alert['status']): Promise<Alert> => {
        if (USE_MOCK) {
            await delay(200);
            throw new Error('Use store for mock data');
        }
        const response = await apiClient.patch<Alert>(`/alerts/${id}/status`, { status });
        return response.data;
    },

    assignTeam: async (alertId: string, teamId: string): Promise<Alert> => {
        if (USE_MOCK) {
            await delay(200);
            throw new Error('Use store for mock data');
        }
        const response = await apiClient.patch<Alert>(`/alerts/${alertId}/assign`, { teamId });
        return response.data;
    },
};

// ============================================
// Emergencies API
// ============================================

export const emergenciesApi = {
    getAll: async (): Promise<Emergency[]> => {
        if (USE_MOCK) {
            await delay(300);
            return [];
        }
        const response = await apiClient.get<Emergency[]>('/emergencies');
        return response.data;
    },

    getById: async (id: string): Promise<Emergency> => {
        if (USE_MOCK) {
            await delay(200);
            throw new Error('Use store for mock data');
        }
        const response = await apiClient.get<Emergency>(`/emergencies/${id}`);
        return response.data;
    },

    create: async (emergency: Omit<Emergency, 'id' | 'createdAt'>): Promise<Emergency> => {
        if (USE_MOCK) {
            await delay(300);
            return {
                ...emergency,
                id: `EMG-${Date.now()}`,
                createdAt: new Date().toISOString(),
            } as Emergency;
        }
        const response = await apiClient.post<Emergency>('/emergencies', emergency);
        return response.data;
    },

    updateStatus: async (id: string, status: Emergency['status']): Promise<Emergency> => {
        if (USE_MOCK) {
            await delay(200);
            throw new Error('Use store for mock data');
        }
        const response = await apiClient.patch<Emergency>(`/emergencies/${id}/status`, { status });
        return response.data;
    },

    resolve: async (id: string, notes?: string): Promise<void> => {
        if (USE_MOCK) {
            await delay(200);
            return;
        }
        await apiClient.patch(`/emergencies/${id}/resolve`, { notes });
    },
};

// ============================================
// Teams API
// ============================================

export const teamsApi = {
    getAll: async (): Promise<ResponseTeam[]> => {
        if (USE_MOCK) {
            await delay(300);
            return [];
        }
        const response = await apiClient.get<ResponseTeam[]>('/teams');
        return response.data;
    },

    getById: async (id: string): Promise<ResponseTeam> => {
        if (USE_MOCK) {
            await delay(200);
            throw new Error('Use store for mock data');
        }
        const response = await apiClient.get<ResponseTeam>(`/teams/${id}`);
        return response.data;
    },

    updateStatus: async (id: string, status: ResponseTeam['status']): Promise<ResponseTeam> => {
        if (USE_MOCK) {
            await delay(200);
            throw new Error('Use store for mock data');
        }
        const response = await apiClient.patch<ResponseTeam>(`/teams/${id}/status`, { status });
        return response.data;
    },

    deploy: async (teamId: string, assignmentId: string): Promise<ResponseTeam> => {
        if (USE_MOCK) {
            await delay(200);
            throw new Error('Use store for mock data');
        }
        const response = await apiClient.post<ResponseTeam>(`/teams/${teamId}/deploy`, { assignmentId });
        return response.data;
    },
};

// ============================================
// Tourists API
// ============================================

export const touristsApi = {
    getAll: async (): Promise<Tourist[]> => {
        if (USE_MOCK) {
            await delay(300);
            return [];
        }
        const response = await apiClient.get<Tourist[]>('/tourists');
        return response.data;
    },

    search: async (query: string): Promise<Tourist[]> => {
        if (USE_MOCK) {
            await delay(300);
            return [];
        }
        const response = await apiClient.get<Tourist[]>('/tourists/search', { params: { q: query } });
        return response.data;
    },

    getById: async (id: string): Promise<Tourist> => {
        if (USE_MOCK) {
            await delay(200);
            throw new Error('Use store for mock data');
        }
        const response = await apiClient.get<Tourist>(`/tourists/${id}`);
        return response.data;
    },

    getLocation: async (id: string): Promise<{ lat: number; lng: number }> => {
        if (USE_MOCK) {
            await delay(200);
            return { lat: 27.1751, lng: 78.0421 };
        }
        const response = await apiClient.get<{ lat: number; lng: number }>(`/tourists/${id}/location`);
        return response.data;
    },
};

// ============================================
// Communications API
// ============================================

export const communicationsApi = {
    getConversations: async (): Promise<Conversation[]> => {
        if (USE_MOCK) {
            await delay(300);
            return [];
        }
        const response = await apiClient.get<Conversation[]>('/conversations');
        return response.data;
    },

    getMessages: async (conversationId: number): Promise<Message[]> => {
        if (USE_MOCK) {
            await delay(300);
            return [];
        }
        const response = await apiClient.get<Message[]>(`/conversations/${conversationId}/messages`);
        return response.data;
    },

    sendMessage: async (conversationId: number, message: string): Promise<Message> => {
        if (USE_MOCK) {
            await delay(200);
            return {
                id: Date.now(),
                conversationId,
                sender: 'Command Center',
                message,
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                isOwnMessage: true,
            };
        }
        const response = await apiClient.post<Message>(`/conversations/${conversationId}/messages`, { message });
        return response.data;
    },
};

// ============================================
// Reports API
// ============================================

export const reportsApi = {
    getAll: async (): Promise<GeneratedReport[]> => {
        if (USE_MOCK) {
            await delay(300);
            return [];
        }
        const response = await apiClient.get<GeneratedReport[]>('/reports');
        return response.data;
    },

    generate: async (templateId: number, options: { dateRange?: string; format?: string }): Promise<GeneratedReport> => {
        if (USE_MOCK) {
            await delay(1000);
            return {
                id: Date.now(),
                name: 'Generated Report',
                type: 'custom',
                dateRange: options.dateRange || 'Last 7 days',
                createdBy: 'Admin',
                createdAt: new Date().toISOString(),
                status: 'completed',
                size: '2.5 MB',
            };
        }
        const response = await apiClient.post<GeneratedReport>('/reports/generate', { templateId, ...options });
        return response.data;
    },

    download: async (reportId: number): Promise<Blob> => {
        if (USE_MOCK) {
            await delay(500);
            return new Blob(['Mock report content'], { type: 'application/pdf' });
        }
        const response = await apiClient.get(`/reports/${reportId}/download`, { responseType: 'blob' });
        return response.data;
    },
};

// ============================================
// Dashboard API
// ============================================

export const dashboardApi = {
    getMetrics: async (): Promise<DashboardMetrics> => {
        if (USE_MOCK) {
            await delay(300);
            return {
                activeEmergencies: 2,
                avgResponseTime: 5.8,
                availableTeams: 8,
                totalTeams: 12,
                touristsTracked: 12847,
                touristsChange: 247,
            };
        }
        const response = await apiClient.get<DashboardMetrics>('/dashboard/metrics');
        return response.data;
    },

    getAnalytics: async (timeRange: string) => {
        if (USE_MOCK) {
            await delay(300);
            return {
                incidentTrends: [
                    { date: 'Mon', incidents: 12, resolved: 10, responseTime: 8.5 },
                    { date: 'Tue', incidents: 15, resolved: 13, responseTime: 7.2 },
                    { date: 'Wed', incidents: 8, resolved: 8, responseTime: 6.8 },
                    { date: 'Thu', incidents: 18, resolved: 15, responseTime: 9.1 },
                    { date: 'Fri', incidents: 22, resolved: 19, responseTime: 8.9 },
                    { date: 'Sat', incidents: 11, resolved: 11, responseTime: 7.5 },
                    { date: 'Sun', incidents: 16, resolved: 14, responseTime: 8.2 },
                ],
            };
        }
        const response = await apiClient.get('/dashboard/analytics', { params: { timeRange } });
        return response.data;
    },
};

// ============================================
// Anchors API
// ============================================

export const anchorsApi = {
    getAll: async (): Promise<Anchor[]> => {
        if (USE_MOCK) {
            await delay(300);
            return [];
        }
        const response = await apiClient.get<Anchor[]>('/anchors');
        return response.data;
    },
};

// ============================================
// Export API Client
// ============================================

export { apiClient };
