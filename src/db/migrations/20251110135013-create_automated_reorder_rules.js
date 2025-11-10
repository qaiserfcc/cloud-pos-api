'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('automated_reorder_rules', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      rule_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      store_ids: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of store IDs this rule applies to',
      },
      region_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'inventory_regions',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      min_stock_level: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      max_stock_level: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      reorder_quantity: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        validate: {
          min: 0.001,
        },
      },
      reorder_point: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      lead_time_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      safety_stock_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high'),
        allowNull: false,
        defaultValue: 'normal',
      },
      last_triggered_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      next_check_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      check_frequency_hours: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 24,
        validate: {
          min: 1,
          max: 168,
        },
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes
    await queryInterface.addIndex('automated_reorder_rules', ['tenant_id', 'is_active']);
    await queryInterface.addIndex('automated_reorder_rules', ['tenant_id', 'product_id']);
    await queryInterface.addIndex('automated_reorder_rules', ['tenant_id', 'category_id']);
    await queryInterface.addIndex('automated_reorder_rules', ['tenant_id', 'region_id']);
    await queryInterface.addIndex('automated_reorder_rules', ['tenant_id', 'next_check_at']);
    await queryInterface.addIndex('automated_reorder_rules', ['tenant_id', 'priority']);
    await queryInterface.addIndex('automated_reorder_rules', ['tenant_id', 'created_by']);
    await queryInterface.addIndex('automated_reorder_rules', ['tenant_id', 'created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('automated_reorder_rules');
  }
};
