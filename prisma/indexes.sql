-- Performance indexes for Invoice Tracker
-- Run this in the Supabase SQL Editor after deploying
-- These are non-destructive (CREATE INDEX IF NOT EXISTS)

-- ==========================================
-- Invoices: Most queried table
-- ==========================================

-- Filtered invoice list (by org + project + status)
CREATE INDEX IF NOT EXISTS idx_invoices_org_project_status
  ON invoices (org_id, project_id, status);

-- Sort by date (default sort)
CREATE INDEX IF NOT EXISTS idx_invoices_org_project_date
  ON invoices (org_id, project_id, created_at DESC);

-- Search by vendor name (case-insensitive via text_pattern_ops for LIKE)
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_name
  ON invoices (org_id, vendor_name);

-- Invoice number lookup
CREATE INDEX IF NOT EXISTS idx_invoices_number
  ON invoices (org_id, invoice_number);

-- ==========================================
-- Line Items: Joined on every invoice view
-- ==========================================

-- Fetch line items for an invoice
CREATE INDEX IF NOT EXISTS idx_line_items_invoice
  ON line_items (invoice_id);

-- Aggregate spending by category
CREATE INDEX IF NOT EXISTS idx_line_items_category
  ON line_items (category_id) WHERE category_id IS NOT NULL;

-- Aggregate spending by org (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_line_items_org
  ON line_items (org_id);

-- ==========================================
-- Budget Categories: Queried per project
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_budget_categories_project
  ON budget_categories (org_id, project_id, sort_order);

-- ==========================================
-- Vendors: Queried per org
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_vendors_org
  ON vendors (org_id, normalized_name);

-- ==========================================
-- Org Memberships: Auth lookups
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_org_memberships_user
  ON org_memberships (user_id);

-- ==========================================
-- Org Invites: Token lookups
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_org_invites_org_status
  ON org_invites (org_id, status);
