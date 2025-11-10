# Cloud POS API – AI Agents Guidelines

## 1. Project Overview

The Cloud POS API is a modular, multi-tenant Point-of-Sale backend built on Node.js, Express, and PostgreSQL, with offline synchronization support using SQLite. Its core purpose is to manage tenants, stores, users, roles, permissions, inventory, sales, payments, and reporting.

AI agents should operate as autonomous or semi-autonomous coding assistants, producing high-quality code following these guidelines while respecting the multi-tenant architecture, role-based access control (RBAC), and sync mechanisms.

## 2. Architecture Guidelines

### 2.1. Project Structure
```
cloud-pos-api/
 ├── src/
 │    ├── config/          → Environment, database, logger
 │    ├── db/              → Migrations, models, seeders
 │    ├── middlewares/     → Auth, tenant/store context, audit
 │    ├── routes/          → API route definitions
 │    ├── controllers/     → Business logic per module
 │    ├── services/        → Data processing, sync, and utilities
 │    ├── utils/           → Helpers, JWT, logger
 │    ├── app.ts           → Express app configuration
 │    └── server.ts        → Entry point
 ├── prisma/ or migrations/ → Database migrations
 ├── package.json
 └── tsconfig.json
```

### 2.2. Core Modules
1. **Tenants & Stores** – Manage hierarchical tenant → store relationships.
2. **Users, Roles, Permissions** – Supports Superadmin, tenant admin, store users; implement RBAC.
3. **POS Operations** – Sales, payments, products, inventory, returns, and reporting.
4. **CRM & Loyalty** – Track customers, transactions, and rewards.
5. **Dashboard & Widgets** – Configurable per role/permissions.
6. **Sync Service** – Synchronizes changes with desktop SQLite databases.
7. **Audit Logs** – Capture changes at tenant/store/user levels for security and compliance.

---

## 3. AI Agent Responsibilities

### 3.1. Code Generation
- Generate TypeScript Sequelize models from DDL or specifications.
- Create Express controllers and services for CRUD operations.
- Generate routes automatically based on module folder structure.
- Implement tenant-aware query filtering using middleware.
- Scaffold sync endpoints and manage change_queue operations.

### 3.2. Multi-Tenant Awareness
- All database queries must include tenantId (and storeId if applicable).
- Global query filters should be applied in Sequelize models or services.
- Superadmin has unrestricted access; tenant/store users are scoped.

### 3.3. Role-Based Access Control
- Enforce permissions per API endpoint.
- Generate middleware checks for roles/permissions dynamically from DB models.
- Superadmin bypasses all permission checks.

### 3.4. Sync Operations
- AI agents must implement change tracking in models via hooks.
- change_queue must capture insert, update, delete actions with tenant/store info.
- Provide endpoints for download (cloud → desktop) and upload (desktop → cloud).
- Ensure conflict resolution strategies are defined (e.g., cloud authoritative or latest timestamp).

### 3.5. Audit Logging
- Track all data changes in audit_logs table.
- Include: userId, tenantId, storeId, entity, entityId, action, timestamp.
- AI agents should implement hooks or middleware to automatically log relevant actions.

---

## 4. API Design Principles
1. **RESTful Standards** – Use proper HTTP verbs: GET, POST, PUT, DELETE.
2. **Versioning** – Prefix endpoints with /api/v1/... for future evolution.
3. **Error Handling** – Return JSON errors consistently with HTTP codes.
4. **Validation** – Validate input data using express-validator or equivalent.
5. **Security** – JWT authentication, input sanitization, rate limiting, HTTPS enforced.
6. **Documentation** – Auto-generate Swagger/OpenAPI docs for all endpoints.

---

## 5. Database & ORM Guidelines
- Use Sequelize or Prisma for ORM.
- Maintain models, migrations, and seeders in source control.
- Track tenantId and storeId for all tenant-scoped entities.
- Use hooks to populate change_queue and audit_logs.
- Provide indexes on frequently queried columns (tenantId, storeId, updatedAt).

---

## 6. Development & Deployment Guidelines
1. **Environment Configuration** – Use .env for secrets, DB connection, JWT keys.
2. **CI/CD Pipeline** – Run migrations, build TypeScript, run tests before deploy.
3. **Dockerized Deployment** – API service + PostgreSQL; ensure dev/prod parity.
4. **Testing** – Unit tests with Jest; integration tests for endpoint behavior.
5. **Logging** – Use Winston + request logging middleware.

---

## 7. AI Code Style & Standards
- TypeScript strict mode enabled.
- ESLint + Prettier for consistency.
- Modular, reusable functions; services separate from controllers.
- Comment all generated code with clear documentation.
- Follow Clean Architecture where controllers call services, services call repositories/models.

---

## 8. Example AI Agent Workflow
1. Generate Sequelize model from DDL → save in /models.
2. Generate migration → save in /db/migrations.
3. Generate CRUD controller → save in /controllers.
4. Generate route → save in /routes.
5. Inject tenant/store middleware → ensure queries are scoped.
6. Apply RBAC middleware → generate permission checks.
7. Generate OpenAPI documentation.
8. Create sync hook → write change to change_queue.
9. Add audit hook → log changes in audit_logs.

---

## 9. Sync & Offline Mode Guidelines
- change_queue maintains sequential changes with changeVersion.
- Desktop app pulls changes using /sync/download.
- Desktop app pushes changes using /sync/upload.
- AI agents must ensure idempotent operations and resolve conflicts according to configured rules.
- Provide batch processing for performance.

---

## 10. Maintenance & Scalability Guidelines
•	Use Redis caching for frequently accessed tenant/store data.
•	Queue long-running operations (e.g., reports, sync) via BullMQ or similar.
•	Keep controllers thin; business logic resides in services.
•	Audit and change tracking are mandatory for all persistent entities.
•	Add new entities via Sequelize models + migration + sync + audit automatically.

⸻

## 11. AI Agents Flow & Task Matrix

### 1. System Flow Overview
```
                  ┌───────────────┐
                  │   SuperAdmin  │
                  │  (Full Access)│
                  └──────┬────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
   ┌───────────────┐             ┌───────────────┐
   │    Tenant     │             │      Roles     │
   │   Admin/Users │             │ Permissions    │
   └──────┬────────┘             └──────┬────────┘
          │                             │
 ┌────────┴───────────┐          ┌──────┴─────────┐
 │       Store        │          │    Dashboard   │
 │  Users & POS Data  │          │   Widgets      │
 └────────┬───────────┘          └──────┬─────────┘
          │                             │
          │                             │
  ┌───────┴─────────┐             ┌─────┴─────────┐
  │      POS        │             │     Audit      │
  │  Sales, Payments│             │   Logs         │
  │  Products, CRM  │             └────────────────┘
  └───────┬─────────┘
          │
  ┌───────┴─────────┐
  │  Inventory &    │
  │  Reporting      │
  └───────┬─────────┘
          │
  ┌───────┴─────────┐
  │   Sync Service  │
  │ Cloud ↔ SQLite  │
  └─────────────────┘
```

### 2. AI Agent Task Matrix

| Module | AI Agent Responsibilities | Data Flow Notes |
|--------|--------------------------|------------------|
| Auth | Generate JWT auth endpoints; validate credentials | User login → token → context injection |
| Tenants | Generate model, controller, routes; tenant CRUD | Scoped by tenantId; linked to stores & users |
| Stores | Generate model, controller, routes; store CRUD | Scoped by tenantId |
| Users | Model + role assignment + permission injection | User → Roles → Permissions; support superadmin |
| Roles & Permissions | Generate models, seed default system roles/permissions | Roles define endpoint access; superadmin bypasses |
| POS (Sales, Payments, Products) | CRUD, validation, multi-tenant filtering | tenantId + storeId enforced; sync hooks for change_queue |
| Inventory | Track stock, adjust quantities, trigger alerts | Scoped by store; updates feed change_queue & audit_logs |
| CRM & Loyalty | Customer data, purchase history, reward points | Scoped by tenant/store; supports personalized dashboard |
| Dashboard Widgets | Generate per-role dynamic widget configs | Fetch permissions → render allowed widgets |
| Audit Logs | Generate hooks for all models; record changes | Log userId, tenantId, storeId, entity, action, timestamp |
| Sync Service | Upload/download changes, resolve conflicts | Cloud authoritative; desktop can operate offline |
| Reports | Generate sales & inventory reports | Read-only; tenant/store scoped; supports export |
| Middleware | Tenant/store context injection, RBAC enforcement | Applied globally for every request |

### 3. AI Agent Data Flow Rules

1. **Context Injection**
   - Every request contains (tenantId, storeId) from headers or JWT.
   - Superadmin bypasses tenant/store filters.

2. **RBAC Enforcement**
   - Middleware checks user roles and permissions.
   - AI agents auto-generate permission middleware for each endpoint.

3. **Audit & Sync Hooks**
   - Insert/update/delete triggers create records in:
     - audit_logs
     - change_queue
   - AI agents ensure hooks respect tenant/store hierarchy.

4. **Sync Workflow**
   - Desktop → Cloud: Upload changes via /sync/upload → server validates → persists → marks synced.
   - Cloud → Desktop: /sync/download → returns changes with changeVersion > last client version.
   - Conflict resolution: cloud authoritative or timestamp-based.

5. **Dashboard Widgets**
   - Fetch permissions → map allowed widgets dynamically.
   - AI agents generate configuration endpoints for front-end.

---

### 4. Example AI Agent Execution Sequence

**Scenario: A store user creates a sale transaction.**
1. Request: POST /api/pos/sales with sale details.
2. Tenant/Store Context: Middleware injects tenantId + storeId.
3. RBAC: Middleware checks sales.create permission.
4. Controller: Calls SaleService → validates → inserts Sale + SaleItems.
5. Hooks:
   - Audit log records user, action, timestamp.
   - Change queue records transaction for sync.
6. Sync Worker: Picks up change_queue → pushes to desktop or next cloud sync batch.
7. Response: Returns sale with id + updated totals.

---

### 5. AI Agent Best Practices
- **Autonomy**: AI agents generate code, hooks, and endpoints without hardcoding tenant/store IDs.
- **Consistency**: Use standardized naming for models, tables, and routes.
- **Validation**: All input validated using centralized validators.
- **Scalability**: Generate code compatible with future modules (e.g., advanced reporting, multi-location inventory).
- **Documentation**: Auto-generate Swagger/OpenAPI docs for all endpoints.

---

This flow + matrix allows AI agents to understand how every module interacts, where context is injected, how audit and sync work, and what tasks they are responsible for.

---

## ✅ Conclusion

These guidelines ensure AI agents can:
- Generate consistent, secure, and maintainable code.
- Preserve multi-tenant hierarchy and role-based access.
- Integrate seamlessly with cloud ↔ desktop sync layers.
- Maintain auditability and extensibility for future POS modules.