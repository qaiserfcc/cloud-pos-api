"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Store extends sequelize_1.Model {
}
exports.Store = Store;
Store.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    tenantId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'tenants',
            key: 'id',
        },
    },
    name: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    address: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    settings: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    modelName: 'Store',
    tableName: 'stores',
    timestamps: true,
    paranoid: false,
    indexes: [
        {
            fields: ['tenantId'],
        },
        {
            fields: ['tenantId', 'isActive'],
        },
    ],
});
exports.default = Store;
//# sourceMappingURL=store.model.js.map