import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export interface InventoryAttributes {
  id: string;
  tenantId: string;
  storeId: string;
  productId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastStockTakeDate?: Date;
  lastStockTakeQuantity?: number;
  unitCost?: number;
  location?: string;
  batchNumber?: string;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface InventoryCreationAttributes extends Omit<InventoryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Inventory extends Model<InventoryAttributes, InventoryCreationAttributes> {
}

Inventory.init(
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
    storeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'stores',
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    quantityOnHand: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    },
    quantityReserved: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    },
    quantityAvailable: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    },
    reorderPoint: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    },
    reorderQuantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    },
    lastStockTakeDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastStockTakeQuantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true,
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    batchNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
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
    modelName: 'Inventory',
    tableName: 'inventories',
    timestamps: true,
    paranoid: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['tenant_id', 'store_id', 'product_id'],
      },
      {
        fields: ['tenant_id', 'store_id', 'quantity_available'],
      },
      {
        fields: ['tenant_id', 'product_id'],
      },
      {
        fields: ['tenant_id', 'expiry_date'],
      },
    ],
  }
);

export default Inventory;