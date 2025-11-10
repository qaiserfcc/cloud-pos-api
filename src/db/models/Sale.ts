import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export interface SaleAttributes {
  id: string;
  tenantId: string;
  storeId: string;
  customerId?: string;
  userId: string; // Cashier who processed the sale
  saleNumber: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'partially_paid' | 'refunded';
  notes?: string;
  saleDate: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface SaleCreationAttributes extends Omit<SaleAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Sale extends Model<SaleAttributes, SaleCreationAttributes> {
}

Sale.init(
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
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    saleNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'partially_paid', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    saleDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    modelName: 'Sale',
    tableName: 'sales',
    timestamps: true,
    paranoid: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['tenant_id', 'sale_number'],
      },
      {
        fields: ['tenant_id', 'store_id', 'sale_date'],
      },
      {
        fields: ['tenant_id', 'customer_id'],
      },
      {
        fields: ['tenant_id', 'user_id'],
      },
      {
        fields: ['tenant_id', 'status'],
      },
      {
        fields: ['tenant_id', 'payment_status'],
      },
    ],
  }
);

export default Sale;