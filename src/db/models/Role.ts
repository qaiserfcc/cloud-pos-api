import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export interface RoleAttributes {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface RoleCreationAttributes extends Omit<RoleAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  declare id: string;
  declare tenantId: string;
  declare name: string;
  declare description: string;
  declare is_system: boolean;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at?: Date;

  // Association mixins
  declare readonly tenant?: any;
  declare readonly users?: any[];
  declare readonly permissions?: any[];

  // Many-to-many association mixins for users
  declare addUser: (user: any) => Promise<void>;
  declare removeUser: (user: any) => Promise<void>;
  declare addUsers: (users: any[]) => Promise<void>;
  declare removeUsers: (users: any[]) => Promise<void>;
  declare setUsers: (users: any[]) => Promise<void>;
  declare getUsers: () => Promise<any[]>;

  // Many-to-many association mixins for permissions
  declare addPermission: (permission: any) => Promise<void>;
  declare removePermission: (permission: any) => Promise<void>;
  declare addPermissions: (permissions: any[]) => Promise<void>;
  declare removePermissions: (permissions: any[]) => Promise<void>;
  declare setPermissions: (permissions: any[]) => Promise<void>;
  declare getPermissions: () => Promise<any[]>;
}

Role.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_system: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default Role;