'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('inventory_transfers', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      transferNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      sourceStoreId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'stores',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      destinationStoreId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'stores',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      productId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      unitCost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'in_transit', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      requestedBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      approvedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      approvedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      shippedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      receivedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      reference: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes for performance
    await queryInterface.addIndex('inventory_transfers', ['tenantId']);
    await queryInterface.addIndex('inventory_transfers', ['sourceStoreId']);
    await queryInterface.addIndex('inventory_transfers', ['destinationStoreId']);
    await queryInterface.addIndex('inventory_transfers', ['productId']);
    await queryInterface.addIndex('inventory_transfers', ['status']);
    await queryInterface.addIndex('inventory_transfers', ['transferNumber']);
    await queryInterface.addIndex('inventory_transfers', ['createdAt']);
    await queryInterface.addIndex('inventory_transfers', ['tenantId', 'status']);
    await queryInterface.addIndex('inventory_transfers', ['tenantId', 'sourceStoreId']);
    await queryInterface.addIndex('inventory_transfers', ['tenantId', 'destinationStoreId']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('inventory_transfers');
  }
};
