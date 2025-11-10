import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { Tenant } from './tenant.model';
import { Store } from './store.model';
import { User } from './user.model';

export interface AuditLogAttributes {
  id: string;
  tenantId?: string;
  storeId?: string;
  userId?: string;
  objectTable: string;
  objectId?: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data?: any;
  changedAt: Date;
  // Associations
  tenant?: Tenant;
  store?: Store;
  user?: User;
}

export interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'changedAt'> {}

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes {
  public id!: string;
  public tenantId?: string;
  public storeId?: string;
  public userId?: string;
  public objectTable!: string;
  public objectId?: string;
  public action!: 'INSERT' | 'UPDATE' | 'DELETE';
  public data?: any;
  public changedAt!: Date;

  // Associations
  public readonly tenant?: Tenant;
  public readonly store?: Store;
  public readonly user?: User;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
    },
    storeId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'stores',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'system_users',
        key: 'id',
      },
    },
    objectTable: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    objectId: {
      type: DataTypes.UUID,
      allowNull: true,
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
    },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    timestamps: false,
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

// Define associations
AuditLog.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  as: 'tenant',
});

AuditLog.belongsTo(Store, {
  foreignKey: 'storeId',
  as: 'store',
});

AuditLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export default AuditLog;