import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

class AuditLog extends Model {
  declare id: string;
  declare tenantId?: string;
  declare storeId?: string;
  declare userId?: string;
  declare objectTable: string;
  declare objectId?: string;
  declare action: 'INSERT' | 'UPDATE' | 'DELETE';
  declare data?: Record<string, any> | null;
  declare changedAt: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'tenants',
        key: 'id',
      },
      field: 'tenant_id',
    },
    storeId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'stores',
        key: 'id',
      },
      field: 'store_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      field: 'user_id',
    },
    objectTable: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'object_table',
    },
    objectId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'object_id',
    },
    action: {
      type: DataTypes.ENUM('INSERT', 'UPDATE', 'DELETE'),
      allowNull: false,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    changedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'changed_at',
    },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: false,
    paranoid: false,
    underscored: true,
    indexes: [
      {
        fields: ['tenant_id', 'store_id'],
        name: 'idx_audit_tenant_store',
      },
      {
        fields: ['changed_at'],
        name: 'idx_audit_changed_at',
      },
      {
        fields: ['object_table', 'object_id'],
        name: 'idx_audit_object',
      },
      {
        fields: ['user_id'],
        name: 'idx_audit_user',
      },
    ],
  }
);

export default AuditLog;