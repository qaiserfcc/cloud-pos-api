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
  declare public id: string;
  declare public tenantId: string;
  declare public name: string;
  declare public description: string;
  declare public is_system: boolean;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
  declare public readonly deleted_at?: Date;

  // Association mixins
  declare public readonly tenant?: any;
  declare public readonly users?: any[];
  declare public readonly permissions?: any[];
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
    indexes: [
      {
        unique: true,
        fields: ['tenantId', 'name'],
      },
    ],
  }
);

export default Role;