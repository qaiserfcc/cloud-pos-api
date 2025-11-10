import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '../config/database';

export interface TenantAttributes {
  id: string;
  name: string;
  domain?: string;
  settings?: object;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantCreationAttributes extends Optional<TenantAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Tenant extends Model<TenantAttributes, TenantCreationAttributes> implements TenantAttributes {
  declare public id: string;
  declare public name: string;
  declare public domain?: string;
  declare public settings?: object;
  declare public isActive: boolean;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  // Association mixins
  declare public readonly stores?: any[];
  declare public readonly users?: any[];
}

Tenant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: true,
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
  },
  {
    sequelize,
    modelName: 'Tenant',
    tableName: 'tenants',
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        unique: true,
        fields: ['domain'],
        where: {
          domain: {
            [Op.ne]: null,
          },
        },
      },
    ],
  }
);

export default Tenant;