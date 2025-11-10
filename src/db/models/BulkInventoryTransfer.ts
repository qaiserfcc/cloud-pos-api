import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export interface BulkInventoryTransferAttributes {
  id: string;
  tenantId: string;
  bulkTransferNumber: string;
  sourceStoreId: string;
  destinationStoreId: string;
  title: string;
  description?: string;
  status: 'draft' | 'pending' | 'approved' | 'partially_shipped' | 'shipped' | 'partially_received' | 'completed' | 'cancelled' | 'rejected';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  transferType: 'replenishment' | 'allocation' | 'return' | 'adjustment' | 'emergency';
  requestedBy: string; // userId
  approvedBy?: string; // userId
  approvedAt?: Date;
  scheduledShipDate?: Date;
  actualShipDate?: Date;
  scheduledReceiveDate?: Date;
  actualReceiveDate?: Date;
  totalItems: number;
  totalQuantity: number;
  totalValue?: number;
  notes?: string;
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface BulkInventoryTransferCreationAttributes extends Omit<BulkInventoryTransferAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class BulkInventoryTransfer extends Model<BulkInventoryTransferAttributes, BulkInventoryTransferCreationAttributes> {
}

BulkInventoryTransfer.init(
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
    bulkTransferNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    sourceStoreId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'stores',
        key: 'id',
      },
    },
    destinationStoreId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'stores',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'approved', 'partially_shipped', 'shipped', 'partially_received', 'completed', 'cancelled', 'rejected'),
      allowNull: false,
      defaultValue: 'draft',
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'normal',
    },
    transferType: {
      type: DataTypes.ENUM('replenishment', 'allocation', 'return', 'adjustment', 'emergency'),
      allowNull: false,
      defaultValue: 'replenishment',
    },
    requestedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    scheduledShipDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualShipDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    scheduledReceiveDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualReceiveDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    totalItems: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalQuantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    },
    totalValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reference: {
      type: DataTypes.STRING(100),
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
    modelName: 'BulkInventoryTransfer',
    tableName: 'bulk_inventory_transfers',
    timestamps: true,
    paranoid: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['bulk_transfer_number'],
      },
      {
        fields: ['tenant_id', 'status'],
      },
      {
        fields: ['tenant_id', 'source_store_id'],
      },
      {
        fields: ['tenant_id', 'destination_store_id'],
      },
      {
        fields: ['tenant_id', 'requested_by'],
      },
      {
        fields: ['tenant_id', 'approved_by'],
      },
      {
        fields: ['tenant_id', 'transfer_type'],
      },
      {
        fields: ['tenant_id', 'priority'],
      },
      {
        fields: ['tenant_id', 'scheduled_ship_date'],
      },
      {
        fields: ['tenant_id', 'created_at'],
      },
    ],
  }
);

export default BulkInventoryTransfer;