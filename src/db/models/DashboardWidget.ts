import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export interface DashboardWidgetAttributes {
  id: string;
  tenantId?: string;
  storeId?: string;
  widgetKey: string;
  config: object;
  roles: string[];
  permissions: string[];
  position?: object;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardWidgetCreationAttributes extends Omit<DashboardWidgetAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class DashboardWidget extends Model<DashboardWidgetAttributes, DashboardWidgetCreationAttributes> implements DashboardWidgetAttributes {
  declare public id: string;
  declare public tenantId?: string;
  declare public storeId?: string;
  declare public widgetKey: string;
  declare public config: object;
  declare public roles: string[];
  declare public permissions: string[];
  declare public position?: object;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  // Association mixins
  declare public readonly tenant?: any;
  declare public readonly store?: any;
}

DashboardWidget.init(
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
    widgetKey: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    roles: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: false,
      defaultValue: [],
    },
    permissions: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: false,
      defaultValue: [],
    },
    position: {
      type: DataTypes.JSONB,
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
    modelName: 'DashboardWidget',
    tableName: 'dashboard_widget_configs',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    underscored: true,
    indexes: [
      {
        fields: ['tenant_id', 'store_id'],
      },
      {
        fields: ['widget_key'],
      },
      {
        fields: ['roles'],
        using: 'gin',
      },
      {
        fields: ['permissions'],
        using: 'gin',
      },
    ],
  }
);

export default DashboardWidget;