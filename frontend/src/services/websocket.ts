/**
 * WebSocket Service using Socket.IO
 * Real-time communication with the backend
 */

import React from 'react';
import { io, Socket } from 'socket.io-client';
import { useDashboardStore } from '../store/store';
import { tokenManager } from '../api/authApi';
import type { Alert, Emergency, Notification } from '../types/types';

// ============================================
// Types
// ============================================

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
type EventHandler = (event: RealTimeEvent) => void;

export interface RealTimeEvent {
    type: 'alert' | 'emergency' | 'notification' | 'location_update' | 'metric_update' | 'team_status';
    data: any;
    timestamp: Date;
}

// ============================================
// Socket.IO Service
// ============================================

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

let socket: Socket | null = null;
let connectionStatus: ConnectionStatus = 'disconnected';
let statusHandlers: ((status: ConnectionStatus) => void)[] = [];
let eventHandlers: EventHandler[] = [];

const notifyStatusChange = (status: ConnectionStatus) => {
    connectionStatus = status;
    statusHandlers.forEach(handler => handler(status));

    // Update store system status
    useDashboardStore.setState(state => ({
        systemStatus: {
            ...state.systemStatus,
            websocket: status === 'connected' ? 'online' : status === 'connecting' ? 'connecting' : 'offline'
        }
    }));
};

const emitEvent = (event: RealTimeEvent) => {
    eventHandlers.forEach(handler => handler(event));
};

export const websocketService = {
    connect: () => {
        if (socket?.connected || connectionStatus === 'connecting') {
            return;
        }

        const token = tokenManager.getToken();

        notifyStatusChange('connecting');

        socket = io(WS_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        // Connection events
        socket.on('connect', () => {
            console.log('Socket.IO connected:', socket?.id);
            notifyStatusChange('connected');

            // Subscribe to SOS alerts
            socket?.emit('subscribe_sos');

            // Add connection notification
            const notification: Notification = {
                id: Date.now(),
                type: 'system',
                severity: 'info',
                title: 'Connected',
                message: 'Real-time updates are now active',
                time: 'Just now',
                read: false,
            };
            useDashboardStore.getState().addNotification(notification);
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket.IO disconnected:', reason);
            notifyStatusChange('disconnected');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
            notifyStatusChange('error');
        });

        // ============================================
        // Real-time Events from Backend
        // ============================================

        // Location updates from LoRa system
        socket.on('location_update', (data) => {
            console.log('Location update received:', data);
            emitEvent({ type: 'location_update', data, timestamp: new Date() });
            // Could update tourist positions on map
        });

        // SOS Alert triggered
        socket.on('sos_alert', (data) => {
            console.log('SOS Alert received:', data);
            emitEvent({ type: 'alert', data, timestamp: new Date() });

            // Add to store
            const alert: Alert = {
                id: data._id || `sos-${Date.now()}`,
                type: 'SOS',
                severity: 'critical',
                location: data.location || 'Unknown',
                tourist: data.touristName || 'Unknown Tourist',
                phone: data.phone || '',
                description: 'SOS Alert triggered via LoRa device',
                time: 'Just now',
                createdAt: new Date().toISOString(),
                status: 'active',
                coordinates: data.coordinates || '',
                priority: 1,
            };
            useDashboardStore.getState().addAlert(alert);

            // System notification
            const notification: Notification = {
                id: Date.now(),
                type: 'emergency',
                severity: 'critical',
                title: '🚨 SOS Alert',
                message: `Emergency from ${alert.tourist} at ${alert.location}`,
                time: 'Just now',
                read: false,
            };
            useDashboardStore.getState().addNotification(notification);
        });

        // Alert created/updated
        socket.on('alert_created', (data) => {
            console.log('Alert created:', data);
            emitEvent({ type: 'alert', data, timestamp: new Date() });
            useDashboardStore.getState().addAlert(data as Alert);
        });

        socket.on('alert_updated', (data) => {
            console.log('Alert updated:', data);
            if (data.id && data.status) {
                useDashboardStore.getState().updateAlertStatus(data.id, data.status);
            }
        });

        // Emergency updates
        socket.on('emergency_created', (data) => {
            console.log('Emergency created:', data);
            emitEvent({ type: 'emergency', data, timestamp: new Date() });
            useDashboardStore.getState().addEmergency(data as Emergency);
        });

        socket.on('emergency_updated', (data) => {
            console.log('Emergency updated:', data);
            if (data.id && data.status) {
                useDashboardStore.getState().updateEmergencyStatus(data.id, data.status);
            }
        });

        // Team status updates
        socket.on('team_status', (data) => {
            console.log('Team status update:', data);
            emitEvent({ type: 'team_status', data, timestamp: new Date() });
            if (data.teamId && data.status) {
                useDashboardStore.getState().updateTeamStatus(data.teamId, data.status);
            }
        });
    },

    disconnect: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
        notifyStatusChange('disconnected');
    },

    getStatus: () => connectionStatus,

    onStatusChange: (handler: (status: ConnectionStatus) => void) => {
        statusHandlers.push(handler);
        handler(connectionStatus);
        return () => {
            statusHandlers = statusHandlers.filter(h => h !== handler);
        };
    },

    onEvent: (handler: EventHandler) => {
        eventHandlers.push(handler);
        return () => {
            eventHandlers = eventHandlers.filter(h => h !== handler);
        };
    },

    // Subscribe to specific tourist updates
    subscribeTourist: (touristId: string) => {
        socket?.emit('subscribe_tourist', touristId);
    },

    // For testing - simulate an alert locally
    simulateAlert: () => {
        const alertTypes = ['SOS Alert', 'Medical Emergency', 'Security Threat'];
        const locations = ['Taj Mahal, Agra', 'Red Fort, Delhi', 'Gateway of India, Mumbai'];
        const tourists = ['James Wilson', 'Emma Thompson', 'Robert Chen'];

        const alert: Alert = {
            id: `alert-${Date.now()}`,
            type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
            severity: 'high',
            location: locations[Math.floor(Math.random() * locations.length)],
            tourist: tourists[Math.floor(Math.random() * tourists.length)],
            phone: '+91 98765 43210',
            description: 'Test alert generated locally',
            time: 'Just now',
            createdAt: new Date().toISOString(),
            status: 'active',
            coordinates: '27.1751, 78.0421',
            priority: 2,
        };

        useDashboardStore.getState().addAlert(alert);
        emitEvent({ type: 'alert', data: alert, timestamp: new Date() });
    },

    simulateEmergency: () => {
        const emergency: Emergency = {
            id: `emerg-${Date.now()}`,
            type: 'Medical Emergency',
            status: 'dispatched',
            location: 'Taj Mahal, Agra',
            tourist: 'Test Tourist',
            severity: 'high',
            assignedTeam: 'Alpha Team',
            timeElapsed: 'Just now',
            createdAt: new Date().toISOString(),
            coordinates: '27.1751, 78.0421',
        };

        useDashboardStore.getState().addEmergency(emergency);
        emitEvent({ type: 'emergency', data: emergency, timestamp: new Date() });
    },
};

// ============================================
// React Hook
// ============================================

export function useWebSocket() {
    const [status, setStatus] = React.useState<ConnectionStatus>('disconnected');

    React.useEffect(() => {
        const unsubscribe = websocketService.onStatusChange(setStatus);

        // Only connect if authenticated
        if (tokenManager.isAuthenticated()) {
            websocketService.connect();
        }

        return () => {
            unsubscribe();
        };
    }, []);

    return {
        status,
        isConnected: status === 'connected',
        isConnecting: status === 'connecting',
        connect: websocketService.connect,
        disconnect: websocketService.disconnect,
        simulateAlert: websocketService.simulateAlert,
        simulateEmergency: websocketService.simulateEmergency,
    };
}

export default websocketService;
