import { DataTypes, Model, Op } from 'sequelize';
import sequelize from '../../config/database';

export interface ProductAttributes {
  id: string;
  tenantId: string;
  storeId?: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  version: number;
}

export interface ProductCreationAttributes extends Omit<ProductAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  declare public id: string;
  declare public tenantId: string;
  declare public storeId?: string;
  declare public name: string;
  declare public description?: string;
  declare public sku?: string;
  declare public barcode?: string;
  declare public metadata: any;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
  declare public readonly deletedAt?: Date;
  declare public version: number;

  // Association mixins
  declare public readonly tenant?: any;
  declare public readonly store?: any;
  declare public readonly variants?: any[];
}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'tenant_id',
      references: {
        model: 'tenants',
        key: 'id',
      },
    },
    storeId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'store_id',
      references: {
        model: 'stores',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sku: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    barcode: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
    version: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    underscored: true,
    indexes: [
      {
        fields: ['tenant_id', 'store_id'],
      },
      {
        unique: true,
        fields: ['tenant_id', 'store_id', 'sku'],
        where: {
          sku: {
            [Op.ne]: null,
          },
        },
      },
      {
        unique: true,
        fields: ['tenant_id', 'store_id', 'barcode'],
        where: {
          barcode: {
            [Op.ne]: null,
          },
        },
      },
    ],
  }
);

export default Product;