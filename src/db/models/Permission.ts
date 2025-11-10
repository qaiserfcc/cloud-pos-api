import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export interface PermissionAttributes {
  id: string;
  tenantId: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface PermissionCreationAttributes extends Omit<PermissionAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  declare id: string;
  declare tenantId: string;
  declare name: string;
  declare resource: string;
  declare action: string;
  declare description: string;
  declare is_system: boolean;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at?: Date;

  // Association mixins
  declare readonly tenant?: any;
  declare readonly roles?: any[];

  // Many-to-many association mixins for roles
  declare addRole: (role: any) => Promise<void>;
  declare removeRole: (role: any) => Promise<void>;
  declare addRoles: (roles: any[]) => Promise<void>;
  declare removeRoles: (roles: any[]) => Promise<void>;
  declare setRoles: (roles: any[]) => Promise<void>;
  declare getRoles: () => Promise<any[]>;
}

Permission.init(
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
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    resource: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(50),
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
    modelName: 'Permission',
    tableName: 'permissions',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default Permission;