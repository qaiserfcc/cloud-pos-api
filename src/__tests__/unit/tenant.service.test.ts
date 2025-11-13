import { TenantService } from '../../services/tenant.service';
import { Tenant, Store, User } from '../../db/models';
import { Op } from 'sequelize';

jest.mock('../../db/models', () => ({
  Tenant: {
    findAll: jest.fn(() => Promise.resolve([])),
    findByPk: jest.fn(() => Promise.resolve(null)),
    findOne: jest.fn(() => Promise.resolve(null)),
    create: jest.fn(() => Promise.resolve(null)),
    count: jest.fn(() => Promise.resolve(0)),
  },
  Store: {
    count: jest.fn(() => Promise.resolve(0)),
  },
  User: {
    count: jest.fn(() => Promise.resolve(0)),
  },
  Permission: {},
  Role: {},
}));

describe('TenantService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isDomainAvailable', () => {
    it('should return true when domain is available', async () => {
      (Tenant.findOne as jest.Mock).mockResolvedValue(null);

      const result = await TenantService.isDomainAvailable('example.com');

      expect(Tenant.findOne).toHaveBeenCalledWith({
        where: { domain: 'example.com' },
        paranoid: false,
      });
      expect(result).toBe(true);
    });

    it('should return false when domain is not available', async () => {
      (Tenant.findOne as jest.Mock).mockImplementation(() => Promise.resolve({ dataValues: { id: 'tenant-123' } }));

      const result = await TenantService.isDomainAvailable('example.com');

      expect(result).toBe(false);
    });

    it('should exclude specified tenant ID', async () => {
      (Tenant.findOne as jest.Mock).mockResolvedValue(null);

      const result = await TenantService.isDomainAvailable('example.com', 'tenant-456');

      expect(Tenant.findOne).toHaveBeenCalledWith({
        where: {
          domain: 'example.com',
          id: { [Op.ne]: 'tenant-456' },
        },
        paranoid: false,
      });
      expect(result).toBe(true);
    });
  });

  describe('createTenant', () => {
    const tenantData = {
      name: 'Test Tenant',
      domain: 'test.com',
      settings: { theme: 'dark' },
    };

    it('should create a new tenant successfully', async () => {
      (Tenant.findOne as jest.Mock).mockImplementation(() => Promise.resolve(null));
      (Tenant.create as jest.Mock).mockImplementation(() => Promise.resolve({
        dataValues: {
          id: 'tenant-123',
          ...tenantData,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }));

      const result = await TenantService.createTenant(tenantData);

      expect(Tenant.findOne).toHaveBeenCalledWith({
        where: { domain: tenantData.domain },
        paranoid: false,
      });
      expect(Tenant.create).toHaveBeenCalledWith({
        name: tenantData.name,
        domain: tenantData.domain,
        settings: tenantData.settings,
      });
      expect(result.dataValues.id).toBe('tenant-123');
    });

    it('should throw error when domain is not available', async () => {
      (Tenant.findOne as jest.Mock).mockImplementation(() => Promise.resolve({ id: 'existing-tenant' }));

      await expect(TenantService.createTenant(tenantData)).rejects.toThrow('Tenant with this domain already exists');
    });
  });

  describe('getTenantById', () => {
    const fixedDate = new Date('2023-01-01T00:00:00Z');
    const mockTenant = {
      dataValues: {
        id: 'tenant-123',
        name: 'Test Tenant',
        domain: 'test.com',
        settings: { theme: 'dark' },
        isActive: true,
        createdAt: fixedDate,
        updatedAt: fixedDate,
      },
      stores: [{ id: 'store-1' }, { id: 'store-2' }],
      users: [{ id: 'user-1' }, { id: 'user-2' }, { id: 'user-3' }],
    };

    it('should return tenant with stats', async () => {
      (Tenant.findByPk as jest.Mock).mockImplementation(() => Promise.resolve(mockTenant));

      const result = await TenantService.getTenantById('tenant-123');

      expect(Tenant.findByPk).toHaveBeenCalledWith('tenant-123', {
        include: expect.any(Array),
      });
      expect(result).toEqual({
        id: 'tenant-123',
        name: 'Test Tenant',
        domain: 'test.com',
        settings: { theme: 'dark' },
        isActive: true,
        createdAt: fixedDate,
        updatedAt: fixedDate,
        storeCount: 2,
        userCount: 3,
      });
    });

    it('should return null when tenant not found', async () => {
      (Tenant.findByPk as jest.Mock).mockImplementation(() => Promise.resolve(null));

      const result = await TenantService.getTenantById('tenant-123');

      expect(result).toBeNull();
    });
  });

  describe('getAllTenants', () => {
    it('should return all active tenants with stats', async () => {
      const mockTenants = [
        {
          dataValues: {
            id: 'tenant-1',
            name: 'Tenant 1',
            domain: 'tenant1.com',
            settings: {},
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          stores: [{ id: 'store-1' }],
          users: [{ id: 'user-1' }, { id: 'user-2' }],
        },
        {
          dataValues: {
            id: 'tenant-2',
            name: 'Tenant 2',
            domain: 'tenant2.com',
            settings: {},
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          stores: [],
          users: [{ id: 'user-3' }],
        },
      ];

      (Tenant.findAll as jest.Mock).mockImplementation(() => Promise.resolve(mockTenants));

      const result = await TenantService.getAllTenants();

      expect(Tenant.findAll).toHaveBeenCalledWith({
        where: { isActive: true },
        include: expect.any(Array),
        order: [['createdAt', 'DESC']],
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'tenant-1',
        name: 'Tenant 1',
        domain: 'tenant1.com',
        settings: {},
        isActive: true,
        createdAt: mockTenants[0]!.dataValues.createdAt,
        updatedAt: mockTenants[0]!.dataValues.updatedAt,
        storeCount: 1,
        userCount: 2,
      });
      expect(result[1]!.storeCount).toBe(0);
      expect(result[1]!.userCount).toBe(1);
    });
  });

  describe('updateTenant', () => {
    const updateData = {
      name: 'Updated Tenant',
      domain: 'updated.com',
      settings: { theme: 'light' },
      isActive: false,
    };

    it('should update tenant successfully', async () => {
      const mockTenant = {
        dataValues: {
          id: 'tenant-123',
          name: 'Old Name',
          domain: 'old.com',
          settings: { theme: 'dark' },
          isActive: true,
        },
        save: jest.fn().mockResolvedValue(undefined),
      };

      (Tenant.findByPk as jest.Mock).mockImplementation(() => Promise.resolve(mockTenant));
      (Tenant.findOne as jest.Mock).mockImplementation(() => Promise.resolve(null));

      const result = await TenantService.updateTenant('tenant-123', updateData);

      expect(Tenant.findByPk).toHaveBeenCalledWith('tenant-123');
      expect(Tenant.findOne).toHaveBeenCalledWith({
        where: { domain: updateData.domain },
        paranoid: false,
      });
      expect(mockTenant.save).toHaveBeenCalled();
      expect(result).toBe(mockTenant);
    });

    it('should throw error when tenant not found', async () => {
      (Tenant.findByPk as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(TenantService.updateTenant('tenant-123', updateData)).rejects.toThrow('Tenant not found');
    });

    it('should throw error when domain is not available', async () => {
      const mockTenant = {
        dataValues: {
          id: 'tenant-123',
          name: 'Old Name',
          domain: 'old.com',
          settings: { theme: 'dark' },
          isActive: true,
        },
        save: jest.fn().mockResolvedValue(undefined),
      };

      (Tenant.findByPk as jest.Mock).mockResolvedValue(mockTenant);
      (Tenant.findOne as jest.Mock).mockImplementation(() => Promise.resolve({ dataValues: { id: 'other-tenant' } }));

      await expect(TenantService.updateTenant('tenant-123', updateData)).rejects.toThrow('Tenant with this domain already exists');
    });
  });

  describe('deleteTenant', () => {
    it('should soft delete tenant successfully', async () => {
      const mockTenant = {
        dataValues: {
          id: 'tenant-123',
          name: 'Test Tenant',
        },
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      (Tenant.findByPk as jest.Mock).mockImplementation(() => Promise.resolve(mockTenant));
      (Store.count as jest.Mock).mockImplementation(() => Promise.resolve(0));
      (User.count as jest.Mock).mockImplementation(() => Promise.resolve(0));

      await TenantService.deleteTenant('tenant-123');

      expect(Tenant.findByPk).toHaveBeenCalledWith('tenant-123');
      expect(Store.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123', isActive: true },
      });
      expect(User.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123', isActive: true },
      });
      expect(mockTenant.destroy).toHaveBeenCalled();
    });

    it('should throw error when tenant not found', async () => {
      (Tenant.findByPk as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(TenantService.deleteTenant('tenant-123')).rejects.toThrow('Tenant not found');
    });

    it('should throw error when tenant has active stores', async () => {
      const mockTenant = {
        dataValues: {
          id: 'tenant-123',
          name: 'Test Tenant',
        },
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      (Tenant.findByPk as jest.Mock).mockImplementation(() => Promise.resolve(mockTenant));
      (Store.count as jest.Mock).mockImplementation(() => Promise.resolve(1));
      (User.count as jest.Mock).mockImplementation(() => Promise.resolve(0));

      await expect(TenantService.deleteTenant('tenant-123')).rejects.toThrow('Cannot delete tenant with active stores or users. Deactivate them first.');
    });

    it('should throw error when tenant has active users', async () => {
      const mockTenant = {
        dataValues: {
          id: 'tenant-123',
          name: 'Test Tenant',
        },
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      (Tenant.findByPk as jest.Mock).mockImplementation(() => Promise.resolve(mockTenant));
      (Store.count as jest.Mock).mockImplementation(() => Promise.resolve(0));
      (User.count as jest.Mock).mockImplementation(() => Promise.resolve(1));

      await expect(TenantService.deleteTenant('tenant-123')).rejects.toThrow('Cannot delete tenant with active stores or users. Deactivate them first.');
    });
  });

  describe('getTenantStats', () => {
    it('should return tenant statistics', async () => {
      (Store.count as jest.Mock).mockImplementation(() => Promise.resolve(5));
      (User.count as jest.Mock).mockImplementationOnce(() => Promise.resolve(20)).mockImplementationOnce(() => Promise.resolve(15));

      const result = await TenantService.getTenantStats('tenant-123');

      expect(Store.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123', isActive: true },
      });
      expect(User.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123' },
      });
      expect(User.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123', isActive: true },
      });
      expect(result).toEqual({
        storeCount: 5,
        userCount: 20,
        activeUserCount: 15,
      });
    });
  });
});