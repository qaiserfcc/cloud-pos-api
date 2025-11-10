import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UserAttributes {
  id: string;
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  defaultStoreId?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  loginAttempts: number;
  lockoutUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'loginAttempts'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare public id: string;
  declare public tenantId: string;
  declare public email: string;
  declare public password: string;
  declare public firstName: string;
  declare public lastName: string;
  declare public phone?: string;
  declare public avatar?: string;
  declare public defaultStoreId?: string;
  declare public isActive: boolean;
  declare public lastLoginAt?: Date;
  declare public passwordChangedAt?: Date;
  declare public loginAttempts: number;
  declare public lockoutUntil?: Date;
  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  // Association mixins
  declare public readonly tenant?: any;
  declare public readonly defaultStore?: any;
  declare public readonly roles?: any[];
  declare public readonly orders?: any[];
  declare public readonly auditLogs?: any[];
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenants',
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
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    defaultStoreId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'stores',
        key: 'id',
      },
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
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        fields: ['tenantId'],
      },
      {
        fields: ['email'],
      },
      {
        fields: ['tenantId', 'isActive'],
      },
      {
        fields: ['defaultStoreId'],
      },
    ],
  }
);

export default User;