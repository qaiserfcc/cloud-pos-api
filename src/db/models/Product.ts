import { DataTypes, Model, Op } from 'sequelize';
import sequelize from '../../config/database';

export interface ProductAttributes {
  id: string;
  tenantId: string;
  storeId?: string;
  categoryId?: string;
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
  declare id: string;
  declare tenantId: string;
  declare storeId?: string;
  declare categoryId?: string;
  declare name: string;
  declare description?: string;
  declare sku?: string;
  declare barcode?: string;
  declare metadata: any;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;
  declare version: number;

  // Association mixins
  declare readonly tenant?: any;
  declare readonly store?: any;
  declare readonly variants?: any[];
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
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'category_id',
      references: {
        model: 'categories',
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