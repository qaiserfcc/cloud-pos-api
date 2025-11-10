import sequelize from '../../config/database';
import Tenant from './Tenant';
import Store from './Store';
import Role from './Role';
import Permission from './Permission';
import User from './User';
declare const UserRole: import("sequelize").ModelCtor<import("sequelize").Model<any, any>>;
declare const RolePermission: import("sequelize").ModelCtor<import("sequelize").Model<any, any>>;
export { sequelize, Tenant, Store, Role, Permission, User, UserRole, RolePermission, };
//# sourceMappingURL=index.d.ts.map