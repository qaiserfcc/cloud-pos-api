import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export interface BulkInventoryTransferItemAttributes {
  id: string;
  bulkTransferId: string;
  productId: string;
  quantity: number;
  unitCost?: number;
  lineTotal?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkInventoryTransferItemCreationAttributes extends Omit<BulkInventoryTransferItemAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class BulkInventoryTransferItem extends Model<BulkInventoryTransferItemAttributes, BulkInventoryTransferItemCreationAttributes> {
}

BulkInventoryTransferItem.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    bulkTransferId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'bulk_inventory_transfers',
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
    quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      validate: {
        min: 0.001,
      },
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    lineTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
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
  },
  {
    sequelize,
    modelName: 'BulkInventoryTransferItem',
    tableName: 'bulk_inventory_transfer_items',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    underscored: true,
    indexes: [
      {
        fields: ['bulk_transfer_id'],
      },
      {
        fields: ['product_id'],
      },
      {
        fields: ['bulk_transfer_id', 'product_id'],
        unique: true,
      },
    ],
  }
);

export default BulkInventoryTransferItem;