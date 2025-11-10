// Core models
export { default as Tenant } from './tenant.model';
export { default as Store } from './store.model';
export { default as User } from './user.model';
export { default as Role } from './role.model';
export { default as Permission } from './permission.model';

// Import models for associations
import { Tenant } from './tenant.model';
import { Store } from './store.model';
import { User } from './user.model';
import { Role } from './role.model';
import { Permission } from './permission.model';

// Set up associations
export const setupAssociations = () => {
  // Tenant associations
  Tenant.hasMany(Store, {
    foreignKey: 'tenantId',
    as: 'stores',
    onDelete: 'CASCADE',
  });

  Tenant.hasMany(User, {
    foreignKey: 'tenantId',
    as: 'users',
    onDelete: 'CASCADE',
  });

  // Store associations
  Store.belongsTo(Tenant, {
    foreignKey: 'tenantId',
    as: 'tenant',
  });

  // User associations
  User.belongsTo(Tenant, {
    foreignKey: 'tenantId',
    as: 'tenant',
  });

  User.belongsTo(Store, {
    foreignKey: 'defaultStoreId',
    as: 'defaultStore',
  });

  // Role associations
  Role.belongsToMany(User, {
    through: 'user_roles',
    foreignKey: 'roleId',
    otherKey: 'userId',
    as: 'users',
  });

  User.belongsToMany(Role, {
    through: 'user_roles',
    foreignKey: 'userId',
    otherKey: 'roleId',
    as: 'roles',
  });

  // Permission associations
  Permission.belongsToMany(Role, {
    through: 'role_permissions',
    foreignKey: 'permissionId',
    otherKey: 'roleId',
    as: 'roles',
  });

  Role.belongsToMany(Permission, {
    through: 'role_permissions',
    foreignKey: 'roleId',
    otherKey: 'permissionId',
    as: 'permissions',
  });
};