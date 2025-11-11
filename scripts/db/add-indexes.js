#!/usr/bin/env node

/**
 * Add Custom Indexes Migration Script
 * Adds unique indexes for roles and permissions tables
 */

require('dotenv').config();

async function addCustomIndexes() {
  try {
    console.log('🔄 Adding custom indexes to database...');

    // Import the database instance that models use
    const sequelize = require('../dist/config/database').default;

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('🔄 Adding indexes...');

    // Add unique index on roles(tenant_id, name) - only for non-deleted records
    await sequelize.query(`
      CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "roles_tenant_id_name"
      ON "roles" ("tenant_id", "name")
      WHERE "deleted_at" IS NULL;
    `);
    console.log('✅ Added unique index on roles(tenant_id, name)');

    // Add unique index on permissions(tenant_id, resource, action) - only for non-deleted records
    await sequelize.query(`
      CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "permissions_tenant_id_resource_action"
      ON "permissions" ("tenant_id", "resource", "action")
      WHERE "deleted_at" IS NULL;
    `);
    console.log('✅ Added unique index on permissions(tenant_id, resource, action)');

    console.log('✅ All custom indexes added successfully');

  } catch (error) {
    console.error('❌ Error adding indexes:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run migration
if (require.main === module) {
  addCustomIndexes();
}

module.exports = { addCustomIndexes };