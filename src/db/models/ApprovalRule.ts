import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

export interface ApprovalLevelRule {
  level: number;
  roles?: string[];
  approverRoles?: string[];
  minApprovals: number;
  approvers?: string[];
}

export interface ApprovalRuleConditions {
  requiresApproval: boolean;
  minAmount?: number;
  maxAmount?: number;
  approvalLevels: ApprovalLevelRule[];
  expiresInHours?: number;
  expiryHours?: number;
  metadata?: Record<string, unknown>;
  storeIds?: string[];
}

export interface ApprovalRuleAttributes {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  objectType: 'inventory_transfer' | 'inventory_adjustment' | 'sale' | 'refund';
  conditions: ApprovalRuleConditions;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ApprovalRuleCreationAttributes = Optional<
  ApprovalRuleAttributes,
  'id' | 'description' | 'conditions' | 'isActive' | 'createdAt' | 'updatedAt'
>;

class ApprovalRule extends Model<ApprovalRuleAttributes, ApprovalRuleCreationAttributes> implements ApprovalRuleAttributes {
  declare id: string;
  declare tenantId: string;
  declare name: string;
  declare description?: string;
  declare objectType: 'inventory_transfer' | 'inventory_adjustment' | 'sale' | 'refund';
  declare conditions: ApprovalRuleConditions;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ApprovalRule.init(
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    objectType: {
      type: DataTypes.ENUM('inventory_transfer', 'inventory_adjustment', 'sale', 'refund'),
      allowNull: false,
    },
    conditions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        requiresApproval: false,
        approvalLevels: [],
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    modelName: 'ApprovalRule',
    tableName: 'approval_rules',
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        fields: ['tenant_id'],
      },
      {
        fields: ['tenant_id', 'object_type'],
      },
      {
        fields: ['tenant_id', 'is_active'],
      },
    ],
  }
);

export default ApprovalRule;