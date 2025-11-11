const { Tenant } = require('../../dist/models/tenant.model');
const { Store } = require('../../dist/models/store.model');
const { User } = require('../../dist/models/user.model');
const { Role } = require('../../dist/models/role.model');
const { Permission } = require('../../dist/models/permission.model');
const { UserRole, RolePermission } = require('../../dist/models/index');
const { hashPassword } = require('../../dist/utils/jwt');
const logger = require('../../dist/config/logger').default;
const { Sequelize } = require('sequelize');
const sequelize = require('../../dist/config/database').default;

module.exports = {
  up: async (queryInterface, Sequelize) => {
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
        { name: 'inventory:view_all', resource: 'inventory', action: 'view_all', description: 'View inventory across all tenant stores' },

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
        { name: 'analytics:tenant_wide', resource: 'analytics', action: 'tenant_wide', description: 'Access tenant-wide analytics and multi-store reports' },
      ];

      // Temporarily disable trigger for permissions table during seeding
      await sequelize.query('ALTER TABLE permissions DISABLE TRIGGER trg_permissions_change');

      let createdPermissions = 0;
      let existingPermissions = 0;

      for (const perm of permissions) {
        // Use raw SQL to insert permissions since the model has compilation issues
        const [results] = await sequelize.query(
          `INSERT INTO permissions (id, tenant_id, name, resource, action, description, is_system, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
           ON CONFLICT (tenant_id, name) DO NOTHING`,
          {
            bind: [tenant.dataValues.id, perm.name, perm.resource, perm.action, perm.description, true],
            type: sequelize.QueryTypes.INSERT
          }
        );

        // Check if a row was inserted (results will be 1 if inserted, 0 if conflict)
        if (results === 1) {
          createdPermissions++;
          logger.info(`Created permission: ${perm.name}`);
        } else {
          existingPermissions++;
        }
      }

      // Re-enable trigger
      await sequelize.query('ALTER TABLE permissions ENABLE TRIGGER trg_permissions_change');

      logger.info(`Permissions seeding completed: ${createdPermissions} created, ${existingPermissions} already existed`);

      // Create default roles
      const roles = [
        { name: 'Super Admin', description: 'Full system access', is_system: true },
        { name: 'Tenant Admin', description: 'Tenant-level administration', is_system: true },
        { name: 'Store Manager', description: 'Store-level management', is_system: true },
      ];

      const createdRoles = [];
      for (const roleData of roles) {
        let role = await Role.findOne({ where: { name: roleData.name, tenant_id: tenant.dataValues.id } });
        if (!role) {
          role = await Role.create({
            ...roleData,
            tenant_id: tenant.dataValues.id,
          });
        }
        createdRoles.push(role);
        logger.info(`Role created/found: ${role.dataValues.name} (ID: ${role.dataValues.id})`);
      }

      // Assign permissions to roles
      const [superAdminRole, tenantAdminRole, storeManagerRole] = createdRoles;

      // Disable trigger for role_permissions table
      await sequelize.query('ALTER TABLE role_permissions DISABLE TRIGGER trg_role_permissions_change');

      // Super Admin gets all permissions
      const allPermissionsList = await sequelize.query(
        'SELECT id, name, resource, action, description FROM permissions WHERE tenant_id = $1',
        {
          bind: [tenant.dataValues.id],
          type: sequelize.QueryTypes.SELECT
        }
      );
      for (const permission of allPermissionsList) {
        await sequelize.query(
          'INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) ON CONFLICT (role_id, permission_id) DO NOTHING',
          {
            bind: [superAdminRole.dataValues.id, permission.id],
            type: sequelize.QueryTypes.INSERT
          }
        );
      }

      // Tenant Admin gets most permissions except super admin specific ones
      const tenantAdminPermissions = allPermissionsList.filter(p =>
        !p.name.startsWith('tenant:') || p.name === 'tenant:read'
      );
      for (const permission of tenantAdminPermissions) {
        await sequelize.query(
          'INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) ON CONFLICT (role_id, permission_id) DO NOTHING',
          {
            bind: [tenantAdminRole.dataValues.id, permission.id],
            type: sequelize.QueryTypes.INSERT
          }
        );
      }

      // Store Manager gets operational permissions
      const storeManagerPermissionNames = [
        'auth:profile',
        'store:read',
        'user:read',
        'product:read', 'product:create', 'product:update',
        'category:read', 'category:create', 'category:update',
        'inventory:read', 'inventory:create', 'inventory:update', 'inventory:view_all',
        'inventory_transfer:create', 'inventory_transfer:read', 'inventory_transfer:approve',
        'inventory_transfer:ship', 'inventory_transfer:complete', 'inventory_transfer:cancel',
        'sale:read', 'sale:create', 'sale:update',
        'customer:read', 'customer:create', 'customer:update',
        'dashboard:read', 'dashboard:update',
        'reports:read',
        'analytics:tenant_wide',
      ];

      for (const permName of storeManagerPermissionNames) {
        const permission = allPermissionsList.find(p => p.name === permName);
        if (permission) {
          await sequelize.query(
            'INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) ON CONFLICT (role_id, permission_id) DO NOTHING',
            {
              bind: [storeManagerRole.dataValues.id, permission.id],
              type: sequelize.QueryTypes.INSERT
            }
          );
        }
      }

      // Re-enable trigger for role_permissions table
      await sequelize.query('ALTER TABLE role_permissions ENABLE TRIGGER trg_role_permissions_change');

      logger.info('Role permissions assigned successfully');

      // Create default users
      const hashedPassword = await hashPassword('password123');

      // Disable trigger for user_roles table
      await sequelize.query('ALTER TABLE user_roles DISABLE TRIGGER trg_user_roles_change');

      // Super Admin user
      let superAdminUser = await User.findOne({ where: { email: 'superadmin@default.local' } });
      if (!superAdminUser) {
        superAdminUser = await User.create({
          email: 'superadmin@default.local',
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          tenantId: tenant.dataValues.id,
          storeId: store.dataValues.id,
          isActive: true,
        });

        // Assign Super Admin role
        await sequelize.query(
          'INSERT INTO user_roles (user_id, role_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) ON CONFLICT (user_id, role_id) DO NOTHING',
          {
            bind: [superAdminUser.dataValues.id, superAdminRole.dataValues.id],
            type: sequelize.QueryTypes.INSERT
          }
        );
      }

      // Tenant Admin user
      let tenantAdminUser = await User.findOne({ where: { email: 'tenantadmin@default.local' } });
      if (!tenantAdminUser) {
        tenantAdminUser = await User.create({
          email: 'tenantadmin@default.local',
          password: hashedPassword,
          firstName: 'Tenant',
          lastName: 'Admin',
          tenantId: tenant.dataValues.id,
          storeId: store.dataValues.id,
          isActive: true,
        });

        // Assign Tenant Admin role
        await sequelize.query(
          'INSERT INTO user_roles (user_id, role_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) ON CONFLICT (user_id, role_id) DO NOTHING',
          {
            bind: [tenantAdminUser.dataValues.id, tenantAdminRole.dataValues.id],
            type: sequelize.QueryTypes.INSERT
          }
        );
      }

      // Store Manager user
      let storeManagerUser = await User.findOne({ where: { email: 'manager@default.local' } });
      if (!storeManagerUser) {
        storeManagerUser = await User.create({
          email: 'manager@default.local',
          password: hashedPassword,
          firstName: 'Store',
          lastName: 'Manager',
          tenantId: tenant.dataValues.id,
          storeId: store.dataValues.id,
          isActive: true,
        });

        // Assign Store Manager role
        await sequelize.query(
          'INSERT INTO user_roles (user_id, role_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) ON CONFLICT (user_id, role_id) DO NOTHING',
          {
            bind: [storeManagerUser.dataValues.id, storeManagerRole.dataValues.id],
            type: sequelize.QueryTypes.INSERT
          }
        );
      }

      // Re-enable trigger for user_roles table
      await sequelize.query('ALTER TABLE user_roles ENABLE TRIGGER trg_user_roles_change');

      logger.info('Default users created successfully');
      logger.info('Initial data seeding completed successfully');

    } catch (error) {
      logger.error('Error seeding initial data:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove seeded data in reverse order
    await queryInterface.bulkDelete('user_roles', null, {});
    await queryInterface.bulkDelete('role_permissions', null, {});
    await queryInterface.bulkDelete('users', { email: { [Sequelize.Op.in]: ['superadmin@default.local', 'tenantadmin@default.local', 'manager@default.local'] } }, {});
    await queryInterface.bulkDelete('roles', { tenant_id: { [Sequelize.Op.ne]: null } }, {});
    await queryInterface.bulkDelete('permissions', { tenant_id: { [Sequelize.Op.ne]: null } }, {});
    await queryInterface.bulkDelete('stores', { name: 'Main Store' }, {});
    await queryInterface.bulkDelete('tenants', { name: 'Default Tenant' }, {});
  }
};