import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { User } from '../../db/models';

// Mock jsonwebtoken module before importing the app (so middleware uses the mock)
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

// Import app after mocks are in place
import app from '../../app';

// Helper to stub authenticated user context via jwt + User.findByPk
const mockAuth = (overrides: Partial<any> = {}) => {
  const userId = '00000000-0000-0000-0000-000000000001';
  (jwt.verify as jest.Mock).mockImplementation(() => ({ id: userId }) as any);
  jest.spyOn(User, 'findByPk').mockResolvedValue({
    id: userId,
    email: 'test@example.com',
    tenantId: '11111111-1111-1111-1111-111111111111',
    defaultStoreId: '22222222-2222-2222-2222-222222222222',
    isActive: true,
    roles: [
      { name: 'Super Admin', permissions: [{ resource: 'audit', action: 'manage' }] },
    ],
    ...overrides,
  } as any);
};

describe('Auth routes', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    jest.resetAllMocks();
  });

  it('POST /api/v1/auth/login should validate and call service', async () => {
    // Mock AuthService.authenticateUser to avoid DB
    const service = await import('../../services/auth.service');
    const spy = jest.spyOn(service.AuthService, 'authenticateUser').mockResolvedValue({
      user: {
        id: 'u1',
        email: 'user@example.com',
        firstName: 'User',
        lastName: 'Test',
        tenant: { id: 't1', name: 'Tenant' },
        roles: [],
        permissions: [],
      },
      tokens: {
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: '24h',
      },
    } as any);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'Passw0rd!' });

    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith('user@example.com', 'Passw0rd!');
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('tokens');
  });

  it('GET /api/v1/auth/profile should return current user profile when authenticated', async () => {
    mockAuth();
    const service = await import('../../services/auth.service');
    jest.spyOn(service.AuthService, 'getUserProfile').mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      firstName: 'User',
      lastName: 'Test',
      tenant: { id: 't1', name: 'Tenant' },
      roles: [],
      permissions: [],
    } as any);

    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', 'Bearer fake');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('user');
  });

  it('POST /api/v1/auth/logout should succeed when authenticated', async () => {
    mockAuth();
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', 'Bearer fake');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
