'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('inventory_region_stores', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
      },
      inventoryRegionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'inventory_regions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      storeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'stores',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
    });

    // Add unique constraint to prevent duplicate region-store associations
    await queryInterface.addIndex('inventory_region_stores', ['inventoryRegionId', 'storeId'], {
      unique: true,
      name: 'unique_inventory_region_store'
    });

    // Add indexes for performance
    await queryInterface.addIndex('inventory_region_stores', ['inventoryRegionId']);
    await queryInterface.addIndex('inventory_region_stores', ['storeId']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('inventory_region_stores');
  }
};
