import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';

class User extends Model {
  // Association mixins
  readonly tenant?: any;
  readonly defaultStore?: any;
  readonly roles?: any[];

  // Property declarations
  declare id: string;
  declare tenantId: string;
  declare defaultStoreId?: string;
  declare email: string;
  declare password: string;
  declare firstName: string;
  declare lastName: string;
  declare phone?: string;
  declare avatar?: string;
  declare isActive: boolean;
  declare lastLoginAt?: Date;
  declare passwordChangedAt?: Date;
  declare loginAttempts: number;
  declare lockoutUntil?: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

User.init(
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
    defaultStoreId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'stores',
        key: 'id',
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    passwordChangedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lockoutUntil: {
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['tenant_id', 'email'],
      },
      {
        fields: ['tenant_id', 'default_store_id'],
      },
    ],
  }
);

export default User;