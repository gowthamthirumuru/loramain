import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useDashboardStore } from '../store/store';
import {
    alertsApi,
    emergenciesApi,
    teamsApi,
    communicationsApi,
    reportsApi,
    dashboardApi,
    touristsApi
} from './api';
import type { Alert, Emergency, ResponseTeam, DashboardMetrics } from '../types/types';

// ============================================
// Generic API State Hook
// ============================================

interface ApiState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

// ============================================
// Dashboard Metrics Hook
// ============================================

export function useDashboardMetrics() {
    const [state, setState] = useState<ApiState<DashboardMetrics>>({
        data: null,
        loading: true,
        error: null,
    });

    const store = useDashboardStore();

    const fetchMetrics = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const metrics = await dashboardApi.getMetrics();
            setState({ data: metrics, loading: false, error: null });
            // Also update store if needed
            return metrics;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch metrics';
            setState({ data: null, loading: false, error: message });
            // Fall back to store data
            return store.metrics;
        }
    }, [store.metrics]);

    useEffect(() => {
        fetchMetrics();
    }, []);

    return {
        ...state,
        refetch: fetchMetrics,
        // If API fails, use store data as fallback
        metrics: state.data || store.metrics,
    };
}

// ============================================
// Alerts Hook with CRUD Operations
// ============================================

export function useAlertsApi() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const store = useDashboardStore();

    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const alerts = await alertsApi.getAll();
            if (alerts.length > 0) {
                // Update store with API data
                alerts.forEach(alert => store.addAlert(alert));
            }
            return alerts;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch alerts';
            setError(message);
            // Continue using store data
            return store.alerts;
        } finally {
            setLoading(false);
        }
    }, [store]);

    const updateStatus = useCallback(async (id: string, status: Alert['status']) => {
        setLoading(true);
        try {
            await alertsApi.updateStatus(id, status);
            store.updateAlertStatus(id, status);
            toast.success('Alert status updated');
        } catch (err) {
            // Update store anyway (optimistic update)
            store.updateAlertStatus(id, status);
            toast.success('Alert status updated (offline mode)');
        } finally {
            setLoading(false);
        }
    }, [store]);

    const assignTeam = useCallback(async (alertId: string, teamId: string) => {
        setLoading(true);
        try {
            await alertsApi.assignTeam(alertId, teamId);
            store.assignTeamToAlert(alertId, teamId);
            toast.success('Team assigned to alert');
        } catch (err) {
            // Optimistic update
            store.assignTeamToAlert(alertId, teamId);
            toast.success('Team assigned (offline mode)');
        } finally {
            setLoading(false);
        }
    }, [store]);

    return {
        loading,
        error,
        alerts: store.alerts,
        fetchAlerts,
        updateStatus,
        assignTeam,
    };
}

// ============================================
// Emergencies Hook with CRUD Operations
// ============================================

export function useEmergenciesApi() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const store = useDashboardStore();

    const fetchEmergencies = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const emergencies = await emergenciesApi.getAll();
            if (emergencies.length > 0) {
                emergencies.forEach(e => store.addEmergency(e));
            }
            return emergencies;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch emergencies';
            setError(message);
            return store.emergencies;
        } finally {
            setLoading(false);
        }
    }, [store]);

    const updateStatus = useCallback(async (id: string, status: Emergency['status']) => {
        setLoading(true);
        try {
            await emergenciesApi.updateStatus(id, status);
            store.updateEmergencyStatus(id, status);
            toast.success('Emergency status updated');
        } catch (err) {
            store.updateEmergencyStatus(id, status);
            toast.success('Emergency status updated (offline mode)');
        } finally {
            setLoading(false);
        }
    }, [store]);

    const resolveEmergency = useCallback(async (id: string, notes?: string) => {
        setLoading(true);
        try {
            await emergenciesApi.resolve(id, notes);
            store.resolveEmergency(id);
            toast.success('Emergency resolved');
        } catch (err) {
            store.resolveEmergency(id);
            toast.success('Emergency resolved (offline mode)');
        } finally {
            setLoading(false);
        }
    }, [store]);

    return {
        loading,
        error,
        emergencies: store.emergencies,
        fetchEmergencies,
        updateStatus,
        resolveEmergency,
    };
}

// ============================================
// Teams Hook
// ============================================

export function useTeamsApi() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const store = useDashboardStore();

    const fetchTeams = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const teams = await teamsApi.getAll();
            return teams.length > 0 ? teams : store.teams;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch teams';
            setError(message);
            return store.teams;
        } finally {
            setLoading(false);
        }
    }, [store]);

    const deployTeam = useCallback(async (teamId: string, assignmentId: string) => {
        setLoading(true);
        try {
            await teamsApi.deploy(teamId, assignmentId);
            store.deployTeam(teamId, assignmentId);
            toast.success('Team deployed');
        } catch (err) {
            store.deployTeam(teamId, assignmentId);
            toast.success('Team deployed (offline mode)');
        } finally {
            setLoading(false);
        }
    }, [store]);

    const updateStatus = useCallback(async (teamId: string, status: ResponseTeam['status']) => {
        setLoading(true);
        try {
            await teamsApi.updateStatus(teamId, status);
            store.updateTeamStatus(teamId, status);
            toast.success('Team status updated');
        } catch (err) {
            store.updateTeamStatus(teamId, status);
            toast.success('Team status updated (offline mode)');
        } finally {
            setLoading(false);
        }
    }, [store]);

    return {
        loading,
        error,
        teams: store.teams,
        availableTeams: store.teams.filter(t => t.status === 'available'),
        fetchTeams,
        deployTeam,
        updateStatus,
    };
}

// ============================================
// Reports Hook
// ============================================

export function useReportsApi() {
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generateReport = useCallback(async (templateId: number, options: { dateRange?: string; format?: string }) => {
        setGenerating(templateId);
        setError(null);
        try {
            const report = await reportsApi.generate(templateId, options);
            toast.success('Report generated successfully', {
                description: report.name
            });
            return report;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to generate report';
            setError(message);
            toast.error('Failed to generate report');
            return null;
        } finally {
            setGenerating(null);
        }
    }, []);

    const downloadReport = useCallback(async (reportId: number, reportName: string) => {
        setLoading(true);
        try {
            const blob = await reportsApi.download(reportId);
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportName}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Report downloaded');
        } catch (err) {
            toast.error('Failed to download report');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        generating,
        error,
        generateReport,
        downloadReport,
    };
}

// ============================================
// Tourist Search Hook
// ============================================

export function useTouristSearch() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const search = useCallback(async (query: string) => {
        if (!query.trim()) {
            setResults([]);
            return [];
        }

        setLoading(true);
        setError(null);
        try {
            const tourists = await touristsApi.search(query);
            setResults(tourists);
            if (tourists.length === 0) {
                toast.info('No tourists found', { description: `No results for "${query}"` });
            }
            return tourists;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Search failed';
            setError(message);
            toast.error('Search failed');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const clearResults = useCallback(() => {
        setResults([]);
        setError(null);
    }, []);

    return {
        loading,
        results,
        error,
        search,
        clearResults,
    };
}

// ============================================
// Analytics Hook
// ============================================

export function useAnalytics(timeRange: string) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const analytics = await dashboardApi.getAnalytics(timeRange);
            setData(analytics);
            return analytics;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
            setError(message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [timeRange]);

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    return {
        loading,
        data,
        error,
        refetch: fetchAnalytics,
    };
}
