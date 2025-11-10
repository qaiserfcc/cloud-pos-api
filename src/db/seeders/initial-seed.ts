import Tenant from '../models/Tenant';
import Store from '../models/Store';
import User from '../models/User';
import Role from '../models/Role';
import Permission from '../models/Permission';
import { UserRole, RolePermission } from '../models';
import { hashPassword } from '../../utils/jwt';
import logger from '../../config/logger';

export const seedInitialData = async (): Promise<void> => {
  try {
    logger.info('Starting initial data seeding...');

    // Create default tenant
    let tenant = await Tenant.findOne({ where: { name: 'Default Tenant' } });
    if (!tenant) {
      tenant = await Tenant.create({
        name: 'Default Tenant',
        domain: 'default.local',
        settings: {},
      });
    }

    logger.info(`Tenant created/found: ${tenant.dataValues.name} (ID: ${tenant.dataValues.id})`);

    // Create default store
    let store = await Store.findOne({ where: { name: 'Main Store', tenantId: tenant.dataValues.id } });
    if (!store) {
      store = await Store.create({
        name: 'Main Store',
        tenantId: tenant.dataValues.id,
        code: 'MAIN001',
        address: '123 Main St, Anytown, CA 12345, USA',
        phone: '+1-555-0123',
        email: 'main@default.local',
        settings: {},
      });
    }

    logger.info(`Store created/found: ${store.dataValues.name} (ID: ${store.dataValues.id})`);

    // Create default permissions
    const permissions = [
      { name: 'auth:login', resource: 'auth', action: 'login', description: 'Login to system' },
      { name: 'auth:register', resource: 'auth', action: 'register', description: 'Register new user' },
      { name: 'auth:profile', resource: 'auth', action: 'profile', description: 'View user profile' },
      { name: 'tenant:read', resource: 'tenant', action: 'read', description: 'Read tenant information' },
      { name: 'tenant:create', resource: 'tenant', action: 'create', description: 'Create new tenant' },
      { name: 'tenant:update', resource: 'tenant', action: 'update', description: 'Update tenant information' },
      { name: 'tenant:delete', resource: 'tenant', action: 'delete', description: 'Delete tenant' },
      { name: 'store:read', resource: 'store', action: 'read', description: 'Read store information' },
      { name: 'store:create', resource: 'store', action: 'create', description: 'Create new store' },
      { name: 'store:update', resource: 'store', action: 'update', description: 'Update store information' },
      { name: 'store:delete', resource: 'store', action: 'delete', description: 'Delete store' },
      { name: 'user:read', resource: 'user', action: 'read', description: 'Read user information' },
      { name: 'user:create', resource: 'user', action: 'create', description: 'Create new user' },
      { name: 'user:update', resource: 'user', action: 'update', description: 'Update user information' },
      { name: 'user:delete', resource: 'user', action: 'delete', description: 'Delete user' },
      { name: 'role:read', resource: 'role', action: 'read', description: 'Read role information' },
      { name: 'role:create', resource: 'role', action: 'create', description: 'Create new role' },
      { name: 'role:update', resource: 'role', action: 'update', description: 'Update role information' },
      { name: 'role:delete', resource: 'role', action: 'delete', description: 'Delete role' },
    ];

    const createdPermissions = [];
    for (const perm of permissions) {
      const [permission] = await Permission.findOrCreate({
        where: { name: perm.name, tenantId: tenant.dataValues.id } as any,
        defaults: {
          ...perm,
          tenantId: tenant.dataValues.id,
          is_system: true,
        } as any,
      });
      createdPermissions.push(permission);
    }

    logger.info(`Created ${createdPermissions.length} permissions`);

    // Create default roles
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      tenantId: tenant.dataValues.id,
      description: 'Super administrator with full system access',
      is_system: true,
    } as any);

    const tenantAdminRole = await Role.create({
      name: 'Tenant Admin',
      tenantId: tenant.dataValues.id,
      description: 'Tenant administrator with tenant-level access',
      is_system: true,
    } as any);

    const storeManagerRole = await Role.create({
      name: 'Store Manager',
      tenantId: tenant.dataValues.id,
      description: 'Store manager with store-level access',
      is_system: true,
    } as any);

    logger.info('Created default roles');

    // Assign permissions to roles using direct SQL for many-to-many
    const { sequelize } = await import('../models');
    for (const permission of createdPermissions) {
      await RolePermission.create({
        role_id: superAdminRole.dataValues.id,
        permission_id: permission.dataValues.id,
      });
    }

    // Tenant admin gets most permissions except tenant creation/deletion
    const tenantAdminPermissions = createdPermissions.filter(p =>
      !['tenant:create', 'tenant:delete'].includes(p.dataValues.name)
    );
    for (const permission of tenantAdminPermissions) {
      await RolePermission.create({
        role_id: tenantAdminRole.dataValues.id,
        permission_id: permission.dataValues.id,
      });
    }

    // Store manager gets store and user permissions
    const storeManagerPermissions = createdPermissions.filter(p =>
      p.dataValues.resource === 'store' || p.dataValues.resource === 'user' || p.dataValues.name.startsWith('auth:')
    );
    for (const permission of storeManagerPermissions) {
      await RolePermission.create({
        role_id: storeManagerRole.dataValues.id,
        permission_id: permission.dataValues.id,
      });
    }

    logger.info('Assigned permissions to roles');

    // Create superadmin user
    const hashedPassword = await hashPassword('SuperAdmin123!');
    const superAdmin = await User.create({
      tenantId: tenant.dataValues.id,
      defaultStoreId: store.dataValues.id,
      email: 'superadmin@default.local',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+1-555-0000',
      isActive: true,
      loginAttempts: 0,
    });

    // Assign superadmin role to user
    await UserRole.create({
      user_id: superAdmin.dataValues.id,
      role_id: superAdminRole.dataValues.id,
    });

    logger.info(`Superadmin user created: ${superAdmin.dataValues.email} (ID: ${superAdmin.dataValues.id})`);

    logger.info('Initial data seeding completed successfully');
  } catch (error) {
    logger.error('Error seeding initial data:', error);
    throw error;
  }
};

// Execute the seeding function
seedInitialData()
  .then(() => {
    logger.info('Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Seeding failed:', error);
    process.exit(1);
  });