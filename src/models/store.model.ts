import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface StoreAttributes {
  id: string;
  tenantId: string;
  name: string;
  address?: object;
  settings?: object;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreCreationAttributes extends Optional<StoreAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Store extends Model<StoreAttributes, StoreCreationAttributes> implements StoreAttributes {
  declare public id: string;
  declare public tenantId: string;
  declare public name: string;
  declare public address?: object;
  declare public settings?: object;
  declare public isActive: boolean;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  // Association mixins
  declare public readonly tenant?: any;
  declare public readonly users?: any[];
  declare public readonly products?: any[];
  declare public readonly orders?: any[];
}

Store.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    address: {
      type: DataTypes.JSONB,
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
    modelName: 'Store',
    tableName: 'stores',
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        fields: ['tenantId'],
      },
      {
        fields: ['tenantId', 'isActive'],
      },
    ],
  }
);

export default Store;