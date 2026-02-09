import { describe, test, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { updateBatchLocation } from '../../src/controllers/locationController';
import { LIMITS, GEO_BOUNDS } from '../../src/config/constants';
import { prisma } from '../../src/config/db';

// Mocks
vi.mock('../../src/config/db', () => ({
    prisma: {
        tourist: {
            findUnique: vi.fn(),
            update: vi.fn()
        },
        locationLog: {
            create: vi.fn()
        }
    }
}));

vi.mock('../../src/utils/logger', () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    logLocation: vi.fn()
}));

// Helper to reset mocks
beforeEach(() => {
    vi.clearAllMocks();
});

describe('Property 2: Device & Data Validation', () => {

    test('Batch update handles varying inputs correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        device_id: fc.string({ minLength: 1 }),
                        x: fc.integer(),
                        y: fc.integer(),
                        lat: fc.float({ min: 0, max: 90 }),
                        lng: fc.float({ min: 0, max: 180 }),
                        rssi: fc.integer({ min: -120, max: 0 }),
                        sos_flag: fc.boolean()
                    }),
                    { maxLength: LIMITS.MAX_BATCH_SIZE + 5 } // Go slightly over limit to test validation
                ),
                fc.boolean(), // should_exist (if true, mock finding tourist)
                async (locations, shouldExist) => {
                    // Reset mocks for each run in the property test
                    vi.clearAllMocks();

                    // Mock Request/Response
                    const req = { body: { locations } };
                    const res = { json: vi.fn() };

                    if (locations.length > LIMITS.MAX_BATCH_SIZE) {
                        await expect(updateBatchLocation(req, res))
                            .rejects.toThrow(/Batch size exceeds limit/);
                        return;
                    }

                    // Mock Prism Behavior
                    // If shouldExist is true, return a mock tourist object
                    prisma.tourist.findUnique.mockImplementation((args) => {
                        if (shouldExist) return { id: 't1', device_id: args.where.device_id, status: 'active' };
                        return null;
                    });

                    await updateBatchLocation(req, res);

                    // Assertions
                    expect(res.json).toHaveBeenCalled();
                    const result = res.json.mock.calls[0][0]; // get the response object

                    expect(result.success).toBe(true);

                    // Calculate expected processed count
                    // Any location with INVALID coords should be skipped
                    // Any location if !shouldExist should be skipped (failed)

                    let expectedProcessed = 0;
                    let expectedFailed = 0;

                    for (const loc of locations) {
                        const isValidCoords = (
                            loc.lat >= GEO_BOUNDS.MIN_LAT && loc.lat <= GEO_BOUNDS.MAX_LAT &&
                            loc.lng >= GEO_BOUNDS.MIN_LNG && loc.lng <= GEO_BOUNDS.MAX_LNG
                        );

                        if (!isValidCoords) {
                            expectedFailed++;
                        } else if (!shouldExist) {
                            expectedFailed++;
                        } else {
                            expectedProcessed++;
                        }
                    }

                    expect(result.data.processed).toBe(expectedProcessed);
                    expect(result.data.failed).toBe(expectedFailed);
                }
            ),
            { numRuns: 50 } // Run 50 iterations
        );
    });
});
