#!/usr/bin/env node

import 'dotenv/config';
import { seedInitialData } from './src/db/seeders/initial-seed.ts';
import sequelize from './src/config/database.ts';
import logger from './src/config/logger.ts';

const runSeeder = async () => {
  try {
    logger.info('Connecting to database...');
    await sequelize.authenticate();
    logger.info('Database connection established');

    logger.info('Running initial data seeder...');
    await seedInitialData();
    logger.info('Seeding completed successfully');

    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
};

runSeeder();