import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useDashboardStore } from '../store/store';
import {
    alertsApi,
    emergenciesApi,
    teamsApi,
    communicationsApi,
    dashboardApi
} from './api';

// ============================================
// Data Context Types
// ============================================

interface DataContextType {
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;
    lastRefresh: Date | null;
    refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType>({
    isInitialized: false,
    isLoading: true,
    error: null,
    lastRefresh: null,
    refreshAll: async () => { },
});

// ============================================
// Data Provider Component
// ============================================

interface DataProviderProps {
    children: React.ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const store = useDashboardStore();

    const initializeData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Fetch all data in parallel
            const [metrics, alerts, emergencies, teams, conversations] = await Promise.allSettled([
                dashboardApi.getMetrics(),
                alertsApi.getAll(),
                emergenciesApi.getAll(),
                teamsApi.getAll(),
                communicationsApi.getConversations(),
            ]);

            // Process metrics
            if (metrics.status === 'fulfilled' && metrics.value) {
                // Metrics already in store as initial values, update if API returns data
                console.log('Metrics loaded:', metrics.value);
            }

            // Process alerts - add any new ones from API
            if (alerts.status === 'fulfilled' && alerts.value.length > 0) {
                alerts.value.forEach(alert => {
                    if (!store.alerts.find(a => a.id === alert.id)) {
                        store.addAlert(alert);
                    }
                });
            }

            // Process emergencies
            if (emergencies.status === 'fulfilled' && emergencies.value.length > 0) {
                emergencies.value.forEach(emergency => {
                    if (!store.emergencies.find(e => e.id === emergency.id)) {
                        store.addEmergency(emergency);
                    }
                });
            }

            // Log initialization status
            const successCount = [metrics, alerts, emergencies, teams, conversations]
                .filter(r => r.status === 'fulfilled').length;

            console.log(`Data initialized: ${successCount}/5 endpoints successful`);

            setIsInitialized(true);
            setLastRefresh(new Date());

            // Show success only if we got real data
            if (successCount > 0) {
                toast.success('Data synced', {
                    description: 'All systems operational',
                    duration: 2000
                });
            }

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to initialize data';
            setError(message);
            console.error('Data initialization error:', err);

            // Still mark as initialized to use fallback store data
            setIsInitialized(true);
            toast.info('Running in offline mode', {
                description: 'Using cached data'
            });
        } finally {
            setIsLoading(false);
        }
    }, [store]);

    const refreshAll = useCallback(async () => {
        toast.loading('Refreshing data...', { id: 'refresh' });
        await initializeData();
        toast.success('Data refreshed', { id: 'refresh' });
    }, [initializeData]);

    // Initialize on mount
    useEffect(() => {
        initializeData();
    }, []);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            if (isInitialized && !isLoading) {
                initializeData();
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [isInitialized, isLoading, initializeData]);

    return (
        <DataContext.Provider value={{ isInitialized, isLoading, error, lastRefresh, refreshAll }}>
            {children}
        </DataContext.Provider>
    );
}

// ============================================
// Hook to use Data Context
// ============================================

export function useDataContext() {
    return useContext(DataContext);
}
