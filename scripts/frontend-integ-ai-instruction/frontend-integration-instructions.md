# Frontend Integration Instructions for Cloud POS API

## Overview

This document provides comprehensive instructions for an AI agent (e.g., GitHub Copilot) to integrate the Cloud POS API into a frontend application. The Cloud POS API is a multi-tenant Point-of-Sale backend built with Node.js, Express, and PostgreSQL, supporting offline synchronization via SQLite. It manages tenants, stores, users, roles, permissions, inventory, sales, payments, CRM, and reporting.

### Key Concepts
- **Multi-Tenant Architecture**: Data is isolated by `tenantId` and `storeId`. Regular users are scoped to their tenant/store; superadmin has unrestricted access across all tenants.
- **Superadmin Role**: Users with the 'superadmin' role bypass all tenant/store filters and permission checks, allowing global data access and management.
- **Tenant Context**: Non-superadmin users operate within their assigned tenant and store, with data filtered accordingly.
- **Authentication**: JWT-based, using Stack Auth SDK for frontend auth components.
- **Frontend Assumptions**: Next.js app with TypeScript, using `@stackframe/stack` for auth, React Query for data fetching, and Tailwind CSS for styling.

The integration covers the full user journey: login → dashboard → detailed pages for all models (tenants, stores, users, etc.), with API calls, error handling, and UI considerations.

---

## 1. Project Setup

### Tech Stack
- **Frontend**: Next.js 14+, TypeScript, Tailwind CSS, React Query (TanStack Query), `@stackframe/stack` for auth.
- **Backend Integration**: RESTful APIs at `/api/v1/*`, with JWT in `Authorization: Bearer <token>` header.
- **Environment**: `.env.local` with `NEXT_PUBLIC_STACK_PROJECT_ID`, `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`, `STACK_SECRET_SERVER_KEY`, and API base URL (e.g., `http://localhost:3001`).

### Initial Setup Steps
1. Initialize Next.js project: `npx create-next-app@latest frontend --typescript --tailwind --app`.
2. Install dependencies: `npm install @stackframe/stack @tanstack/react-query axios`.
3. Set up Stack Auth: Run `npx @stackframe/init-stack . --no-browser` to configure auth.
4. Configure API client: Create `lib/api.ts` with Axios instance, interceptors for JWT, and base URL.
5. Wrap app in providers: In `app/layout.tsx`, use `<StackProvider>`, `<QueryClientProvider>`, and global styles.

---

## 2. Authentication and Login Flow

### Overview
Users log in via Stack Auth components. On success, fetch user context (including superadmin status) and redirect to dashboard. Superadmin sees global views; others see tenant-scoped data.

### Implementation Steps
1. **Login Page** (`app/login/page.tsx`):
   - Render `<SignIn />` from `@stackframe/stack`.
   - On success, use `useUser()` to get user data.
   - Call `POST /api/v1/auth/login` (or rely on Stack Auth) to get JWT and context.
   - Store token and redirect to `/dashboard`.

2. **Auth Middleware** (`middleware.ts`):
   - Protect routes: Redirect unauthenticated users to `/login`.
   - For superadmin, allow access to all; for others, enforce tenant context.

3. **User Context**:
   - Store in React context: `{ user, tenant, store, isSuperadmin }`.
   - Update on login/logout.

4. **Logout**:
   - Call `user.signOut()` and clear context.

### API Calls
- `POST /api/v1/auth/login`: Login with email/password.
- `GET /api/v1/auth/me`: Refresh user context.

---

## 3. Dashboard Page

### Overview
The dashboard displays widgets based on user permissions. Superadmin sees all widgets globally; others see tenant/store-scoped widgets.

### Implementation Steps
1. **Page Structure** (`app/dashboard/page.tsx`):
   - Fetch widgets on mount using `GET /api/v1/dashboard/widgets`.
   - Render grid of widgets (e.g., Sales Summary, Inventory Alerts).
   - For superadmin, show global metrics; for others, scoped.

2. **Widget Components**:
   - Create reusable components like `<SalesWidget />`, `<InventoryWidget />`.
   - Each fetches data via `GET /api/v1/dashboard/widgets/:key`.

3. **Additional Data**:
   - Fetch summary: `GET /api/v1/dashboard/summary`.
   - Fetch alerts: `GET /api/v1/dashboard/alerts`.
   - Display in header/sidebar.

### API Calls
- `GET /api/v1/dashboard/widgets`: List available widgets.
- `GET /api/v1/dashboard/widgets/:key`: Widget data (e.g., sales, inventory).
- `GET /api/v1/dashboard/summary`: High-level metrics.
- `GET /api/v1/dashboard/alerts`: Notifications.

---

## 4. Tenant Management

### Overview
Superadmin can view/edit all tenants; others cannot access.

### Implementation Steps
1. **List Page** (`app/tenants/page.tsx`):
   - Superadmin: Fetch all tenants via `GET /api/v1/tenants`.
   - Display table with name, domain, status.

2. **Detail Page** (`app/tenants/[id]/page.tsx`):
   - Fetch tenant: `GET /api/v1/tenants/:id`.
   - Edit form: `PUT /api/v1/tenants/:id`.

3. **Create Page** (`app/tenants/create/page.tsx`):
   - Form: `POST /api/v1/tenants`.

### API Calls
- `GET /api/v1/tenants`: List (superadmin only).
- `GET /api/v1/tenants/:id`: Details.
- `POST /api/v1/tenants`: Create.
- `PUT /api/v1/tenants/:id`: Update.
- `DELETE /api/v1/tenants/:id`: Delete.

---

## 5. Store Management

### Overview
Superadmin sees all stores; tenant users see only their tenant's stores.

### Implementation Steps
1. **List Page** (`app/stores/page.tsx`):
   - Fetch stores: `GET /api/v1/stores` (filtered by tenant for non-superadmin).
   - Table: Name, code, address, status.

2. **Detail/Edit Pages**: Similar to tenants, with CRUD.

### API Calls
- `GET /api/v1/stores`: List.
- `GET /api/v1/stores/:id`: Details.
- `POST /api/v1/stores`: Create.
- `PUT /api/v1/stores/:id`: Update.
- `DELETE /api/v1/stores/:id`: Delete.

---

## 6. User Management

### Overview
Superadmin manages all users; tenant admins manage users in their tenant.

### Implementation Steps
1. **List Page** (`app/users/page.tsx`):
   - Fetch users: `GET /api/v1/users` (scoped by tenant).
   - Assign roles: `PUT /api/v1/users/:id/roles`.

2. **Profile Page** (`app/profile/page.tsx`):
   - Fetch: `GET /api/v1/users/profile`.
   - Update: `PUT /api/v1/users/profile`.

### API Calls
- `GET /api/v1/users`: List.
- `GET /api/v1/users/:id`: Details.
- `POST /api/v1/users`: Create.
- `PUT /api/v1/users/:id`: Update.
- `DELETE /api/v1/users/:id`: Delete.
- `GET /api/v1/users/profile`: Profile.
- `PUT /api/v1/users/:id/roles`: Assign roles.

---

## 7. Role and Permission Management

### Overview
Superadmin manages all; tenant admins manage within tenant.

### Implementation Steps
1. **Roles Page** (`app/roles/page.tsx`):
   - CRUD for roles: `GET /api/v1/roles`, etc.
   - Assign permissions: `PUT /api/v1/roles/:id/permissions`.

2. **Permissions Page**: List permissions.

### API Calls
- `GET /api/v1/roles`: List.
- `POST /api/v1/roles`: Create.
- `PUT /api/v1/roles/:id`: Update.
- `DELETE /api/v1/roles/:id`: Delete.
- `GET /api/v1/permissions`: List.
- `PUT /api/v1/roles/:id/permissions`: Assign.

---

## 8. POS Operations (Sales, Payments, Products)

### Overview
Scoped by tenant/store; superadmin sees all.

### Implementation Steps
1. **Sales Page** (`app/sales/page.tsx`):
   - List: `GET /api/v1/sales`.
   - Create: `POST /api/v1/sales`.
   - Items: `GET /api/v1/sales/:id/items`.

2. **Payments**: Similar, with `GET /api/v1/payments`.

3. **Products/Inventory**: CRUD for products, track inventory.

### API Calls
- `GET /api/v1/sales`: List.
- `POST /api/v1/sales`: Create.
- `GET /api/v1/payments`: List.
- `GET /api/v1/products`: List.
- `POST /api/v1/products`: Create.
- `GET /api/v1/inventory`: Inventory levels.

---

## 9. CRM and Loyalty

### Overview
Manage customers and rewards.

### Implementation Steps
1. **Customers Page** (`app/customers/page.tsx`):
   - CRUD: `GET /api/v1/customers`, etc.
   - Loyalty: `GET /api/v1/customers/:id/loyalty`.

### API Calls
- `GET /api/v1/customers`: List.
- `POST /api/v1/customers`: Create.
- `GET /api/v1/loyalty`: Loyalty data.

---

## 10. Reporting and Sync

### Overview
Generate reports; handle sync for offline.

### Implementation Steps
1. **Reports Page** (`app/reports/page.tsx`):
   - Fetch: `GET /api/v1/reports`.
   - Templates: `GET /api/v1/report-templates`.

2. **Sync Page**: `GET /sync/download` for desktop sync.

### API Calls
- `GET /api/v1/reports`: Generate reports.
- `GET /sync/download`: Sync data.

---

## General Guidelines

- **Error Handling**: Use try/catch, display toasts (e.g., react-hot-toast).
- **Loading States**: Show spinners during API calls.
- **Permissions**: Hide/show UI based on roles; superadmin sees all.
- **Testing**: Test with superadmin and tenant users.
- **Styling**: Use Tailwind for responsive, beautiful UI.

This covers the full integration. Follow the steps sequentially, starting from setup.