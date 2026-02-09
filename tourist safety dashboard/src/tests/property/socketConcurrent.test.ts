
import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { useDashboardStore } from '../../store/store';
import { io } from 'socket.io-client';

// Mock dependencies
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

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }
}));

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

describe('Property 6: Multi-Device Concurrent Processing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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

    test('Store correctly handles concurrent updates from multiple devices', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate a list of tourists (devices)
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        name: fc.string(),
                        device_id: fc.string()
                    }),
                    { minLength: 2, maxLength: 5 }
                ),
                // Generate a sequence of updates for these tourists
                fc.array(
                    fc.record({
                        touristIndex: fc.nat(), // We'll mod this by tourists.length
                        lat: fc.float({ min: -90, max: 90 }),
                        lng: fc.float({ min: -180, max: 180 }),
                        timestamp: fc.date()
                    }),
                    { minLength: 10, maxLength: 50 }
                ),
                async (mockTourists, updates) => {
                    const store = useDashboardStore.getState();

                    // 1. Initialize store with tourists
                    useDashboardStore.setState({
                        tourists: mockTourists.map(t => ({
                            ...t,
                            status: 'active',
                            last_location: { lat: 0, lng: 0 },
                            last_seen: new Date()
                        } as any))
                    });

                    // 2. Connect socket
                    store.connectSocket();
                    const onCalls = mockSocket.on.mock.calls;
                    const locationCallback = onCalls.find(call => call[0] === 'location_update')?.[1];

                    if (locationCallback) {
                        // 3. Process updates "concurrently" (sequentially in loop, but logically concurrent events)
                        // In a real scenario, these would come in continuously.
                        // We track expected latest state for verification.
                        const expectedState: Record<string, any> = {};

                        for (const update of updates) {
                            const tourist = mockTourists[update.touristIndex % mockTourists.length];

                            const updateData = {
                                tourist_id: tourist.id,
                                lat: update.lat,
                                lng: update.lng,
                                x: 0, y: 0,
                                status: 'active',
                                timestamp: update.timestamp.toISOString()
                            };

                            // Update our expectation
                            expectedState[tourist.id] = {
                                lat: update.lat,
                                lng: update.lng,
                                timestamp: update.timestamp
                            };

                            // Trigger socket event
                            locationCallback(updateData);
                        }

                        // 4. Verify Final State
                        const finalState = useDashboardStore.getState();

                        mockTourists.forEach(t => {
                            const storeTourist = finalState.tourists.find(st => st.id === t.id);
                            const expected = expectedState[t.id];

                            if (expected) {
                                expect(storeTourist?.location?.lat).toBe(expected.lat);
                                expect(storeTourist?.location?.lng).toBe(expected.lng);
                                expect(new Date(storeTourist?.last_seen!).getTime()).toBe(expected.timestamp.getTime());
                            }
                        });
                    }
                }
            ),
            { numRuns: 20 } // Run enough times to catch race conditions if any (though JS is single threaded, logical races matter)
        );
    });
});
