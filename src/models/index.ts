// Core models
export { default as Tenant } from './tenant.model';
export { default as Store } from './store.model';
export { default as User } from './user.model';
export { default as Role } from './role.model';
export { default as Permission } from './permission.model';
export { default as AuditLog } from './audit-log.model';
export { default as ApprovalRule } from './approval-rule.model';
export { default as ApprovalRequest } from './approval-request.model';

// Import models for associations
import { Tenant } from './tenant.model';
import { Store } from './store.model';
import { User } from './user.model';
import { Role } from './role.model';
import { Permission } from './permission.model';
import { AuditLog } from './audit-log.model';
import { ApprovalRule } from './approval-rule.model';
import { ApprovalRequest } from './approval-request.model';

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

  // AuditLog associations
  AuditLog.belongsTo(Tenant, {
    foreignKey: 'tenantId',
    as: 'tenant',
  });

  AuditLog.belongsTo(Store, {
    foreignKey: 'storeId',
    as: 'store',
  });

  AuditLog.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });

  // Add audit log associations to other models
  Tenant.hasMany(AuditLog, {
    foreignKey: 'tenantId',
    as: 'auditLogs',
  });

  Store.hasMany(AuditLog, {
    foreignKey: 'storeId',
    as: 'auditLogs',
  });

  User.hasMany(AuditLog, {
    foreignKey: 'userId',
    as: 'auditLogs',
  });

  // ApprovalRule associations
  ApprovalRule.belongsTo(Tenant, {
    foreignKey: 'tenantId',
    as: 'tenant',
  });

  Tenant.hasMany(ApprovalRule, {
    foreignKey: 'tenantId',
    as: 'approvalRules',
  });

  // ApprovalRequest associations
  ApprovalRequest.belongsTo(Tenant, {
    foreignKey: 'tenantId',
    as: 'tenant',
  });

  ApprovalRequest.belongsTo(Store, {
    foreignKey: 'storeId',
    as: 'store',
  });

  ApprovalRequest.belongsTo(User, {
    foreignKey: 'requestedById',
    as: 'requestedBy',
  });

  ApprovalRequest.belongsTo(ApprovalRule, {
    foreignKey: 'approvalRuleId',
    as: 'approvalRule',
  });

  Tenant.hasMany(ApprovalRequest, {
    foreignKey: 'tenantId',
    as: 'approvalRequests',
  });

  Store.hasMany(ApprovalRequest, {
    foreignKey: 'storeId',
    as: 'approvalRequests',
  });

  User.hasMany(ApprovalRequest, {
    foreignKey: 'requestedById',
    as: 'requestedApprovals',
  });

  ApprovalRule.hasMany(ApprovalRequest, {
    foreignKey: 'approvalRuleId',
    as: 'approvalRequests',
  });
};