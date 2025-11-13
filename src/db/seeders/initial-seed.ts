import { Tenant, Store, User, Role, Permission, UserRole, RolePermission } from '../models';
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
      // Auth permissions
      { name: 'auth:login', resource: 'auth', action: 'login', description: 'Login to system' },
      { name: 'auth:register', resource: 'auth', action: 'register', description: 'Register new user' },
      { name: 'auth:profile', resource: 'auth', action: 'profile', description: 'View user profile' },

      // Tenant permissions
      { name: 'tenant:read', resource: 'tenant', action: 'read', description: 'Read tenant information' },
      { name: 'tenant:create', resource: 'tenant', action: 'create', description: 'Create new tenant' },
      { name: 'tenant:update', resource: 'tenant', action: 'update', description: 'Update tenant information' },
      { name: 'tenant:delete', resource: 'tenant', action: 'delete', description: 'Delete tenant' },

      // Store permissions
      { name: 'store:read', resource: 'store', action: 'read', description: 'Read store information' },
      { name: 'store:create', resource: 'store', action: 'create', description: 'Create new store' },
      { name: 'store:update', resource: 'store', action: 'update', description: 'Update store information' },
      { name: 'store:delete', resource: 'store', action: 'delete', description: 'Delete store' },

      // User permissions
      { name: 'user:read', resource: 'user', action: 'read', description: 'Read user information' },
      { name: 'user:create', resource: 'user', action: 'create', description: 'Create new user' },
      { name: 'user:update', resource: 'user', action: 'update', description: 'Update user information' },
      { name: 'user:delete', resource: 'user', action: 'delete', description: 'Delete user' },

      // Role permissions
      { name: 'role:read', resource: 'role', action: 'read', description: 'Read role information' },
      { name: 'role:create', resource: 'role', action: 'create', description: 'Create new role' },
      { name: 'role:update', resource: 'role', action: 'update', description: 'Update role information' },
      { name: 'role:delete', resource: 'role', action: 'delete', description: 'Delete role' },

      // Product permissions
      { name: 'product:read', resource: 'product', action: 'read', description: 'Read product information' },
      { name: 'product:create', resource: 'product', action: 'create', description: 'Create new product' },
      { name: 'product:update', resource: 'product', action: 'update', description: 'Update product information' },
      { name: 'product:delete', resource: 'product', action: 'delete', description: 'Delete product' },

      // Category permissions
      { name: 'category:read', resource: 'category', action: 'read', description: 'Read category information' },
      { name: 'category:create', resource: 'category', action: 'create', description: 'Create new category' },
      { name: 'category:update', resource: 'category', action: 'update', description: 'Update category information' },
      { name: 'category:delete', resource: 'category', action: 'delete', description: 'Delete category' },

      // Inventory permissions
      { name: 'inventory:read', resource: 'inventory', action: 'read', description: 'Read inventory information' },
      { name: 'inventory:create', resource: 'inventory', action: 'create', description: 'Create inventory records' },
      { name: 'inventory:update', resource: 'inventory', action: 'update', description: 'Update inventory information' },
      { name: 'inventory:delete', resource: 'inventory', action: 'delete', description: 'Delete inventory records' },

      // Inventory Transfer permissions
      { name: 'inventory_transfer:create', resource: 'inventory_transfer', action: 'create', description: 'Create inventory transfer requests' },
      { name: 'inventory_transfer:read', resource: 'inventory_transfer', action: 'read', description: 'Read inventory transfer information' },
      { name: 'inventory_transfer:approve', resource: 'inventory_transfer', action: 'approve', description: 'Approve or reject inventory transfers' },
      { name: 'inventory_transfer:ship', resource: 'inventory_transfer', action: 'ship', description: 'Mark transfers as shipped' },
      { name: 'inventory_transfer:complete', resource: 'inventory_transfer', action: 'complete', description: 'Complete inventory transfers' },
      { name: 'inventory_transfer:cancel', resource: 'inventory_transfer', action: 'cancel', description: 'Cancel inventory transfers' },

      // Sale permissions
      { name: 'sale:read', resource: 'sale', action: 'read', description: 'Read sale information' },
      { name: 'sale:create', resource: 'sale', action: 'create', description: 'Create new sales' },
      { name: 'sale:update', resource: 'sale', action: 'update', description: 'Update sale information' },
      { name: 'sale:delete', resource: 'sale', action: 'delete', description: 'Delete sales' },

      // Customer permissions
      { name: 'customer:read', resource: 'customer', action: 'read', description: 'Read customer information' },
      { name: 'customer:create', resource: 'customer', action: 'create', description: 'Create new customers' },
      { name: 'customer:update', resource: 'customer', action: 'update', description: 'Update customer information' },
      { name: 'customer:delete', resource: 'customer', action: 'delete', description: 'Delete customers' },

      // Dashboard permissions
      { name: 'dashboard:read', resource: 'dashboard', action: 'read', description: 'Read dashboard information' },
      { name: 'dashboard:update', resource: 'dashboard', action: 'update', description: 'Update dashboard configuration' },

      // Reports permissions
      { name: 'reports:read', resource: 'reports', action: 'read', description: 'Read reports and analytics' },
    ];

    const createdPermissions = [];
    for (const perm of permissions) {
      let permission = await Permission.findOne({
        where: { name: perm.name, tenantId: tenant.dataValues.id } as any,
      });
      if (!permission) {
        permission = await Permission.create({
          ...perm,
          tenantId: tenant.dataValues.id,
          is_system: true,
        } as any);
      }
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
    for (const permission of createdPermissions) {
      await RolePermission.create({
        role_id: superAdminRole.dataValues.id,
        permission_id: permission.dataValues.id,
      });
    }

    // Tenant admin gets most permissions except tenant creation/deletion and some sensitive operations
    const tenantAdminPermissions = createdPermissions.filter(p =>
      !['tenant:create', 'tenant:delete'].includes(p.dataValues.name)
    );
    for (const permission of tenantAdminPermissions) {
      await RolePermission.create({
        role_id: tenantAdminRole.dataValues.id,
        permission_id: permission.dataValues.id,
      });
    }

    // Store manager gets store, user, product, category, inventory, sales, customer, and dashboard permissions
    const storeManagerPermissions = createdPermissions.filter(p =>
      ['store', 'user', 'product', 'category', 'inventory', 'inventory_transfer', 'sale', 'customer', 'dashboard'].includes(p.dataValues.resource) ||
      p.dataValues.name.startsWith('auth:') ||
      p.dataValues.name === 'reports:read'
    );
    for (const permission of storeManagerPermissions) {
      await RolePermission.create({
        role_id: storeManagerRole.dataValues.id,
        permission_id: permission.dataValues.id,
      });
    }

    logger.info('Assigned permissions to roles');

    // Create superadmin user
    const hashedPassword = await hashPassword('12345678');
    const [superAdmin] = await User.findOrCreate({
      where: { email: 'qaiserfcc@gmail.com', tenantId: tenant.dataValues.id },
      defaults: {
        tenantId: tenant.dataValues.id,
        defaultStoreId: store.dataValues.id,
        email: 'qaiserfcc@gmail.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+1-555-0000',
        isActive: true,
        loginAttempts: 0,
      },
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