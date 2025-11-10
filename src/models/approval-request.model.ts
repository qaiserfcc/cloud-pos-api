import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { Tenant } from './tenant.model';
import { Store } from './store.model';
import { User } from './user.model';

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
  approvalData: {
    amount?: number;
    currency?: string;
    details?: any;
    metadata?: Record<string, any>;
  };
  approvals: Array<{
    level: number;
    approverId: string;
    approverRole: string;
    decision: 'approved' | 'rejected';
    comments?: string;
    approvedAt: Date;
  }>;
  expiresAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalRequestCreationAttributes extends Optional<ApprovalRequestAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class ApprovalRequest extends Model<ApprovalRequestAttributes, ApprovalRequestCreationAttributes>
  implements ApprovalRequestAttributes {
  public id!: string;
  public tenantId!: string;
  public storeId?: string;
  public requestedById!: string;
  public objectType!: 'inventory_transfer' | 'inventory_adjustment' | 'sale' | 'refund';
  public objectId!: string;
  public title!: string;
  public description?: string;
  public status!: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
  public priority!: 'low' | 'medium' | 'high' | 'urgent';
  public approvalRuleId?: string;
  public currentLevel!: number;
  public totalLevels!: number;
  public requiredApprovals!: number;
  public approvedCount!: number;
  public rejectedCount!: number;
  public approvalData!: {
    amount?: number;
    currency?: string;
    details?: any;
    metadata?: Record<string, any>;
  };
  public approvals!: Array<{
    level: number;
    approverId: string;
    approverRole: string;
    decision: 'approved' | 'rejected';
    comments?: string;
    approvedAt: Date;
  }>;
  public expiresAt?: Date;
  public approvedAt?: Date;
  public rejectedAt?: Date;
  public cancelledAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly tenant?: Tenant;
  public readonly store?: Store;
  public readonly requestedBy?: User;
  public readonly approvalRule?: any;
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
        fields: ['tenantId'],
      },
      {
        fields: ['tenantId', 'storeId'],
      },
      {
        fields: ['tenantId', 'status'],
      },
      {
        fields: ['tenantId', 'objectType', 'objectId'],
      },
      {
        fields: ['tenantId', 'requestedById'],
      },
      {
        fields: ['tenantId', 'priority'],
      },
      {
        fields: ['expiresAt'],
      },
      {
        fields: ['status', 'expiresAt'],
      },
    ],
  }
);

// Define associations
ApprovalRequest.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  as: 'tenant',
});

ApprovalRequest.belongsTo(Store, {
  foreignKey: 'storeId',
  as: 'store',
});

ApprovalRequest.belongsTo(User, {
  foreignKey: 'requestedById',
  as: 'requestedBy',
});

export default ApprovalRequest;