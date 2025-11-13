require('dotenv').config();

const commonConfig = {
  dialect: 'postgres',
  define: {
    timestamps: true,
    underscored: true,
    paranoid: true, // Enable soft deletes for all models
    defaultScope: {
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'deletedAt'],
      },
    },
  },
};

const getPoolConfig = (env = 'development') => ({
  max: parseInt(process.env.DB_POOL_MAX || (env === 'production' ? '20' : '10')),
  min: parseInt(process.env.DB_POOL_MIN || (env === 'production' ? '5' : '2')),
  acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
  idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
});

module.exports = {
  development: {
    ...commonConfig,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'cloud_pos_db',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: false,
    logging: console.log,
    pool: getPoolConfig('development'),
  },
  staging: {
    ...commonConfig,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'cloud_pos_db_staging',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_SSL === 'true',
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
    logging: false,
    pool: getPoolConfig('staging'),
  },
  test: {
    ...commonConfig,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME_TEST || 'cloud_pos_db_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: false,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  production: {
    ...commonConfig,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
    pool: getPoolConfig('production'),
  },
};