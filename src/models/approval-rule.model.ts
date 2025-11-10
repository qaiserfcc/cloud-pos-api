import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { Tenant } from './tenant.model';
import { Store } from './store.model';
import { User } from './user.model';

export interface ApprovalRuleAttributes {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  objectType: 'inventory_transfer' | 'inventory_adjustment' | 'sale' | 'refund';
  conditions: {
    minAmount?: number;
    maxAmount?: number;
    storeIds?: string[];
    userRoles?: string[];
    requiresApproval: boolean;
    autoApproveThreshold?: number;
    approvalLevels: Array<{
      level: number;
      approverRoles: string[];
      minApprovals: number;
      maxAmount?: number;
    }>;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalRuleCreationAttributes extends Optional<ApprovalRuleAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class ApprovalRule extends Model<ApprovalRuleAttributes, ApprovalRuleCreationAttributes>
  implements ApprovalRuleAttributes {
  public id!: string;
  public tenantId!: string;
  public name!: string;
  public description?: string;
  public objectType!: 'inventory_transfer' | 'inventory_adjustment' | 'sale' | 'refund';
  public conditions!: {
    minAmount?: number;
    maxAmount?: number;
    storeIds?: string[];
    userRoles?: string[];
    requiresApproval: boolean;
    autoApproveThreshold?: number;
    approvalLevels: Array<{
      level: number;
      approverRoles: string[];
      minApprovals: number;
      maxAmount?: number;
    }>;
  };
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly tenant?: Tenant;
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
        fields: ['tenantId'],
      },
      {
        fields: ['tenantId', 'objectType'],
      },
      {
        fields: ['tenantId', 'isActive'],
      },
    ],
  }
);

// Define associations
ApprovalRule.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  as: 'tenant',
});

export default ApprovalRule;