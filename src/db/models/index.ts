import { DataTypes } from 'sequelize';
import sequelize from '../../config/database';
import Tenant from './Tenant';
import Store from './Store';
import Role from './Role';
import Permission from './Permission';
import User from './User';
import Category from './Category';
import Product from './Product';
import Customer from './Customer';
import Sale from './Sale';
import SaleItem from './SaleItem';
import Payment from './Payment';
import Inventory from './Inventory';
import DashboardWidget from './DashboardWidget';

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

// Category associations
Category.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  as: 'tenant',
});

Category.hasMany(Category, {
  foreignKey: 'parentId',
  as: 'subcategories',
  onDelete: 'SET NULL',
});

Category.belongsTo(Category, {
  foreignKey: 'parentId',
  as: 'parent',
});

Category.hasMany(Product, {
  foreignKey: 'categoryId',
  as: 'products',
  onDelete: 'SET NULL',
});

// Product associations
Product.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  as: 'tenant',
});

Product.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
});

Product.hasMany(Inventory, {
  foreignKey: 'productId',
  as: 'inventories',
  onDelete: 'CASCADE',
});

Product.hasMany(SaleItem, {
  foreignKey: 'productId',
  as: 'saleItems',
  onDelete: 'RESTRICT',
});

// Customer associations
Customer.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  as: 'tenant',
});

Customer.hasMany(Sale, {
  foreignKey: 'customerId',
  as: 'sales',
  onDelete: 'SET NULL',
});

// Sale associations
Sale.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  as: 'tenant',
});

Sale.belongsTo(Store, {
  foreignKey: 'storeId',
  as: 'store',
});

Sale.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer',
});

Sale.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Sale.hasMany(SaleItem, {
  foreignKey: 'saleId',
  as: 'saleItems',
  onDelete: 'CASCADE',
});

Sale.hasMany(Payment, {
  foreignKey: 'saleId',
  as: 'payments',
  onDelete: 'CASCADE',
});

// SaleItem associations
SaleItem.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  as: 'tenant',
});

SaleItem.belongsTo(Sale, {
  foreignKey: 'saleId',
  as: 'sale',
});

SaleItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

// Payment associations
Payment.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  as: 'tenant',
});

Payment.belongsTo(Sale, {
  foreignKey: 'saleId',
  as: 'sale',
});

Payment.belongsTo(User, {
  foreignKey: 'processedBy',
  as: 'user',
});

// Inventory associations
Inventory.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  as: 'tenant',
});

Inventory.belongsTo(Store, {
  foreignKey: 'storeId',
  as: 'store',
});

Inventory.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

// DashboardWidget associations
DashboardWidget.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  as: 'tenant',
});

DashboardWidget.belongsTo(Store, {
  foreignKey: 'storeId',
  as: 'store',
});

export {
  sequelize,
  Tenant,
  Store,
  Role,
  Permission,
  User,
  Category,
  Product,
  Customer,
  Sale,
  SaleItem,
  Payment,
  Inventory,
  DashboardWidget,
  UserRole,
  RolePermission,
};

// Setup function to initialize associations
export const setupDbAssociations = () => {
  // Associations are already defined above
  // This function ensures they are initialized
};