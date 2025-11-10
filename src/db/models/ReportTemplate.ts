import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';

class ReportTemplate extends Model {
  // Association mixins
  readonly tenant?: any;
  readonly createdBy?: any;
}

ReportTemplate.init(
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
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reportType: {
      type: DataTypes.ENUM('sales', 'inventory', 'customer', 'product', 'business', 'compliance', 'audit', 'custom'),
      allowNull: false,
    },
    filters: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    schedule: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    delivery: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    lastRunAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nextRunAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ReportTemplate',
    tableName: 'report_templates',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['tenant_id'],
      },
      {
        fields: ['created_by_id'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['next_run_at'],
      },
    ],
  }
);

export default ReportTemplate;