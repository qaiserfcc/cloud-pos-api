import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export interface AutomatedReorderRuleAttributes {
  id: string;
  tenantId: string;
  ruleName: string;
  description?: string;
  productId?: string; // null for category-based rules
  categoryId?: string; // null for product-specific rules
  storeIds?: string[]; // null for all stores
  regionId?: string; // null for store-specific rules
  minStockLevel: number;
  maxStockLevel: number;
  reorderQuantity: number;
  reorderPoint: number; // when to trigger reorder
  leadTimeDays: number; // supplier lead time
  safetyStockDays: number; // safety stock in days
  isActive: boolean;
  priority: 'low' | 'normal' | 'high';
  lastTriggeredAt?: Date;
  nextCheckAt?: Date;
  checkFrequencyHours: number; // how often to check this rule
  createdBy: string; // userId
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface AutomatedReorderRuleCreationAttributes extends Omit<AutomatedReorderRuleAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class AutomatedReorderRule extends Model<AutomatedReorderRuleAttributes, AutomatedReorderRuleCreationAttributes> implements AutomatedReorderRuleAttributes {
  declare id: string;
  declare tenantId: string;
  declare ruleName: string;
  declare description?: string;
  declare productId?: string;
  declare categoryId?: string;
  declare storeIds?: string[];
  declare regionId?: string;
  declare minStockLevel: number;
  declare maxStockLevel: number;
  declare reorderQuantity: number;
  declare reorderPoint: number;
  declare leadTimeDays: number;
  declare safetyStockDays: number;
  declare isActive: boolean;
  declare priority: 'low' | 'normal' | 'high';
  declare lastTriggeredAt?: Date;
  declare nextCheckAt?: Date;
  declare checkFrequencyHours: number;
  declare createdBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;

  // Association mixins
  declare readonly tenant?: any;
  declare readonly product?: any;
  declare readonly category?: any;
  declare readonly region?: any;
  declare readonly creator?: any;
}

AutomatedReorderRule.init(
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
    ruleName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    storeIds: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of store IDs this rule applies to',
    },
    regionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'inventory_regions',
        key: 'id',
      },
    },
    minStockLevel: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    maxStockLevel: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    reorderQuantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      validate: {
        min: 0.001,
      },
    },
    reorderPoint: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    leadTimeDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    safetyStockDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high'),
      allowNull: false,
      defaultValue: 'normal',
    },
    lastTriggeredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nextCheckAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    checkFrequencyHours: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 24, // check daily by default
      validate: {
        min: 1,
        max: 168, // max 1 week
      },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'AutomatedReorderRule',
    tableName: 'automated_reorder_rules',
    timestamps: true,
    paranoid: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
    underscored: true,
    indexes: [
      {
        fields: ['tenant_id', 'is_active'],
      },
      {
        fields: ['tenant_id', 'product_id'],
      },
      {
        fields: ['tenant_id', 'category_id'],
      },
      {
        fields: ['tenant_id', 'region_id'],
      },
      {
        fields: ['tenant_id', 'next_check_at'],
      },
      {
        fields: ['tenant_id', 'priority'],
      },
      {
        fields: ['tenant_id', 'created_by'],
      },
      {
        fields: ['tenant_id', 'created_at'],
      },
    ],
  }
);

export default AutomatedReorderRule;