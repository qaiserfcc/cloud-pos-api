import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export interface CategoryAttributes {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CategoryCreationAttributes extends Omit<CategoryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  declare public id: string;
  declare public tenantId: string;
  declare public name: string;
  declare public description?: string;
  declare public color?: string;
  declare public icon?: string;
  declare public sortOrder: number;
  declare public isActive: boolean;
  declare public parentId?: string;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
  declare public readonly deletedAt?: Date;

  // Association mixins
  declare public readonly tenant?: any;
  declare public readonly parent?: any;
  declare public readonly subcategories?: any[];
  declare public readonly products?: any[];
}

Category.init(
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
    color: {
      type: DataTypes.STRING(7), // Hex color code
      allowNull: true,
      validate: {
        is: /^#[0-9A-F]{6}$/i,
      },
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
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
    modelName: 'Category',
    tableName: 'categories',
    timestamps: true,
    paranoid: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['tenant_id', 'name'],
      },
      {
        fields: ['tenant_id', 'parent_id'],
      },
      {
        fields: ['tenant_id', 'sort_order'],
      },
    ],
  }
);

export default Category;