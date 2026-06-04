import { describe, test, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { getDetailedHealth } from '../../src/controllers/healthController';
import { prisma } from '../../src/config/db';

// Mocks
vi.mock('../../src/config/db', () => ({
    prisma: {
        $queryRaw: vi.fn()
    }
}));

vi.mock('../../src/utils/helpers', () => ({
    successResponse: (data, msg) => ({ success: true, data, message: msg }),
    errorResponse: (msg) => ({ success: false, message: msg })
}));

// Mock asyncHandler behavior
beforeEach(() => {
    vi.clearAllMocks();
});

describe('Property 8: System Health Monitoring', () => {

    test('Health check accurately reflects DB status', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.boolean(), // dbConnected
                async (dbConnected) => {
                    vi.clearAllMocks();

                    // Mock DB
                    if (dbConnected) {
                        prisma.$queryRaw.mockResolvedValue([1]);
                    } else {
                        prisma.$queryRaw.mockRejectedValue(new Error('DB Error'));
                    }

                    const req = {};
                    const res = {
                        json: vi.fn()
                    };
                    const next = vi.fn(); // asyncHandler uses next for errors

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
                        // Should still return JSON but with degraded status
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
