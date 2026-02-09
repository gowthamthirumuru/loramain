
import { describe, test, expect, beforeEach, beforeAll, vi } from 'vitest';
import jwt from 'jsonwebtoken';

describe('Property 11: Authentication and Authorization', () => {
    let authenticateGateway: any;
    let authenticateJWT: any;
    let prismaMock: any;
    let process: any;

    beforeAll(async () => {
        vi.resetModules();

        // 1. Mock Logger
        vi.doMock('../../utils/logger', () => ({
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn()
        }));

        // 2. Mock Prisma
        const mockPrismaClient = {
            user: {
                findUnique: vi.fn(),
                update: vi.fn()
            },
            actionLog: {
                create: vi.fn()
            },
            $connect: vi.fn()
        };

        vi.doMock('@prisma/client', () => ({
            PrismaClient: vi.fn(() => mockPrismaClient)
        }));

        vi.doMock('../../config/db', () => ({
            prisma: mockPrismaClient
        }));

        prismaMock = mockPrismaClient;

        // 3. Import Auth Middleware (dynamically)
        const authModule = await import('../../middleware/auth');
        authenticateGateway = authModule.authenticateGateway;
        authenticateJWT = authModule.authenticateJWT;
    });

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset Env Vars (Vitest gives access to process.env)
        // Note: auth.js captures env vars at runtime inside function?
        // Yes, verifyJWT and authenticateGateway verify inside function.
        // So this is safe.
        global.process.env.JWT_SECRET = 'test_secret';
        global.process.env.GATEWAY_API_KEY = 'test_gateway_key';
    });

    const mockRes = () => {
        const res: any = {};
        res.status = vi.fn().mockReturnValue(res);
        res.json = vi.fn().mockReturnValue(res);
        return res;
    };

    test('Gateway Auth accepts valid key', () => {
        const req: any = {
            headers: { 'x-api-key': 'test_gateway_key' },
            path: '/api/location/update',
            ip: '127.0.0.1'
        };
        const res = mockRes();
        const next = vi.fn();

        authenticateGateway(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test('Gateway Auth rejects invalid key', () => {
        const req: any = {
            headers: { 'x-api-key': 'wrong_key' },
            path: '/api/location/update',
            ip: '127.0.0.1'
        };
        const res = mockRes();
        const next = vi.fn();

        authenticateGateway(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('Gateway Auth rejects missing key', () => {
        const req: any = {
            headers: {},
            path: '/api/location/update',
            ip: '127.0.0.1'
        };
        const res = mockRes();
        const next = vi.fn();

        authenticateGateway(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('JWT Auth rejects expired tokens', async () => {
        const user = { id: 'user-123', status: 'active' };
        prismaMock.user.findUnique.mockResolvedValue(user);

        // Expired token
        const token = jwt.sign({ id: user.id }, 'test_secret', { expiresIn: '-1s' });

        const req: any = { headers: { authorization: `Bearer ${token}` } };
        const res = mockRes();
        const next = vi.fn();

        await authenticateJWT(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'TOKEN_EXPIRED' }));
    });
});
