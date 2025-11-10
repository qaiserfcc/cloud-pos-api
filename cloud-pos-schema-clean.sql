-- pos_schema_hybrid.sql
-- Baseline: Schema 2
-- Merged: Schema 1 (Orders, Order Items, Payments, Refunds)
-- Generated for: Rao

-- ===================================================================
-- Extensions & basic sequences
-- ===================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid() 
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 

-- Global change/version sequences (monotonic)
CREATE SEQUENCE IF NOT EXISTS change_version_seq AS bigint START WITH 1; 
CREATE SEQUENCE IF NOT EXISTS tombstone_seq AS bigint START WITH 1; 

-- ===================================================================
-- Helper: settings and safety
-- ===================================================================
-- Application will set session variables via: SET LOCAL app.user_id = '<uuid>'; 
-- Example: SET session "app.user_id" = '...'; 
-- Use current_setting('app.user_id', true) to get nullable. 

-- ===================================================================
-- Core tenancy & identity tables
-- ===================================================================
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  timezone text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
); 

CREATE TABLE stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  address jsonb,
  timezone text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(tenant_id, code)
); 
CREATE INDEX IF NOT EXISTS idx_stores_tenant ON stores(tenant_id); 

CREATE TABLE system_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text,
  password_hash text,
  is_superadmin boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
); 
CREATE INDEX IF NOT EXISTS idx_users_email ON system_users(email); 

-- Roles & permissions
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid, -- null => system-level role
  name text NOT NULL,
  description text,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, name)
); 
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id); 

CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL, -- e.g., sales.create
  description text
); 

CREATE TABLE role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, permission_id)
); 
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id); 

CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id uuid,
  store_id uuid,
  assigned_by uuid,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id, tenant_id, store_id)
); 
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id); 

-- Dashboard widget configs
CREATE TABLE dashboard_widget_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  store_id uuid,
  widget_key text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  roles uuid[] DEFAULT ARRAY[]::uuid[],
  permissions uuid[] DEFAULT ARRAY[]::uuid[],
  position jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
); 
CREATE INDEX IF NOT EXISTS idx_dashboard_tenant_store ON dashboard_widget_configs(tenant_id, store_id); 

-- Audit logs (immutable)
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  store_id uuid,
  user_id uuid,
  object_table text NOT NULL,
  object_id uuid,
  action text NOT NULL, -- 'INSERT','UPDATE','DELETE'
  data jsonb,
  changed_at timestamptz DEFAULT now()
); 
CREATE INDEX IF NOT EXISTS idx_audit_tenant_store ON audit_logs(tenant_id, store_id); 
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON audit_logs(changed_at); 

-- ===================================================================
-- POS domain tables
-- ===================================================================

-- Products (catalog-level)
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id uuid, -- optional: product can be store specific (NULL = tenant-level)
  name text NOT NULL,
  description text,
  sku text,
  barcode text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  version bigint DEFAULT 1
); 
CREATE INDEX IF NOT EXISTS idx_products_tenant_store ON products(tenant_id, store_id); 
CREATE UNIQUE INDEX IF NOT EXISTS uq_products_tenant_store_sku ON products(tenant_id, store_id, sku) WHERE sku IS NOT NULL; 
CREATE UNIQUE INDEX IF NOT EXISTS uq_products_tenant_store_barcode ON products(tenant_id, store_id, barcode) WHERE barcode IS NOT NULL; 

CREATE TABLE product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  store_id uuid,
  name text,
  sku text,
  barcode text,
  price numeric(12,2) DEFAULT 0,
  cost numeric(12,2) DEFAULT 0,
  attributes jsonb DEFAULT '{}'::jsonb, -- e.g., size/color
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  version bigint DEFAULT 1,
  UNIQUE (tenant_id, store_id, sku)
); 
CREATE INDEX IF NOT EXISTS idx_variants_tenant_store ON product_variants(tenant_id, store_id); 
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id); 

-- Inventory per store per variant
CREATE TABLE inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL,
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity numeric DEFAULT 0,
  reserved numeric DEFAULT 0,
  reorder_threshold numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (tenant_id, store_id, variant_id)
); 
CREATE INDEX IF NOT EXISTS idx_inventory_tenant_store ON inventory(tenant_id, store_id); 

CREATE TABLE inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL,
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  change numeric NOT NULL, -- positive or negative
  type text NOT NULL, -- 'sale','purchase','adjustment','transfer'
  reference_id uuid, -- e.g., sale_id or purchase_id
  notes text,
  created_at timestamptz DEFAULT now()
); 
CREATE INDEX IF NOT EXISTS idx_inv_tx_variant ON inventory_transactions(variant_id); 

-- Suppliers & purchases
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid,
  name text NOT NULL,
  contact jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
); 
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON suppliers(tenant_id); 

CREATE TABLE purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL,
  supplier_id uuid REFERENCES suppliers(id),
  external_po_no text,
  status text DEFAULT 'draft',
  total_amount numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
); 
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_store ON purchase_orders(tenant_id, store_id); 

CREATE TABLE purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL,
  quantity numeric NOT NULL,
  unit_cost numeric(12,2) NOT NULL,
  total_cost numeric(12,2) NOT NULL
); 

-- Customers & loyalty
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid,
  external_customer_no text,
  name text,
  email text,
  phone text,
  addresses jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
); 
CREATE INDEX IF NOT EXISTS idx_customers_tenant_store ON customers(tenant_id, store_id); 
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_tenant_phone ON customers(tenant_id, phone) WHERE phone IS NOT NULL; 

CREATE TABLE customer_loyalty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  store_id uuid,
  points numeric DEFAULT 0,
  tier text,
  metadata jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
); 

-- ===================================================================
-- MODIFIED: Sales, payments, and refunds (from Schema 1)
-- ===================================================================
-- NOTE: Replaced S2 'sales', 'sale_items', 'sale_payments'
-- with S1 'orders', 'order_items', 'payments', 'refunds'
-- FKs and types adapted to S2 baseline.

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL,
  pos_id uuid REFERENCES terminals(id), -- Adapted to ref S2 'terminals' 
  external_order_number text,
  customer_id uuid REFERENCES customers(id), 
  status text NOT NULL DEFAULT 'draft', -- 'draft','paid','cancelled','refunded' 
  subtotal numeric(14,4),
  tax_total numeric(14,4),
  discount_total numeric(14,4),
  total numeric(14,4), 
  created_by uuid REFERENCES system_users(id), -- Adapted to ref S2 'system_users'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz, 
  version bigint DEFAULT 1 -- Added for S2 sync compatibility 
);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_store ON orders(tenant_id, store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE, 
  variant_id uuid REFERENCES product_variants(id), -- Adapted to ref S2 'product_variants'
  sku text,
  name text, -- Denormalized for historical accuracy
  quantity numeric(14,4) NOT NULL,
  unit_price numeric(14,4) NOT NULL,
  tax_amount numeric(14,4) DEFAULT 0,
  discount_amount numeric(14,4) DEFAULT 0,
  total_price numeric(14,4),
  metadata jsonb DEFAULT '{}'::jsonb
); 
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE, 
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL,
  amount numeric(14,4) NOT NULL,
  currency_code text,
  payment_method text NOT NULL, -- 'cash','card','mobile','giftcard' 
  provider text, -- e.g., card gateway 
  gateway_response jsonb, -- Hybrid: from S2 'sale_payments' 
  provider_ref text, 
  status text DEFAULT 'completed', 
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
); 
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_store ON payments(tenant_id, store_id);

CREATE TABLE refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL,
  amount numeric(14,4) NOT NULL,
  reason text,
  processed_by uuid REFERENCES system_users(id), -- Adapted to ref S2 'system_users'
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now() -- Added for consistency
); 
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_tenant_store ON refunds(tenant_id, store_id);

-- ===================================================================
-- End of modified section
-- ===================================================================

-- Payments and gateways configuration
CREATE TABLE payment_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  store_id uuid,
  name text NOT NULL,
  config jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
); 
CREATE INDEX IF NOT EXISTS idx_payment_gateways_tenant ON payment_gateways(tenant_id); 

-- Terminals & sessions
CREATE TABLE terminals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL,
  code text,
  name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
); 
CREATE INDEX IF NOT EXISTS idx_terminals_store ON terminals(store_id); 

CREATE TABLE pos_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL,
  terminal_id uuid REFERENCES terminals(id),
  opened_by uuid REFERENCES system_users(id), -- FK added
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  status text DEFAULT 'open',
  metadata jsonb DEFAULT '{}'::jsonb
); 
CREATE INDEX IF NOT EXISTS idx_pos_sessions_store ON pos_sessions(store_id); 

-- Taxes, discounts, promotions
CREATE TABLE taxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid,
  name text,
  rate numeric(8,4),
  active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb
); 
CREATE INDEX IF NOT EXISTS idx_taxes_tenant ON taxes(tenant_id); 

CREATE TABLE discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid,
  name text,
  type text, -- 'percentage','fixed'
  value numeric,
  active boolean DEFAULT true,
  conditions jsonb,
  metadata jsonb DEFAULT '{}'::jsonb
); 

-- Attachments (file metadata)
CREATE TABLE attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  store_id uuid,
  owner_table text,
  owner_id uuid,
  filename text,
  content_type text,
  size bigint,
  storage_path text, -- pointer to object store
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
); 
CREATE INDEX IF NOT EXISTS idx_attachments_owner ON attachments(owner_table, owner_id); 

-- Settings (tenant/store)
CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  store_id uuid,
  key text NOT NULL,
  value jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, store_id, key)
); 

-- ===================================================================
-- Sync infra
-- ===================================================================
CREATE TABLE change_queue (
  id bigserial PRIMARY KEY,
  change_version bigint NOT NULL,
  table_name text NOT NULL,
  row_id uuid,
  tenant_id uuid,
  store_id uuid,
  operation text NOT NULL, -- 'I','U','D'
  payload jsonb,
  created_at timestamptz DEFAULT now()
); 
-- note: change_version populated from change_version_seq 
CREATE INDEX IF NOT EXISTS idx_change_queue_tenant_store_cv ON change_queue(tenant_id, store_id, change_version); 
CREATE INDEX IF NOT EXISTS idx_change_queue_table_cv ON change_queue(table_name, change_version); 

CREATE TABLE sync_tombstones (
  id bigint PRIMARY KEY,
  table_name text NOT NULL,
  row_id uuid NOT NULL,
  tenant_id uuid,
  store_id uuid,
  deleted_at timestamptz DEFAULT now()
); 
CREATE INDEX IF NOT EXISTS idx_tombstones_tenant_store ON sync_tombstones(tenant_id, store_id); 

CREATE TABLE sync_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  store_id uuid,
  client_id text,
  last_synced_version bigint DEFAULT 0,
  last_seen timestamptz DEFAULT now()
); 

CREATE TABLE sync_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  store_id uuid,
  table_name text NOT NULL,
  row_id uuid,
  client_payload jsonb,
  server_payload jsonb,
  strategy text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolution jsonb
); 
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_tenant ON sync_conflicts(tenant_id); 

-- ===================================================================
-- Generic trigger functions: change queue, tombstone, audit
-- ===================================================================
-- Generic function to record changes into change_queue, audit_logs and tombstones. 
CREATE OR REPLACE FUNCTION fn_record_change() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_tenant uuid;
  v_store uuid;
  v_row_id uuid;
  v_payload jsonb;
  v_op text; 
  v_cv bigint;
  v_user text := current_setting('app.user_id', true); -- nullable 
  v_user_uuid uuid := NULL;
BEGIN
  -- Determine operation type
  IF (TG_OP = 'INSERT') THEN
    v_op := 'I'; 
    v_payload := to_jsonb(NEW); 
    v_row_id := COALESCE(NEW.id, NULL)::uuid;
    v_tenant := COALESCE(NEW.tenant_id, NULL)::uuid;
    v_store := COALESCE(NEW.store_id, NULL)::uuid;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_op := 'U';
    v_payload := to_jsonb(NEW); 
    v_row_id := COALESCE(NEW.id, NULL)::uuid;
    v_tenant := COALESCE(NEW.tenant_id, OLD.tenant_id, NULL)::uuid; 
    v_store := COALESCE(NEW.store_id, OLD.store_id, NULL)::uuid; 
  ELSIF (TG_OP = 'DELETE') THEN
    v_op := 'D';
    v_payload := to_jsonb(OLD); 
    v_row_id := COALESCE(OLD.id, NULL)::uuid;
    v_tenant := COALESCE(OLD.tenant_id, NULL)::uuid; 
    v_store := COALESCE(OLD.store_id, NULL)::uuid; 
  ELSE
    RETURN NULL;
  END IF;

  -- Get a monotonic change_version
  v_cv := nextval('change_version_seq'); 

  -- Insert change queue row
  INSERT INTO change_queue (change_version, table_name, row_id, tenant_id, store_id, operation, payload, created_at)
  VALUES (v_cv, TG_TABLE_NAME, v_row_id, v_tenant, v_store, v_op, v_payload, now()); 

  -- Insert audit log (immutable) 
  BEGIN
    IF v_user IS NOT NULL THEN
      v_user_uuid := v_user::uuid; 
    END IF;
  EXCEPTION WHEN others THEN
    v_user_uuid := NULL;
  END;
  INSERT INTO audit_logs (tenant_id, store_id, user_id, object_table, object_id, action, data, changed_at)
  VALUES (v_tenant, v_store, v_user_uuid, TG_TABLE_NAME, v_row_id, TG_OP, v_payload, now()); 

  -- For deletes write tombstone for sync 
  IF TG_OP = 'DELETE' THEN
    INSERT INTO sync_tombstones (id, table_name, row_id, tenant_id, store_id, deleted_at)
    VALUES (nextval('tombstone_seq'), TG_TABLE_NAME, v_row_id, v_tenant, v_store, now()); 
  END IF;

  -- Optionally bump version if column exists 
  IF TG_OP = 'UPDATE' THEN
    BEGIN
      -- If a 'version' column exists on the table, increment it.
      -- This check is lightweight and fails gracefully if 'version' col is missing.
      NEW.version = COALESCE(OLD.version, 0) + 1;
    EXCEPTION WHEN undefined_column THEN
      -- ignore, table may not have version
      NULL;
    END;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;


-- ===================================================================
-- Attach generic trigger to domain tables
-- ===================================================================
-- Helper to create trigger for a table:
-- CREATE TRIGGER trg_<table>_change AFTER INSERT OR UPDATE OR DELETE ON <table> FOR EACH ROW EXECUTE FUNCTION fn_record_change();

-- List of tables to attach triggers to:
DO $$
DECLARE
  tbl text;
  -- MODIFIED: Removed 'sales', 'sale_items', 'sale_payments'
  -- ADDED: 'orders', 'order_items', 'payments', 'refunds'
  tables text[] := ARRAY[
    'tenants','stores','system_users','roles','permissions','role_permissions','user_roles',
    'dashboard_widget_configs','products','product_variants','inventory','inventory_transactions',
    'suppliers','purchase_orders','purchase_items','customers','customer_loyalty',
    'orders', 'order_items', 'payments', 'refunds', -- <-- NEW TABLES
    'payment_gateways','terminals','pos_sessions','taxes','discounts',
    'attachments','settings'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Create trigger if not exists (safe attempt)
    EXECUTE format($f$
      DO $inner$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger t
          JOIN pg_class c ON t.tgrelid = c.oid
          WHERE c.relname = %L AND t.tgname = %L
        ) THEN
          EXECUTE %L;
        END IF;
      END;
      $inner$;
    $f$, tbl, 'trg_'||tbl||'_change', 'CREATE TRIGGER trg_'||tbl||'_change AFTER INSERT OR UPDATE OR DELETE ON '||quote_ident(tbl)||' FOR EACH ROW EXECUTE FUNCTION fn_record_change()'); 
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- Row-Level Security (RLS) templates and example application
-- ===================================================================
-- Example: Enable RLS on tenant-scoped tables and create common policies. 
-- NOTE: adapt role/session management and permissions to your application. 

-- Example for a tenant-scoped table: products
ALTER TABLE products ENABLE ROW LEVEL SECURITY; 
-- Policy: superadmin has full access
CREATE POLICY products_superadmin_all ON products
  FOR ALL
  USING ( current_setting('app.is_superadmin', true) = 'true' )
  WITH CHECK ( current_setting('app.is_superadmin', true) = 'true' ); 
-- Policy: tenant access (reads/writes allowed when tenant_id matches session)
CREATE POLICY products_tenant_access ON products
  FOR ALL
  USING ( tenant_id = current_setting('app.tenant_id', true)::uuid )
  WITH CHECK ( tenant_id = current_setting('app.tenant_id', true)::uuid ); 

-- Example quick loop to enable RLS (careful: production impact)
DO $$
DECLARE
  -- MODIFIED: Removed 'sales', 'sale_items', 'sale_payments'
  -- ADDED: 'orders', 'order_items', 'payments', 'refunds'
  rls_tables text[] := ARRAY[
    'products','product_variants','inventory','inventory_transactions','customers',
    'orders', 'order_items', 'payments', 'refunds', -- <-- NEW TABLES
    'purchase_orders','purchase_items','settings','dashboard_widget_configs'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY rls_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t); 
  END LOOP;
END;
$$;

-- ===================================================================
-- Maintenance helpers (vacuum/cleanup jobs recommended)
-- ===================================================================
CREATE OR REPLACE FUNCTION fn_cleanup_old_change_queue(retention_days integer DEFAULT 30) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM change_queue WHERE created_at < now() - (retention_days || ' days')::interval; 
END;
$$;

CREATE OR REPLACE FUNCTION fn_cleanup_old_audit_logs(retention_days integer DEFAULT 365) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM audit_logs WHERE changed_at < now() - (retention_days || ' days')::interval; 
END;
$$;

-- ===================================================================
-- Seeds: example permission codes (minimal)
-- ===================================================================
INSERT INTO permissions (id, code, description)
VALUES
  (gen_random_uuid(), 'sales.create', 'Create sales invoices'),
  (gen_random_uuid(), 'sales.view', 'View sales records'),
  (gen_random_uuid(), 'inventory.adjust', 'Adjust inventory levels'),
  (gen_random_uuid(), 'products.manage', 'Create/edit products'),
  (gen_random_uuid(), 'reports.view', 'View reports'),
  (gen_random_uuid(), 'settings.manage', 'Manage tenant settings')
ON CONFLICT (code) DO NOTHING; 

-- ===================================================================
-- Optional: Views to simplify sync queries
-- ===================================================================
CREATE OR REPLACE VIEW vw_changes_for_sync AS
SELECT id, change_version, table_name, row_id, tenant_id, store_id, operation, payload, created_at
FROM change_queue; 

-- ===================================================================
-- Final notes:
--  - Review trigger overhead on high-volume tables (orders, inventory). 
--  - Consider partitioning large tables (change_queue, audit_logs, orders) by tenant_id or by date. 
--  - Make sure session variables are set per-connection: 
--      SET LOCAL "app.user_id" = '<user-uuid>'; 
--      SET LOCAL "app.tenant_id" = '<tenant-uuid>'; 
--      SET LOCAL "app.store_id" = '<store-uuid>'; 
--      SET LOCAL "app.is_superadmin" = 'true' OR 'false'; 
--  - For SQLite mapping: remove UUID defaults, convert timestamptz to TEXT (ISO8601), and convert sequences to integer autoincrement. 
-- ===================================================================