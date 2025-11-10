import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export interface PaymentAttributes {
  id: string;
  tenantId: string;
  saleId: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'digital_wallet' | 'check' | 'gift_card' | 'loyalty_points';
  amount: number;
  referenceNumber?: string;
  transactionId?: string;
  paymentDate: Date;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  notes?: string;
  processedBy: string; // User ID who processed the payment
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface PaymentCreationAttributes extends Omit<PaymentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  declare public id: string;
  declare public tenantId: string;
  declare public saleId: string;
  declare public paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'digital_wallet' | 'check' | 'gift_card' | 'loyalty_points';
  declare public amount: number;
  declare public referenceNumber?: string;
  declare public transactionId?: string;
  declare public paymentDate: Date;
  declare public status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  declare public notes?: string;
  declare public processedBy: string;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
  declare public readonly deletedAt?: Date;

  // Association mixins
  declare public readonly tenant?: any;
  declare public readonly sale?: any;
  declare public readonly user?: any;
}

Payment.init(
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
    saleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sales',
        key: 'id',
      },
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'digital_wallet', 'check', 'gift_card', 'loyalty_points'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    transactionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    processedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
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
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true,
    paranoid: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
    underscored: true,
    indexes: [
      {
        fields: ['tenant_id', 'sale_id'],
      },
      {
        fields: ['tenant_id', 'payment_method'],
      },
      {
        fields: ['tenant_id', 'status'],
      },
      {
        fields: ['tenant_id', 'payment_date'],
      },
      {
        fields: ['processed_by'],
      },
    ],
  }
);

export default Payment;