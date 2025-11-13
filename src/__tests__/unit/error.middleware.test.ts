import { errorHandler } from '../../middlewares/error.middleware';
import { Request, Response } from 'express';

describe('error.middleware errorHandler', () => {
  const makeRes = () => {
    const res = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;
    return res;
  };

  it('handles JsonWebTokenError as 401', () => {
    const err: any = new Error('bad token');
    err.name = 'JsonWebTokenError';
    const req = { url: '/x', method: 'GET', ip: '::1', get: () => 'jest' } as any as Request;
    const res = makeRes();
    errorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: 'Invalid token' }));
  });

  it('handles SequelizeUniqueConstraintError as 400', () => {
    const err: any = new Error('dup');
    err.name = 'SequelizeUniqueConstraintError';
    const req = { url: '/x', method: 'GET', ip: '::1', get: () => 'jest' } as any as Request;
    const res = makeRes();
    errorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles TokenExpiredError as 401', () => {
    const err: any = new Error('expired');
    err.name = 'TokenExpiredError';
    const req = { url: '/x', method: 'GET', ip: '::1', get: () => 'jest' } as any as Request;
    const res = makeRes();
    errorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Token expired' }));
  });

  it('handles SequelizeForeignKeyConstraintError as 400', () => {
    const err: any = new Error('fk violation');
    err.name = 'SequelizeForeignKeyConstraintError';
    const req = { url: '/x', method: 'POST', ip: '::1', get: () => 'jest' } as any as Request;
    const res = makeRes();
    errorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Foreign key constraint violation' }));
  });

  it('handles SequelizeValidationError as 400', () => {
    const err: any = new Error('bad input');
    err.name = 'SequelizeValidationError';
    const req = { url: '/y', method: 'PUT', ip: '::1', get: () => 'jest' } as any as Request;
    const res = makeRes();
    errorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Validation Error' }));
  });

  it('handles generic ValidationError as 400', () => {
    const err: any = new Error('generic validation');
    err.name = 'ValidationError';
    const req = { url: '/z', method: 'PATCH', ip: '::1', get: () => 'jest' } as any as Request;
    const res = makeRes();
    errorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Validation Error' }));
  });

  it('handles CastError as 404', () => {
    const err: any = new Error('bad id');
    err.name = 'CastError';
    const req = { url: '/z', method: 'GET', ip: '::1', get: () => 'jest' } as any as Request;
    const res = makeRes();
    errorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Resource not found' }));
  });
});
