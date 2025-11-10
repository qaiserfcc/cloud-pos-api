import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

export interface InventoryRegionAttributes {
  id: string;
  tenantId: string;
  regionCode: string;
  regionName: string;
  description?: string;
  managerId?: string; // userId of region manager
  isActive: boolean;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface InventoryRegionCreationAttributes extends Omit<InventoryRegionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class InventoryRegion extends Model<InventoryRegionAttributes, InventoryRegionCreationAttributes> {
}

InventoryRegion.init(
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
    regionCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    regionName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    managerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    timezone: {
      type: DataTypes.STRING(50),
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'InventoryRegion',
    tableName: 'inventory_regions',
    timestamps: true,
    paranoid: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['tenant_id', 'region_code'],
      },
      {
        fields: ['tenant_id', 'is_active'],
      },
      {
        fields: ['tenant_id', 'manager_id'],
      },
      {
        fields: ['tenant_id', 'created_at'],
      },
    ],
  }
);

export default InventoryRegion;