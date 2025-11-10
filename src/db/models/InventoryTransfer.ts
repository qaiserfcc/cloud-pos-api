import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export interface InventoryTransferAttributes {
  id: string;
  tenantId: string;
  transferNumber: string;
  sourceStoreId: string;
  destinationStoreId: string;
  productId: string;
  quantity: number;
  unitCost?: number;
  status: 'pending' | 'approved' | 'rejected' | 'in_transit' | 'completed' | 'cancelled';
  requestedBy: string; // userId
  approvedBy?: string; // userId
  approvedAt?: Date;
  shippedAt?: Date;
  receivedAt?: Date;
  notes?: string;
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface InventoryTransferCreationAttributes extends Omit<InventoryTransferAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class InventoryTransfer extends Model<InventoryTransferAttributes, InventoryTransferCreationAttributes> implements InventoryTransferAttributes {
  declare id: string;
  declare tenantId: string;
  declare transferNumber: string;
  declare sourceStoreId: string;
  declare destinationStoreId: string;
  declare productId: string;
  declare quantity: number;
  declare unitCost?: number;
  declare status: 'pending' | 'approved' | 'rejected' | 'in_transit' | 'cancelled' | 'completed';
  declare requestedBy: string;
  declare approvedBy?: string;
  declare approvedAt?: Date;
  declare shippedAt?: Date;
  declare receivedAt?: Date;
  declare notes?: string;
  declare reference?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;

  // Association mixins
  declare readonly tenant?: any;
  declare readonly sourceStore?: any;
  declare readonly destinationStore?: any;
  declare readonly product?: any;
  declare readonly requester?: any;
  declare readonly approver?: any;
}

InventoryTransfer.init(
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
    transferNumber: {
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
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'in_transit', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
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
    shippedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    receivedAt: {
      type: DataTypes.DATE,
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
    modelName: 'InventoryTransfer',
    tableName: 'inventory_transfers',
    timestamps: true,
    paranoid: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['transfer_number'],
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
        fields: ['tenant_id', 'product_id'],
      },
      {
        fields: ['tenant_id', 'requested_by'],
      },
      {
        fields: ['tenant_id', 'approved_by'],
      },
      {
        fields: ['tenant_id', 'created_at'],
      },
    ],
  }
);

export default InventoryTransfer;