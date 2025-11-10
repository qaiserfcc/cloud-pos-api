import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export interface TenantAttributes {
  id: string;
  name: string;
  domain: string;
  settings: object;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface TenantCreationAttributes extends Omit<TenantAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Tenant extends Model<TenantAttributes, TenantCreationAttributes> implements TenantAttributes {
  declare public id: string;
  declare public name: string;
  declare public domain: string;
  declare public settings: object;
  declare public isActive: boolean;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
  declare public readonly deletedAt?: Date;

  // Association mixins
  declare public readonly stores?: any[];
  declare public readonly users?: any[];
}

Tenant.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Tenant',
    tableName: 'tenants',
    timestamps: true,
    paranoid: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
    underscored: true,
  }
);

export default Tenant;