import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

export interface ApprovalDecisionRecord {
  level: number;
  approverId: string;
  approverRole?: string;
  decision: 'approved' | 'rejected';
  comments?: string;
  approvedAt: Date;
}

export interface ApprovalRequestData {
  amount?: number;
  currency?: string;
  details?: unknown;
  metadata?: Record<string, unknown>;
}

export interface ApprovalRequestAttributes {
  id: string;
  tenantId: string;
  storeId?: string;
  requestedById: string;
  objectType: 'inventory_transfer' | 'inventory_adjustment' | 'sale' | 'refund';
  objectId: string;
  title: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  approvalRuleId?: string;
  currentLevel: number;
  totalLevels: number;
  requiredApprovals: number;
  approvedCount: number;
  rejectedCount: number;
  approvalData: ApprovalRequestData;
  approvals: ApprovalDecisionRecord[];
  expiresAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ApprovalRequestCreationAttributes = Optional<
  ApprovalRequestAttributes,
  | 'id'
  | 'storeId'
  | 'description'
  | 'status'
  | 'priority'
  | 'approvalRuleId'
  | 'currentLevel'
  | 'totalLevels'
  | 'requiredApprovals'
  | 'approvedCount'
  | 'rejectedCount'
  | 'approvalData'
  | 'approvals'
  | 'expiresAt'
  | 'approvedAt'
  | 'rejectedAt'
  | 'cancelledAt'
  | 'createdAt'
  | 'updatedAt'
>;

class ApprovalRequest extends Model<ApprovalRequestAttributes, ApprovalRequestCreationAttributes> implements ApprovalRequestAttributes {
  declare id: string;
  declare tenantId: string;
  declare storeId?: string;
  declare requestedById: string;
  declare objectType: 'inventory_transfer' | 'inventory_adjustment' | 'sale' | 'refund';
  declare objectId: string;
  declare title: string;
  declare description?: string;
  declare status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
  declare priority: 'low' | 'medium' | 'high' | 'urgent';
  declare approvalRuleId?: string;
  declare currentLevel: number;
  declare totalLevels: number;
  declare requiredApprovals: number;
  declare approvedCount: number;
  declare rejectedCount: number;
  declare approvalData: ApprovalRequestData;
  declare approvals: ApprovalDecisionRecord[];
  declare expiresAt?: Date;
  declare approvedAt?: Date;
  declare rejectedAt?: Date;
  declare cancelledAt?: Date;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Association mixins
  declare readonly tenant?: unknown;
  declare readonly store?: unknown;
  declare readonly requestedBy?: unknown;
  declare readonly approvalRule?: unknown;
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