-- Run this in the Supabase SQL Editor after running prisma migrate
-- These policies ensure all data is scoped to the user's organization

-- Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_org_isolation" ON projects
  USING (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));

-- Budget Categories
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budget_categories_org_isolation" ON budget_categories
  USING (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));

-- Budget Templates
ALTER TABLE budget_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budget_templates_org_isolation" ON budget_templates
  USING (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));

-- Budget Template Items
ALTER TABLE budget_template_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budget_template_items_org_isolation" ON budget_template_items
  USING (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));

-- Invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_org_isolation_select" ON invoices
  FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));
CREATE POLICY "invoices_org_isolation_insert" ON invoices
  FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));
CREATE POLICY "invoices_org_isolation_update" ON invoices
  FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));
CREATE POLICY "invoices_org_isolation_delete" ON invoices
  FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));

-- Line Items
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "line_items_org_isolation_select" ON line_items
  FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));
CREATE POLICY "line_items_org_isolation_insert" ON line_items
  FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));
CREATE POLICY "line_items_org_isolation_update" ON line_items
  FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));
CREATE POLICY "line_items_org_isolation_delete" ON line_items
  FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));

-- Vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendors_org_isolation_select" ON vendors
  FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));
CREATE POLICY "vendors_org_isolation_insert" ON vendors
  FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));
CREATE POLICY "vendors_org_isolation_update" ON vendors
  FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));
CREATE POLICY "vendors_org_isolation_delete" ON vendors
  FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));

-- AI Settings
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_settings_org_isolation_select" ON ai_settings
  FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));
CREATE POLICY "ai_settings_org_isolation_insert" ON ai_settings
  FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));
CREATE POLICY "ai_settings_org_isolation_update" ON ai_settings
  FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));
CREATE POLICY "ai_settings_org_isolation_delete" ON ai_settings
  FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
  ));
