
const fc = require('fast-check');
const { getDetailedHealth } = require('../../src/controllers/healthController');
const { prisma } = require('../../src/config/db');

// Mocks
jest.mock('../../src/config/db', () => ({
    prisma: {
        $queryRaw: jest.fn()
    }
}));

jest.mock('../../src/utils/helpers', () => ({
    successResponse: (data, msg) => ({ success: true, data, message: msg }),
    errorResponse: (msg) => ({ success: false, message: msg })
}));

// Mock asyncHandler behavior (simple passthrough for testing)
// But Wait, the controller wraps it. We need to invoke the wrapped function.
// If implementation uses `asyncHandler(async (req, res) => ...)`
// The exported function IS the wrapped one.
// We need to mock request/response.

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Property 8: System Health Monitoring', () => {

    test('Health check accurately reflects DB status', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.boolean(), // dbConnected
                async (dbConnected) => {
                    jest.clearAllMocks();

                    // Mock DB
                    if (dbConnected) {
                        prisma.$queryRaw.mockResolvedValue([1]);
                    } else {
                        prisma.$queryRaw.mockRejectedValue(new Error('DB Error'));
                    }

                    const req = {};
                    const res = {
                        json: jest.fn()
                    };
                    const next = jest.fn(); // asyncHandler uses next for errors

                    // Call the controller
                    await getDetailedHealth(req, res, next);

                    // Verification
                    if (dbConnected) {
                        // Should behave normally
                        expect(res.json).toHaveBeenCalled();
                        const result = res.json.mock.calls[0][0];
                        expect(result.data.status).toBe('healthy');
                        expect(result.data.database.status).toBe('connected');
                        expect(result.data.database.latency_ms).toBeGreaterThanOrEqual(0);
                    } else {
                        // Should still return JSON but with degraded status (as per our logic)
                        // The logic inside getDetailedHealth:
                        // catch (e) { dbStatus = 'error' } ... res.json(...)
                        // So it DOES NOT throw to next() for DB errors, it handles them.
                        expect(res.json).toHaveBeenCalled();
                        const result = res.json.mock.calls[0][0];
                        expect(result.data.status).toBe('degraded');
                        expect(result.data.database.status).toBe('error');
                    }
                }
            )
        );
    });
});
