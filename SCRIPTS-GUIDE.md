# Database Scripts Quick Reference Guide

## 📁 New Project Structure

All scripts are now organized in the `scripts/` folder:

```
scripts/
├── db/              # All database-related scripts
│   ├── init-db.js
│   ├── seed.js, seed.mjs
│   ├── sync-db.js
│   ├── add-indexes.js
│   ├── test-approval-workflow.js
│   ├── initial-seed.ts/js
│   ├── permissions-seed.ts
│   └── *.sql files
│
└── other/           # Project utility scripts
    ├── generate-swagger.js
    ├── generate-postman.js
    └── fix-paths.js
```

## 🚀 Environment-Specific Commands

### Development Environment

```bash
# Database operations
npm run db:init:dev              # Initialize database
npm run db:create:dev            # Create database
npm run db:drop:dev              # Drop database
npm run db:migrate:dev           # Run migrations
npm run db:migrate:undo:dev      # Undo last migration
npm run db:migrate:undo:all:dev  # Undo all migrations
npm run db:seed:dev              # Run all seeders
npm run db:seed:undo:dev         # Undo all seeders
npm run db:reset:dev             # Complete reset (drop→create→migrate→seed)
```

### Staging Environment

```bash
npm run db:init:staging
npm run db:create:staging
npm run db:drop:staging
npm run db:migrate:staging
npm run db:migrate:undo:staging
npm run db:migrate:undo:all:staging
npm run db:seed:staging
npm run db:seed:undo:staging
npm run db:reset:staging
```

### Production Environment

⚠️ **Note**: Create and drop operations are intentionally excluded for production safety.

```bash
npm run db:migrate:prod           # Run migrations
npm run db:migrate:undo:prod      # Undo last migration
npm run db:seed:prod              # Run seeders (use with caution)
```

### Vercel Deployment

#### Development (Vercel)

```bash
npm run db:migrate:vercel         # Run migrations
npm run db:seed:vercel            # Run seeders
```

#### Production (Vercel)

```bash
npm run db:migrate:vercel:prod    # Run migrations
npm run db:seed:vercel:prod       # Run seeders
```

## 🔧 Utility Scripts

```bash
# Database utilities
npm run script:add-indexes        # Add database indexes
npm run script:sync-db            # Sync database schema
npm run script:test-approval      # Test approval workflow

# Documentation generation
npm run swagger:generate          # Generate Swagger API docs
npm run postman:generate          # Generate Postman collection
```

## 🔄 Legacy Commands (Backward Compatibility)

These commands still work and default to development environment:

```bash
npm run db:init                   # → npm run db:init:dev
npm run db:create                 # → npm run db:create:dev
npm run db:drop                   # → npm run db:drop:dev
npm run db:migrate                # → npm run db:migrate:dev
npm run db:migrate:undo           # → npm run db:migrate:undo:dev
npm run db:seed                   # → npm run db:seed:dev
npm run db:seed:undo              # → npm run db:seed:undo:dev
```

## 🌍 Environment Configuration

Each environment requires specific environment variables:

### Development (`.env`)

```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloud_pos_db
DB_USER=qaisu
DB_PASSWORD=password
```

### Staging (`.env.staging`)

```env
NODE_ENV=staging
DB_HOST=your-staging-host
DB_PORT=5432
DB_NAME=cloud_pos_db_staging
DB_USER=your-user
DB_PASSWORD=your-password
DB_SSL=true
```

### Production (`.env.production`)

```env
NODE_ENV=production
DB_HOST=your-production-host
DB_PORT=5432
DB_NAME=cloud_pos_db
DB_USER=your-user
DB_PASSWORD=your-password
DB_SSL=true
```

### Vercel Development (`.env.vercel`)

```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloud_pos_db
DB_USER=qaisu
DB_PASSWORD=password
```

### Vercel Production (`.env.vercel.production`)

```env
NODE_ENV=production
DB_HOST=ep-royal-union-ad8qh3pe-pooler.c-2.us-east-1.aws.neon.tech
DB_PORT=5432
DB_NAME=cloud_pos_db
DB_USER=neondb_owner
DB_PASSWORD=npg_6FRvg4sPeaxY
```

## 📝 Common Workflows

### Setting Up a Fresh Development Environment

```bash
npm install
npm run db:create:dev
npm run db:migrate:dev
npm run db:seed:dev
npm run dev
```

### Deploying to Staging

```bash
# Set staging environment variables
npm run db:migrate:staging
npm run db:seed:staging
```

### Deploying to Production

```bash
# Ensure production environment variables are set
npm run db:migrate:prod
# Optionally seed production data (be careful!)
npm run db:seed:prod
```

### Resetting Development Database

```bash
# Complete reset
npm run db:reset:dev

# Or manually:
npm run db:drop:dev
npm run db:create:dev
npm run db:migrate:dev
npm run db:seed:dev
```

### Creating New Migration

```bash
npx sequelize-cli migration:generate --name your-migration-name
# Edit the migration file in src/db/migrations/
npm run db:migrate:dev
```

### Creating New Seeder

```bash
npx sequelize-cli seed:generate --name your-seeder-name
# Edit the seeder file in src/db/seeders/
npm run db:seed:dev
```

## 🛠️ Technical Details

### Database Configuration

The database configuration is located in `config/config.js` and supports:

- **development**: Local PostgreSQL with logging enabled
- **staging**: Remote PostgreSQL with optional SSL
- **test**: Local PostgreSQL for testing
- **production**: Remote PostgreSQL with SSL required

### Cross-Platform Support

All commands use `cross-env` to ensure environment variables work correctly on:

- ✅ Windows
- ✅ macOS
- ✅ Linux

### Sequelize CLI Configuration

The `.sequelizerc` file in the project root configures Sequelize CLI paths:

```javascript
{
  'config': 'config/config.js',
  'models-path': 'src/db/models',
  'seeders-path': 'src/db/seeders',
  'migrations-path': 'src/db/migrations'
}
```

## 🔍 Troubleshooting

### Issue: "cross-env: command not found"

**Solution**: Install dependencies

```bash
npm install
```

### Issue: Database connection refused

**Solution**: Check environment variables and database server status

```bash
# Check PostgreSQL is running
psql -U qaisu -d cloud_pos_db

# Verify environment variables
cat .env
```

### Issue: Migration already executed

**Solution**: Check migration status

```bash
npx sequelize-cli db:migrate:status
```

### Issue: Permission denied on production

**Solution**: Ensure production credentials are correct and user has necessary permissions

```bash
# Test connection manually
psql -h $DB_HOST -U $DB_USER -d $DB_NAME
```

## 📚 Additional Resources

- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [Sequelize CLI Documentation](https://github.com/sequelize/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Neon Database Documentation](https://neon.tech/docs)

## ⚠️ Important Notes

1. **Never run** `db:drop` or `db:reset` commands on production
2. **Always backup** production database before running migrations
3. **Test migrations** in development and staging before production
4. **Review seeder scripts** before running in production
5. **Use transactions** for data-modifying operations
6. **Monitor migration execution** in production environments
