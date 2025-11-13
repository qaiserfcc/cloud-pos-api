#!/usr/bin/env node

/**
 * Database Synchronization Script
 * Synchronizes Sequelize models with the PostgreSQL database
 */

require('dotenv').config();

async function syncDatabase() {
  try {
    console.log('🔄 Synchronizing Sequelize models with database...');

    // Import the database instance that models use
    const sequelize = require('./dist/config/database').default;

    // Import models (this registers them with the sequelize instance)
    const models = require('./dist/db/models');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync all models
    console.log('🔄 Synchronizing models...');
    await sequelize.sync({ force: true }); // Use force: true to recreate tables
    console.log('✅ Models synchronized successfully');

  } catch (error) {
    console.error('❌ Database synchronization failed:', error.message);
    process.exit(1);
  }
}

// Run synchronization
if (require.main === module) {
  syncDatabase();
}

module.exports = { syncDatabase };