"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedInitialData = void 0;
const Tenant_1 = __importDefault(require("../models/Tenant"));
const Store_1 = __importDefault(require("../models/Store"));
const User_1 = __importDefault(require("../models/User"));
const Role_1 = __importDefault(require("../models/Role"));
const Permission_1 = __importDefault(require("../models/Permission"));
const models_1 = require("../models");
const jwt_1 = require("../../utils/jwt");
const logger_1 = __importDefault(require("../../config/logger"));
const seedInitialData = async () => {
    try {
        logger_1.default.info('Starting initial data seeding...');
        let tenant = await Tenant_1.default.findOne({ where: { name: 'Default Tenant' } });
        if (!tenant) {
            tenant = await Tenant_1.default.create({
                name: 'Default Tenant',
                domain: 'default.local',
                settings: {},
            });
        }
        logger_1.default.info(`Tenant created/found: ${tenant.dataValues.name} (ID: ${tenant.dataValues.id})`);
        let store = await Store_1.default.findOne({ where: { name: 'Main Store', tenantId: tenant.dataValues.id } });
        if (!store) {
            store = await Store_1.default.create({
                name: 'Main Store',
                tenantId: tenant.dataValues.id,
                code: 'MAIN001',
                address: '123 Main St, Anytown, CA 12345, USA',
                phone: '+1-555-0123',
                email: 'main@default.local',
                settings: {},
            });
        }
        logger_1.default.info(`Store created/found: ${store.dataValues.name} (ID: ${store.dataValues.id})`);
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
            const [permission] = await Permission_1.default.findOrCreate({
                where: { name: perm.name, tenant_id: tenant.dataValues.id },
                defaults: {
                    ...perm,
                    tenant_id: tenant.dataValues.id,
                    is_system: true,
                },
            });
            createdPermissions.push(permission);
        }
        logger_1.default.info(`Created ${createdPermissions.length} permissions`);
        const superAdminRole = await Role_1.default.create({
            name: 'Super Admin',
            tenant_id: tenant.dataValues.id,
            description: 'Super administrator with full system access',
            is_system: true,
        });
        const tenantAdminRole = await Role_1.default.create({
            name: 'Tenant Admin',
            tenant_id: tenant.dataValues.id,
            description: 'Tenant administrator with tenant-level access',
            is_system: true,
        });
        const storeManagerRole = await Role_1.default.create({
            name: 'Store Manager',
            tenant_id: tenant.dataValues.id,
            description: 'Store manager with store-level access',
            is_system: true,
        });
        logger_1.default.info('Created default roles');
        const { sequelize } = await Promise.resolve().then(() => __importStar(require('../models')));
        for (const permission of createdPermissions) {
            await models_1.RolePermission.create({
                role_id: superAdminRole.dataValues.id,
                permission_id: permission.dataValues.id,
            });
        }
        const tenantAdminPermissions = createdPermissions.filter(p => !['tenant:create', 'tenant:delete'].includes(p.dataValues.name));
        for (const permission of tenantAdminPermissions) {
            await models_1.RolePermission.create({
                role_id: tenantAdminRole.dataValues.id,
                permission_id: permission.dataValues.id,
            });
        }
        const storeManagerPermissions = createdPermissions.filter(p => p.dataValues.resource === 'store' || p.dataValues.resource === 'user' || p.dataValues.name.startsWith('auth:'));
        for (const permission of storeManagerPermissions) {
            await models_1.RolePermission.create({
                role_id: storeManagerRole.dataValues.id,
                permission_id: permission.dataValues.id,
            });
        }
        logger_1.default.info('Assigned permissions to roles');
        const hashedPassword = await (0, jwt_1.hashPassword)('SuperAdmin123!');
        const superAdmin = await User_1.default.create({
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
        await models_1.UserRole.create({
            user_id: superAdmin.dataValues.id,
            role_id: superAdminRole.dataValues.id,
        });
        logger_1.default.info(`Superadmin user created: ${superAdmin.dataValues.email} (ID: ${superAdmin.dataValues.id})`);
        logger_1.default.info('Initial data seeding completed successfully');
    }
    catch (error) {
        logger_1.default.error('Error seeding initial data:', error);
        throw error;
    }
};
exports.seedInitialData = seedInitialData;
(0, exports.seedInitialData)()
    .then(() => {
    logger_1.default.info('Seeding completed successfully');
    process.exit(0);
})
    .catch((error) => {
    logger_1.default.error('Seeding failed:', error);
    process.exit(1);
});
//# sourceMappingURL=initial-seed.js.map