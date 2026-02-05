
const fc = require('fast-check');
const { checkOfflineTourists } = require('../../src/services/cronService');
const { prisma } = require('../../src/config/db');
const { LIMITS, TOURIST_STATUS } = require('../../src/config/constants');

// Mocks
jest.mock('../../src/config/db', () => ({
    prisma: {
        tourist: {
            findMany: jest.fn(),
            update: jest.fn()
        }
    }
}));

jest.mock('../../src/utils/socketService', () => ({
    getIO: jest.fn(() => ({ emit: jest.fn() }))
}));

jest.mock('../../src/utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Property 7: Tourist Offline Detection', () => {

    test('Correctly identifies and updates offline tourists', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        last_seen_offset: fc.integer({ min: -LIMITS.OFFLINE_THRESHOLD_MS * 2, max: LIMITS.OFFLINE_THRESHOLD_MS * 2 }),
                        name: fc.string()
                    })
                ),
                async (touristsData) => {
                    jest.clearAllMocks();

                    const now = Date.now();
                    // We expect the query to look for last_seen < now - LIMIT
                    const expectedDate = new Date(now - LIMITS.OFFLINE_THRESHOLD_MS);

                    // Mock what the DB would return.
                    // Since we can't easily mock the Prisma `lt` logic without a real DB, 
                    // we verify the query construction and then verify the processing logic.

                    // We'll simulate that the DB returns ONLY the tourists that are strictly older than the threshold.
                    const offlineTourists = [];

                    for (const t of touristsData) {
                        const lastSeenTime = now - t.last_seen_offset;
                        // If lastSeenTime < threshold (i.e. offset > LIMIT), it IS offline.
                        if (lastSeenTime < (now - LIMITS.OFFLINE_THRESHOLD_MS)) {
                            offlineTourists.push({
                                id: t.id,
                                name: t.name,
                                last_seen: new Date(lastSeenTime),
                                status: TOURIST_STATUS.ACTIVE
                            });
                        }
                    }

                    prisma.tourist.findMany.mockResolvedValue(offlineTourists);

                    await checkOfflineTourists();

                    // 1. Verify Query Date Logic
                    const findCall = prisma.tourist.findMany.mock.calls[0][0];
                    const queryDate = findCall.where.last_seen.lt;

                    // Allow 1000ms jitter for execution time difference
                    expect(Math.abs(queryDate.getTime() - expectedDate.getTime())).toBeLessThan(1000);

                    // 2. Verify Updates
                    // Expect update to be called for exactly the offline tourists returned
                    expect(prisma.tourist.update).toHaveBeenCalledTimes(offlineTourists.length);

                    offlineTourists.forEach(t => {
                        expect(prisma.tourist.update).toHaveBeenCalledWith(
                            expect.objectContaining({
                                where: { id: t.id },
                                data: { status: TOURIST_STATUS.OFFLINE }
                            })
                        );
                    });
                }
            ),
            { numRuns: 50 }
        );
    });
});
