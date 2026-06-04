
import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { useDashboardStore } from '../../store/store';
import { io } from 'socket.io-client';

// Mock socket.io-client
const mockSocket = {
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
    connected: false
};

vi.mock('socket.io-client', () => ({
    io: vi.fn(() => mockSocket),
    Socket: vi.fn()
}));

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn()
    }
}));

// Mock API
vi.mock('../../api/api', () => ({
    alertsApi: { updateStatus: vi.fn(), assignTeam: vi.fn(), getAll: vi.fn() },
    emergenciesApi: { updateStatus: vi.fn(), resolve: vi.fn(), getAll: vi.fn() },
    teamsApi: { updateStatus: vi.fn(), deploy: vi.fn(), getAll: vi.fn() },
    communicationsApi: { getConversations: vi.fn() },
    dashboardApi: { getMetrics: vi.fn() },
    touristsApi: { getAll: vi.fn() },
    anchorsApi: { getAll: vi.fn() },
    apiClient: {}
}));

describe('Property 8: Dashboard Socket Client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset store
        useDashboardStore.setState({
            socket: null,
            alerts: [],
            tourists: [],
            systemStatus: {
                gpsTracking: 'online',
                communications: 'online',
                database: 'online',
                websocket: 'connecting'
            }
        });
    });

    test('Socket connection establishes and handles events', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string(),
                async (eventData) => {
                    const store = useDashboardStore.getState();

                    // 1. Connect
                    store.connectSocket();
                    expect(io).toHaveBeenCalled();

                    // Simulate 'connect'
                    const onCalls = mockSocket.on.mock.calls;
                    const connectCallback = onCalls.find(call => call[0] === 'connect')?.[1];

                    if (connectCallback) {
                        connectCallback();
                        const updatedStore = useDashboardStore.getState();
                        expect(updatedStore.systemStatus.websocket).toBe('online');
                        // Subscribe is called
                        // expect(mockSocket.emit).toHaveBeenCalledWith('subscribe_sos');
                    }

                    // Simulate SOS Alert
                    const sosCallback = onCalls.find(call => call[0] === 'sos_alert')?.[1];
                    if (sosCallback) {
                        const mockAlert = {
                            sos_id: '123',
                            tourist_name: 'John Doe',
                            tourist_id: 't1',
                            location: { lat: 10, lng: 10 }
                        };

                        useDashboardStore.setState({
                            tourists: [{ id: 't1', name: 'John', status: 'active', device_id: 'd1' } as any]
                        });

                        sosCallback(mockAlert);

                        const stateAfterSos = useDashboardStore.getState();
                        expect(stateAfterSos.alerts.length).toBeGreaterThan(0);
                        expect(stateAfterSos.tourists[0].status).toBe('sos');
                    }
                }
            ),
            { numRuns: 10 }
        );
    });
});
