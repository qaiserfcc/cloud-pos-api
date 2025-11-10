"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tenant = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Tenant extends sequelize_1.Model {
}
exports.Tenant = Tenant;
Tenant.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    domain: {
        type: sequelize_1.DataTypes.STRING(255),
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
    modelName: 'Tenant',
    tableName: 'tenants',
    timestamps: true,
    paranoid: false,
    indexes: [
        {
            unique: true,
            fields: ['domain'],
            where: {
                domain: {
                    [sequelize_1.Op.ne]: null,
                },
            },
        },
    ],
});
exports.default = Tenant;
//# sourceMappingURL=tenant.model.js.map