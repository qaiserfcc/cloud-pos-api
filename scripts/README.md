# Scripts Organization

This folder contains all project scripts organized by purpose.

## Folder Structure

```
scripts/
├── db/              # Database-related scripts
│   ├── init-db.js                      # Initialize database
│   ├── seed.js / seed.mjs              # Database seeders
│   ├── sync-db.js                      # Database synchronization
│   ├── add-indexes.js                  # Add database indexes
│   ├── test-approval-workflow.js       # Test approval system
│   ├── initial-seed.ts / .js           # Initial data seeding
│   ├── permissions-seed.ts             # Permissions seeding
│   └── cloud-pos-initial-schema.sql    # Initial SQL schema
│   
└── other/           # Project utility scripts
    ├── generate-swagger.js             # Generate Swagger documentation
    ├── generate-postman.js             # Generate Postman collection
    └── fix-paths.js                    # Fix collection paths
```

## Database Scripts (`db/`)

Contains all database-related scripts including:
- **Initialization**: Scripts to set up the database
- **Migrations**: Database schema migrations (via Sequelize CLI)
- **Seeders**: Scripts to populate initial data
- **Utilities**: Database maintenance and testing scripts
- **SQL Files**: Raw SQL scripts for schema management

## Other Scripts (`other/`)

Contains project utility scripts that are not database-related:
- **API Documentation**: Swagger and Postman generation scripts
- **Testing**: Test utilities and helpers
- **Build Tools**: Scripts for project build and deployment

## Usage

### Environment-Specific Database Commands

#### Development
```bash
npm run db:init:dev           # Initialize database
npm run db:create:dev          # Create database
npm run db:migrate:dev         # Run migrations
npm run db:seed:dev            # Run seeders
npm run db:reset:dev           # Drop, create, migrate, and seed
```

#### Staging
```bash
npm run db:init:staging        # Initialize database
npm run db:create:staging      # Create database
npm run db:migrate:staging     # Run migrations
npm run db:seed:staging        # Run seeders
npm run db:reset:staging       # Drop, create, migrate, and seed
```

#### Production
```bash
npm run db:migrate:prod        # Run migrations (no create/drop in prod)
npm run db:seed:prod           # Run seeders
```

#### Vercel Deployment
```bash
# Development
npm run db:migrate:vercel      # Run migrations
npm run db:seed:vercel         # Run seeders

# Production
npm run db:migrate:vercel:prod # Run migrations
npm run db:seed:vercel:prod    # Run seeders
```

### Direct Script Execution

```bash
npm run script:add-indexes     # Add database indexes
npm run script:sync-db         # Sync database
npm run script:test-approval   # Test approval workflow
```

### Utility Scripts

```bash
npm run swagger:generate       # Generate Swagger documentation
npm run postman:generate       # Generate Postman collection
```

## Environment Variables

Each environment uses different `.env` files:
- **Development**: `.env` (local)
- **Staging**: `.env.staging`
- **Production**: `.env` or `.env.production`
- **Vercel Dev**: `.env.vercel`
- **Vercel Prod**: `.env.vercel.production`

Ensure appropriate environment variables are set before running database commands.

## Adding New Scripts

1. **Database Scripts**: Place in `scripts/db/`
2. **Other Scripts**: Place in `scripts/other/`
3. **Update package.json**: Add script command for easy access
4. **Document**: Update this README with usage instructions
