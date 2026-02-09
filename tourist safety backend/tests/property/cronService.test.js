import { describe, test, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { checkOfflineTourists } from '../../src/services/cronService';
import { prisma } from '../../src/config/db';
import { LIMITS, TOURIST_STATUS } from '../../src/config/constants';

// Mocks
vi.mock('../../src/config/db', () => ({
    prisma: {
        tourist: {
            findMany: vi.fn(),
            update: vi.fn()
        }
    }
}));

vi.mock('../../src/utils/socketService', () => ({
    getIO: vi.fn(() => ({ emit: vi.fn() }))
}));

vi.mock('../../src/utils/logger', () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
}));

beforeEach(() => {
    vi.clearAllMocks();
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
                    vi.clearAllMocks();

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
            { numRuns: 10 }
        );
    });
});
