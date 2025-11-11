import Permission from '../models/Permission';
import logger from '../../config/logger';

export const seedMissingPermissions = async (): Promise<void> => {
  try {
    logger.info('Starting missing permissions seeding...');

    // Get default tenant (assuming it exists)
    const Tenant = (await import('../models/Tenant')).default;
    const tenant = await Tenant.findOne({ where: { name: 'Default Tenant' } });

    if (!tenant) {
      throw new Error('Default tenant not found. Please run initial seed first.');
    }

    // Define all permissions that should exist
    const allPermissions = [
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

      // Audit permissions
      { name: 'audit:view', resource: 'audit', action: 'view', description: 'View audit logs and trails' },
      { name: 'audit:compliance', resource: 'audit', action: 'compliance', description: 'Generate compliance reports' },
      { name: 'audit:manage', resource: 'audit', action: 'manage', description: 'Manage audit logs and cleanup' },
    ];

    let createdCount = 0;
    let existingCount = 0;

    // Create permissions if they don't exist
    for (const perm of allPermissions) {
      const [permission, created] = await Permission.findOrCreate({
        where: { name: perm.name, tenantId: tenant.dataValues.id },
        defaults: {
          ...perm,
          tenantId: tenant.dataValues.id,
          is_system: true,
        } as any,
      });

      if (created) {
        createdCount++;
        logger.info(`Created permission: ${perm.name}`);
      } else {
        existingCount++;
      }
    }

    logger.info(`Permissions seeding completed: ${createdCount} created, ${existingCount} already existed`);

  } catch (error) {
    logger.error('Error seeding missing permissions:', error);
    throw error;
  }
};

// Execute the seeding function
seedMissingPermissions()
  .then(() => {
    logger.info('Missing permissions seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Missing permissions seeding failed:', error);
    process.exit(1);
  });