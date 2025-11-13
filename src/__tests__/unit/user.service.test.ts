import { UserService } from '../../services/user.service';
import { User, Store, Role } from '../../db/models';
import { hashPassword } from '../../utils/jwt';
import { Op } from 'sequelize';

jest.mock('../../utils/jwt', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock('../../db/models', () => ({
  User: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  Store: {
    findOne: jest.fn(),
  },
  Role: {
    findAll: jest.fn(),
  },
  Tenant: {},
  Permission: {},
}));

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isEmailAvailable', () => {
    it('should return true when email is available', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const result = await UserService.isEmailAvailable('test@example.com');

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result).toBe(true);
    });

    it('should return false when email is not available', async () => {
      (User.findOne as jest.Mock).mockImplementation(() => Promise.resolve({ dataValues: { id: 'existing-user' } }));

      const result = await UserService.isEmailAvailable('test@example.com');

      expect(result).toBe(false);
    });

    it('should exclude specified user ID', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const result = await UserService.isEmailAvailable('test@example.com', 'user-456');

      expect(User.findOne).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          id: { [Op.ne]: 'user-456' },
        },
      });
      expect(result).toBe(true);
    });
  });

  describe('createUser', () => {
    const mockHashedPassword = 'hashed-password';
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890',
      avatar: 'avatar.jpg',
      defaultStoreId: 'store-123',
      roleIds: ['role-1', 'role-2'],
    };

    it('should create a new user successfully', async () => {
      // Mock utilities and models
      (hashPassword as jest.Mock).mockResolvedValue(mockHashedPassword);
      (User.findOne as jest.Mock).mockResolvedValue(null); // Email check - no existing user
      (Store.findOne as jest.Mock).mockResolvedValue({ id: 'store-123' });
      (Role.findAll as jest.Mock).mockResolvedValue([
        { dataValues: { id: 'role-1' } },
        { dataValues: { id: 'role-2' } },
      ]);
      
      // Mock User.create to return an object with setRoles method
      const mockCreatedUser = {
        dataValues: {
          id: 'user-123',
          ...userData,
          password: mockHashedPassword,
          tenantId: 'tenant-123',
          isActive: true,
          loginAttempts: 0,
        },
        setRoles: jest.fn().mockResolvedValue(undefined),
      };
      (User.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      // Mock the User.findOne call made by getUserById
      const createdAt = new Date();
      const updatedAt = new Date();

      // Mock getUserById to avoid complex User.findOne chaining
      jest.spyOn(UserService, 'getUserById').mockResolvedValue({
        id: 'user-123',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        avatar: userData.avatar,
        defaultStoreId: userData.defaultStoreId,
        isActive: true,
        lastLoginAt: undefined,
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
        defaultStoreName: 'Test Store',
        roles: ['Role 1', 'Role 2'],
        roleCount: 2,
        createdAt,
        updatedAt,
      });

      const result = await UserService.createUser('tenant-123', userData);

      expect(hashPassword).toHaveBeenCalledWith(userData.password);
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(Store.findOne).toHaveBeenCalledWith({
        where: { id: userData.defaultStoreId, tenantId: 'tenant-123' },
      });
      expect(Role.findAll).toHaveBeenCalledWith({
        where: {
          id: { [Op.in]: userData.roleIds },
          tenantId: 'tenant-123',
        },
      });
      expect(User.create).toHaveBeenCalledWith({
        tenantId: 'tenant-123',
        email: userData.email,
        password: mockHashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        avatar: userData.avatar,
        defaultStoreId: userData.defaultStoreId,
        isActive: true,
        loginAttempts: 0,
      });
      expect(mockCreatedUser.setRoles).toHaveBeenCalledWith([
        { dataValues: { id: 'role-1' } },
        { dataValues: { id: 'role-2' } },
      ]);
      expect(UserService.getUserById).toHaveBeenCalledWith('user-123', 'tenant-123');
      expect(result.id).toBe('user-123');
      expect(result.email).toBe(userData.email);
    });

    it('should throw error when email is not available', async () => {
      (hashPassword as jest.Mock).mockResolvedValue(mockHashedPassword);
      (User.findOne as jest.Mock).mockResolvedValue({ id: 'existing-user' });

      await expect(UserService.createUser('tenant-123', userData)).rejects.toThrow('User with this email already exists');
    });

    it('should throw error when default store does not belong to tenant', async () => {
      (hashPassword as jest.Mock).mockResolvedValue(mockHashedPassword);
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (Store.findOne as jest.Mock).mockResolvedValue(null);

      await expect(UserService.createUser('tenant-123', userData)).rejects.toThrow('Default store not found or does not belong to this tenant');
    });

    it('should throw error when roles do not belong to tenant', async () => {
      (hashPassword as jest.Mock).mockResolvedValue(mockHashedPassword);
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (Store.findOne as jest.Mock).mockResolvedValue({ id: 'store-123' });
      (Role.findAll as jest.Mock).mockResolvedValue([{ dataValues: { id: 'role-1' } }]); // Only one role found

      await expect(UserService.createUser('tenant-123', userData)).rejects.toThrow('One or more roles not found or do not belong to this tenant');
    });
  });

  describe('getUserById', () => {
    const fixedDate = new Date('2023-01-01T00:00:00Z');
    const mockUser = {
      dataValues: {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890',
        avatar: 'avatar.jpg',
        defaultStoreId: 'store-123',
        isActive: true,
        lastLoginAt: fixedDate,
        tenantId: 'tenant-123',
        createdAt: fixedDate,
        updatedAt: fixedDate,
      },
      tenant: { name: 'Test Tenant' },
      defaultStore: { name: 'Test Store' },
      roles: [{ name: 'Admin' }, { name: 'Manager' }],
    };

    it('should return user with associations', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.getUserById('user-123', 'tenant-123');

      expect(User.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123', tenantId: 'tenant-123' },
        include: expect.any(Array),
      });
      expect(result).toMatchObject({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890',
        avatar: 'avatar.jpg',
        defaultStoreId: 'store-123',
        isActive: true,
        lastLoginAt: expect.any(Date),
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
        defaultStoreName: 'Test Store',
        roles: ['Admin', 'Manager'],
        roleCount: 2,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should throw error when user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(UserService.getUserById('user-123', 'tenant-123')).rejects.toThrow('User not found');
    });
  });

  describe('updateUser', () => {
    const updateData = {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '0987654321',
      isActive: false,
      roleIds: ['role-1'],
    };

    it('should update user successfully', async () => {
      const mockUser = {
        dataValues: { id: 'user-123', tenantId: 'tenant-123' },
        update: jest.fn().mockResolvedValue({}),
        setRoles: jest.fn().mockResolvedValue({}),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Store.findOne as jest.Mock).mockResolvedValue({ id: 'store-123' });
      (Role.findAll as jest.Mock).mockResolvedValue([{ dataValues: { id: 'role-1' } }]);

      const mockUpdatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '0987654321',
        avatar: undefined,
        defaultStoreId: undefined,
        isActive: false,
        lastLoginAt: undefined,
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
        defaultStoreName: undefined,
        roles: ['Role 1'],
        roleCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(UserService, 'getUserById').mockResolvedValue(mockUpdatedUser);

      const result = await UserService.updateUser('user-123', 'tenant-123', updateData);

      expect(mockUser.update).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '0987654321',
        isActive: false,
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should throw error when user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(UserService.updateUser('user-123', 'tenant-123', updateData)).rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user', async () => {
      const mockUser = {
        dataValues: { id: 'user-123', email: 'test@example.com' },
        update: jest.fn().mockResolvedValue({}),
        setRoles: jest.fn().mockResolvedValue({}),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await UserService.deleteUser('user-123', 'tenant-123');

      expect(mockUser.update).toHaveBeenCalledWith({ isActive: false });
      expect(mockUser.setRoles).toHaveBeenCalledWith([]);
    });

    it('should throw error when user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(UserService.deleteUser('user-123', 'tenant-123')).rejects.toThrow('User not found');
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      (User.count as jest.Mock).mockResolvedValueOnce(10).mockResolvedValueOnce(8);

      const result = await UserService.getUserStats('tenant-123');

      expect(User.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-123' } });
      expect(User.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-123', isActive: true } });
      expect(result).toEqual({
        totalUsers: 10,
        activeUsers: 8,
        inactiveUsers: 2,
      });
    });
  });
});