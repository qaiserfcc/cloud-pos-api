module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    // Focus coverage on app composition, routes, middlewares, and general utils
    'src/middlewares/**/*.ts',
    'src/routes/**/*.ts',
    'src/utils/**/*.ts',
    'src/routes/**/*.ts',
    'src/middlewares/**/*.ts',
    'src/utils/**/*.ts',
    // Exclusions
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/**/*.test.ts',
    '!src/utils/jwt.ts', // skip crypto helpers from coverage target
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  setupFilesAfterEnv: [],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};