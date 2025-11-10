"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAssociations = exports.Permission = exports.Role = exports.User = exports.Store = exports.Tenant = void 0;
var tenant_model_1 = require("./tenant.model");
Object.defineProperty(exports, "Tenant", { enumerable: true, get: function () { return __importDefault(tenant_model_1).default; } });
var store_model_1 = require("./store.model");
Object.defineProperty(exports, "Store", { enumerable: true, get: function () { return __importDefault(store_model_1).default; } });
var user_model_1 = require("./user.model");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return __importDefault(user_model_1).default; } });
var role_model_1 = require("./role.model");
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return __importDefault(role_model_1).default; } });
var permission_model_1 = require("./permission.model");
Object.defineProperty(exports, "Permission", { enumerable: true, get: function () { return __importDefault(permission_model_1).default; } });
const tenant_model_2 = require("./tenant.model");
const store_model_2 = require("./store.model");
const user_model_2 = require("./user.model");
const role_model_2 = require("./role.model");
const permission_model_2 = require("./permission.model");
const setupAssociations = () => {
    tenant_model_2.Tenant.hasMany(store_model_2.Store, {
        foreignKey: 'tenantId',
        as: 'stores',
        onDelete: 'CASCADE',
    });
    tenant_model_2.Tenant.hasMany(user_model_2.User, {
        foreignKey: 'tenantId',
        as: 'users',
        onDelete: 'CASCADE',
    });
    store_model_2.Store.belongsTo(tenant_model_2.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant',
    });
    user_model_2.User.belongsTo(tenant_model_2.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant',
    });
    user_model_2.User.belongsTo(store_model_2.Store, {
        foreignKey: 'defaultStoreId',
        as: 'defaultStore',
    });
    role_model_2.Role.belongsToMany(user_model_2.User, {
        through: 'user_roles',
        foreignKey: 'roleId',
        otherKey: 'userId',
        as: 'users',
    });
    user_model_2.User.belongsToMany(role_model_2.Role, {
        through: 'user_roles',
        foreignKey: 'userId',
        otherKey: 'roleId',
        as: 'roles',
    });
    permission_model_2.Permission.belongsToMany(role_model_2.Role, {
        through: 'role_permissions',
        foreignKey: 'permissionId',
        otherKey: 'roleId',
        as: 'roles',
    });
    role_model_2.Role.belongsToMany(permission_model_2.Permission, {
        through: 'role_permissions',
        foreignKey: 'roleId',
        otherKey: 'permissionId',
        as: 'permissions',
    });
};
exports.setupAssociations = setupAssociations;
//# sourceMappingURL=index.js.map