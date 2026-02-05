
const fc = require('fast-check');

// Mock dependencies BEFORE requiring the service
jest.mock('../../src/config/db', () => ({
    prisma: {
        user: {
            findUnique: jest.fn()
        }
    }
}));

const mockTo = jest.fn().mockReturnThis();
const mockEmit = jest.fn();
const mockIoInstance = {
    on: jest.fn(),
    use: jest.fn(),
    to: mockTo,
    emit: mockEmit
};

// Mock socket.io factory function
jest.mock('socket.io', () => {
    return jest.fn(() => mockIoInstance);
});

// Now require the service
const socketService = require('../../src/utils/socketService');

describe('Property 5: Real-Time Dashboard Updates', () => {

    beforeAll(() => {
        // Initialize service once with dummy server
        // This triggers require('socket.io') which returns our mockIoInstance
        socketService.init({});
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockTo.mockReturnThis(); // Ensure chaining works after clear
    });

    test('emitToUser targets correct room and sends data', async () => {
        await fc.assert(
            fc.property(
                fc.string({ minLength: 1 }), // userId
                fc.string({ minLength: 1 }), // event
                fc.object(), // data
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
