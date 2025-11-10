import { DataTypes } from 'sequelize';
import sequelize from '../../config/database';
import Tenant from './Tenant';
import Store from './Store';
import Role from './Role';
import Permission from './Permission';
import User from './User';

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

Tenant.hasMany(Role, {
  foreignKey: 'tenantId',
  as: 'roles',
  onDelete: 'CASCADE',
});

Tenant.hasMany(Permission, {
  foreignKey: 'tenantId',
  as: 'permissions',
  onDelete: 'CASCADE',
});

// Store associations
Store.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  as: 'tenant',
});

Store.hasMany(User, {
  foreignKey: 'defaultStoreId',
  as: 'storeUsers',
  onDelete: 'SET NULL',
});

// Role associations
Role.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  as: 'tenant',
});

// Permission associations
Permission.belongsTo(Tenant, {
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

// Many-to-many: User <-> Role
const UserRole = sequelize.define('UserRole', {
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  role_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id',
    },
  },
}, {
  tableName: 'user_roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'role_id'],
    },
  ],
});

User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: 'user_id',
  otherKey: 'role_id',
  as: 'roles',
});

Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: 'role_id',
  otherKey: 'user_id',
  as: 'users',
});

// Many-to-many: Role <-> Permission
const RolePermission = sequelize.define('RolePermission', {
  role_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id',
    },
  },
  permission_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'permissions',
      key: 'id',
    },
  },
}, {
  tableName: 'role_permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['role_id', 'permission_id'],
    },
  ],
});

Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions',
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles',
});

export {
  sequelize,
  Tenant,
  Store,
  Role,
  Permission,
  User,
  UserRole,
  RolePermission,
};