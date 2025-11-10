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
  declare public id: string;
  declare public tenantId: string;
  declare public ruleName: string;
  declare public description?: string;
  declare public productId?: string;
  declare public categoryId?: string;
  declare public storeIds?: string[];
  declare public regionId?: string;
  declare public minStockLevel: number;
  declare public maxStockLevel: number;
  declare public reorderQuantity: number;
  declare public reorderPoint: number;
  declare public leadTimeDays: number;
  declare public safetyStockDays: number;
  declare public isActive: boolean;
  declare public priority: 'low' | 'normal' | 'high';
  declare public lastTriggeredAt?: Date;
  declare public nextCheckAt?: Date;
  declare public checkFrequencyHours: number;
  declare public createdBy: string;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
  declare public readonly deletedAt?: Date;

  // Association mixins
  declare public readonly tenant?: any;
  declare public readonly product?: any;
  declare public readonly category?: any;
  declare public readonly region?: any;
  declare public readonly creator?: any;
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