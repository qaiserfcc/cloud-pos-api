import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

class ApprovalRequest extends Model {
  // Association mixins
  readonly tenant?: any;
  readonly store?: any;
  readonly requestedBy?: any;
  readonly approvalRule?: any;
}

ApprovalRequest.init(
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
      allowNull: true,
      references: {
        model: 'stores',
        key: 'id',
      },
    },
    requestedById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    objectType: {
      type: DataTypes.ENUM('inventory_transfer', 'inventory_adjustment', 'sale', 'refund'),
      allowNull: false,
    },
    objectId: {
      type: DataTypes.UUID,
      allowNull: false,
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
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled', 'expired'),
      allowNull: false,
      defaultValue: 'pending',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium',
    },
    approvalRuleId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'approval_rules',
        key: 'id',
      },
    },
    currentLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    totalLevels: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    requiredApprovals: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    approvedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    rejectedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    approvalData: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    approvals: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelledAt: {
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
  },
  {
    sequelize,
    modelName: 'ApprovalRequest',
    tableName: 'approval_requests',
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        fields: ['tenant_id'],
      },
      {
        fields: ['tenant_id', 'store_id'],
      },
      {
        fields: ['tenant_id', 'status'],
      },
      {
        fields: ['tenant_id', 'object_type', 'object_id'],
      },
      {
        fields: ['tenant_id', 'requested_by_id'],
      },
      {
        fields: ['tenant_id', 'priority'],
      },
      {
        fields: ['expires_at'],
      },
      {
        fields: ['status', 'expires_at'],
      },
    ],
  }
);

export default ApprovalRequest;