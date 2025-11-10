"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermission = exports.UserRole = exports.User = exports.Permission = exports.Role = exports.Store = exports.Tenant = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
exports.sequelize = database_1.default;
const Tenant_1 = __importDefault(require("./Tenant"));
exports.Tenant = Tenant_1.default;
const Store_1 = __importDefault(require("./Store"));
exports.Store = Store_1.default;
const Role_1 = __importDefault(require("./Role"));
exports.Role = Role_1.default;
const Permission_1 = __importDefault(require("./Permission"));
exports.Permission = Permission_1.default;
const User_1 = __importDefault(require("./User"));
exports.User = User_1.default;
Tenant_1.default.hasMany(Store_1.default, {
    foreignKey: 'tenantId',
    as: 'stores',
    onDelete: 'CASCADE',
});
Tenant_1.default.hasMany(User_1.default, {
    foreignKey: 'tenantId',
    as: 'users',
    onDelete: 'CASCADE',
});
Tenant_1.default.hasMany(Role_1.default, {
    foreignKey: 'tenantId',
    as: 'roles',
    onDelete: 'CASCADE',
});
Tenant_1.default.hasMany(Permission_1.default, {
    foreignKey: 'tenantId',
    as: 'permissions',
    onDelete: 'CASCADE',
});
Store_1.default.belongsTo(Tenant_1.default, {
    foreignKey: 'tenantId',
    as: 'tenant',
});
Store_1.default.hasMany(User_1.default, {
    foreignKey: 'defaultStoreId',
    as: 'storeUsers',
    onDelete: 'SET NULL',
});
Role_1.default.belongsTo(Tenant_1.default, {
    foreignKey: 'tenantId',
    as: 'tenant',
});
Permission_1.default.belongsTo(Tenant_1.default, {
    foreignKey: 'tenantId',
    as: 'tenant',
});
User_1.default.belongsTo(Tenant_1.default, {
    foreignKey: 'tenantId',
    as: 'tenant',
});
User_1.default.belongsTo(Store_1.default, {
    foreignKey: 'defaultStoreId',
    as: 'defaultStore',
});
const UserRole = database_1.default.define('UserRole', {
    user_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    role_id: {
        type: sequelize_1.DataTypes.UUID,
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
exports.UserRole = UserRole;
User_1.default.belongsToMany(Role_1.default, {
    through: UserRole,
    foreignKey: 'user_id',
    otherKey: 'role_id',
    as: 'roles',
});
Role_1.default.belongsToMany(User_1.default, {
    through: UserRole,
    foreignKey: 'role_id',
    otherKey: 'user_id',
    as: 'users',
});
const RolePermission = database_1.default.define('RolePermission', {
    role_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'roles',
            key: 'id',
        },
    },
    permission_id: {
        type: sequelize_1.DataTypes.UUID,
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
exports.RolePermission = RolePermission;
Role_1.default.belongsToMany(Permission_1.default, {
    through: RolePermission,
    foreignKey: 'role_id',
    otherKey: 'permission_id',
    as: 'permissions',
});
Permission_1.default.belongsToMany(Role_1.default, {
    through: RolePermission,
    foreignKey: 'permission_id',
    otherKey: 'role_id',
    as: 'roles',
});
//# sourceMappingURL=index.js.map