import { authenticateToken, requirePermission, requireRole, requireTenantAccess, requireStoreAccess } from '../../middlewares/auth.middleware';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { User } from '../../db/models';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

describe('auth.middleware authenticateToken', () => {
  it('should return 401 if no token provided', async () => {
    const req = { headers: {} } as any as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    const next = jest.fn();

    await authenticateToken(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Access token required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should set req.user and call next on valid token', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'u1' });
    jest.spyOn(User, 'findByPk').mockResolvedValue({
      id: 'u1',
      tenantId: 't1',
      isActive: true,
      roles: [{ name: 'Manager', permissions: [{ resource: 'audit', action: 'view' }] }],
      defaultStoreId: 's1',
    } as any);

    const req = { headers: { authorization: 'Bearer token', 'x-store-id': 'store-123' } } as any as Request;
    const res = { status: jest.fn(), json: jest.fn() } as any as Response;
    const next = jest.fn();

    await authenticateToken(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toMatchObject({ id: 'u1', tenantId: 't1', storeId: 'store-123' });
    expect((req as any).userPermissions).toContain('audit:view');
  });

  it('should 401 when user not found', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'u1' });
    jest.spyOn(User, 'findByPk').mockResolvedValue(null as any);

    const req = { headers: { authorization: 'Bearer token' } } as any as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any as Response;
    const next = jest.fn();

    await authenticateToken(req as any, res as any, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'User not found' });
  });

  it('should 401 when user is deactivated', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'u1' });
    jest.spyOn(User, 'findByPk').mockResolvedValue({ id: 'u1', tenantId: 't1', isActive: false } as any);
    const req = { headers: { authorization: 'Bearer token' } } as any as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any as Response;
    const next = jest.fn();

    await authenticateToken(req as any, res as any, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'User account is deactivated' });
  });

  it('should 401 on invalid token', async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('bad'); });
    const req = { headers: { authorization: 'Bearer bad' } } as any as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any as Response;
    const next = jest.fn();

    await authenticateToken(req as any, res as any, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Invalid token' });
  });
});

describe('auth.middleware guards', () => {
  it('requirePermission denies when missing', () => {
    const mw = requirePermission('audit:manage');
    const req = { userPermissions: ['audit:view'], userRoles: [] } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any as Response;
    const next = jest.fn();
    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('requirePermission allows for Super Admin', () => {
    const mw = requirePermission('audit:manage');
    const req = { userPermissions: [], userRoles: ['Super Admin'] } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any as Response;
    const next = jest.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('requireRole denies when role missing', () => {
    const mw = requireRole('Manager');
    const req = { userRoles: ['Cashier'] } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any as Response;
    const next = jest.fn();
    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('requireTenantAccess denies when missing tenant (non-superadmin)', () => {
    const req = { userRoles: [], tenantId: undefined } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any as Response;
    const next = jest.fn();
    requireTenantAccess(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('requireStoreAccess denies when missing store (non-superadmin)', () => {
    const req = { userRoles: [], storeId: undefined } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any as Response;
    const next = jest.fn();
    requireStoreAccess(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
 
