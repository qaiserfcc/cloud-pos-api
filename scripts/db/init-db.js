#!/usr/bin/env node

/**
 * Database Initialization Script
 * Initializes PostgreSQL database with the cloud POS schema
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SCHEMA_FILE = path.join(__dirname, 'cloud-pos-schema-clean.sql');

function initializeDatabase() {
  try {
    console.log('🚀 Initializing Cloud POS Database...');

    // Check if schema file exists
    if (!fs.existsSync(SCHEMA_FILE)) {
      throw new Error(`Schema file not found: ${SCHEMA_FILE}`);
    }

    // Database connection string
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'cloud_pos';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPassword = process.env.DB_PASSWORD;

    if (!dbPassword) {
      throw new Error('DB_PASSWORD environment variable is required');
    }

    // Create database if it doesn't exist
    console.log('📦 Creating database if it doesn\'t exist...');
    const createDbCommand = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "CREATE DATABASE ${dbName} WITH OWNER = ${dbUser} ENCODING = 'UTF8';" 2>/dev/null || echo "Database ${dbName} already exists"`;

    execSync(createDbCommand, {
      env: { ...process.env, PGPASSWORD: dbPassword },
      stdio: 'inherit'
    });

    // Run schema initialization
    console.log('🏗️  Running schema initialization...');
    const schemaCommand = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f ${SCHEMA_FILE}`;

    execSync(schemaCommand, {
      env: { ...process.env, PGPASSWORD: dbPassword },
      stdio: 'inherit'
    });

    console.log('✅ Database initialization completed successfully!');
    console.log('🎉 Cloud POS database is ready for use.');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// Run initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };