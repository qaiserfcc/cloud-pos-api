import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

class ApprovalRule extends Model {
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