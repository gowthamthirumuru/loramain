import { describe, test, expect, beforeAll, beforeEach, vi } from 'vitest';
import fc from 'fast-check';

describe('Property 5: Real-Time Dashboard Updates', () => {
    let socketService;
    let mockTo;
    let mockEmit;
    let mockIoInstance;

    beforeAll(async () => {
        // Setup Mocks
        vi.resetModules();

        // Database Mock
        vi.doMock('../../src/config/db', () => ({
            prisma: {
                user: { findUnique: vi.fn() }
            }
        }));

        // Socket.io Mock
        mockTo = vi.fn().mockReturnThis();
        mockEmit = vi.fn();
        mockIoInstance = {
            on: vi.fn(),
            use: vi.fn(),
            to: mockTo,
            emit: mockEmit
        };

        vi.doMock('socket.io', () => {
            const mockServer = vi.fn(() => mockIoInstance);
            mockServer.Server = mockServer;
            return mockServer;
        });

        // Dynamic Import of Service
        // This ensures the mock is used when require('socket.io') is called inside
        socketService = await import('../../src/utils/socketService');

        // Initialize
        socketService.init({});
    });

    beforeEach(() => {
        vi.clearAllMocks();
        mockTo.mockReturnThis();
    });

    test('DEBUG: Direct call', () => {
        socketService.emitToUser('123', 'test', {});
    });

    test('emitToUser targets correct room and sends data', async () => {
        await fc.assert(
            fc.property(
                fc.string({ minLength: 1 }),
                fc.string({ minLength: 1 }),
                fc.object(),
                (userId, event, data) => {
                    mockTo.mockClear();
                    mockEmit.mockClear();

                    socketService.emitToUser(userId, event, data);

                    expect(mockTo).toHaveBeenCalledWith(`user:${userId}`);
                    expect(mockEmit).toHaveBeenCalledWith(event, data);
                }
            )
        );
    });

    test('emitSOSAlert broadcasts to sos_alerts room', async () => {
        await fc.assert(
            fc.property(
                fc.record({
                    tourist_id: fc.uuid(),
                    lat: fc.float(),
                    lng: fc.float()
                }),
                (alertData) => {
                    mockTo.mockClear();
                    mockEmit.mockClear();

                    socketService.emitSOSAlert(alertData);

                    expect(mockTo).toHaveBeenCalledWith('sos_alerts');
                    expect(mockEmit).toHaveBeenCalledWith('sos_alert', alertData);
                }
            )
        );
    });
});
