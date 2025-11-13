import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { User, ApprovalRule, ApprovalRequest } from '../../db/models';

// Mock jsonwebtoken before importing app so middleware uses mock
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

import app from '../../app';

const mockAuth = () => {
  const userId = '00000000-0000-0000-0000-000000000001';
  (jwt.verify as jest.Mock).mockImplementation(() => ({ id: userId }) as any);
  jest.spyOn(User, 'findByPk').mockResolvedValue({
    id: userId,
    email: 'approver@example.com',
    tenantId: '11111111-1111-1111-1111-111111111111',
    defaultStoreId: '22222222-2222-2222-2222-222222222222',
    isActive: true,
    roles: [{ name: 'Super Admin', permissions: [] }],
  } as any);
};

describe('Approvals routes', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    jest.resetAllMocks();
    mockAuth();
  });

  it('POST /api/v1/approvals/check-required returns result', async () => {
    const service = await import('../../services/approval.service');
    jest.spyOn(service.default.prototype, 'isApprovalRequired').mockResolvedValue(true as any);

    const res = await request(app)
      .post('/api/v1/approvals/check-required')
      .set('Authorization', 'Bearer fake')
      .send({ objectType: 'inventory_transfer', approvalData: { qty: 5 } });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('required', true);
  });

  it('GET /api/v1/approvals/rules returns rules list', async () => {
    jest.spyOn(ApprovalRule, 'findAll').mockResolvedValue([] as any);
    const res = await request(app)
      .get('/api/v1/approvals/rules')
      .set('Authorization', 'Bearer fake');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('POST /api/v1/approvals/rules creates a rule', async () => {
    jest.spyOn(ApprovalRule, 'create').mockResolvedValue({ id: 'r1' } as any);
    const res = await request(app)
      .post('/api/v1/approvals/rules')
      .set('Authorization', 'Bearer fake')
      .send({ name: 'Rule', objectType: 'inventory_transfer', conditions: {} });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/approvals/requests/:id returns 404 when not found', async () => {
    jest.spyOn(ApprovalRequest, 'findOne').mockResolvedValue(null as any);
    const res = await request(app)
      .get('/api/v1/approvals/requests/0f5c756b-6da0-4f0a-903b-1e4cf83fbf22')
      .set('Authorization', 'Bearer fake');
    expect(res.status).toBe(404);
  });
});
