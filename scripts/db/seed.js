#!/usr/bin/env node

require('dotenv').config();
const { up: seedInitialData } = require('./initial-seed');
const sequelize = require('../../dist/config/database').default;
const logger = require('../../dist/config/logger').default;

const runSeeder = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established');

    console.log('Running initial data seeder...');
    await seedInitialData();
    console.log('Seeding completed successfully');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

runSeeder();