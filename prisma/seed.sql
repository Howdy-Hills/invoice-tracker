-- ============================================
-- Invoice Tracker Demo Seed Data
-- Run this in Supabase SQL Editor
-- Creates demo@example.com / demo123
-- ============================================

-- 1. Create the demo user in Supabase Auth
-- (password: demo123, pre-hashed with bcrypt)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, confirmation_token
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'demo@example.com',
  crypt('demo123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{}', ''
)
ON CONFLICT (id) DO NOTHING;

-- Auth identity (required for sign-in to work)
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000001', 'email', 'demo@example.com'),
  'email',
  'a0000000-0000-0000-0000-000000000001',
  now(), now(), now()
)
ON CONFLICT DO NOTHING;

-- 2. Organization
INSERT INTO organizations (id, name) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Howdy Hills Construction');

-- 3. Membership (owner)
INSERT INTO org_memberships (id, org_id, user_id, role) VALUES
  ('c0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'owner');

-- ============================================
-- PROJECT 1: Kitchen Renovation
-- ============================================

INSERT INTO projects (id, org_id, name, client_name, description, status) VALUES
  ('d0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001',
   'Miller Kitchen Renovation',
   'Sarah Miller',
   'Full kitchen remodel — cabinets, countertops, plumbing, electrical, flooring, appliances.',
   'active');

-- Budget categories for kitchen
INSERT INTO budget_categories (id, org_id, project_id, name, budgeted_amount, sort_order) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Demolition & Prep',    3000.00, 0),
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Plumbing',             8000.00, 1),
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Electrical',           6500.00, 2),
  ('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Cabinets & Countertops', 15000.00, 3),
  ('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Flooring',             5500.00, 4),
  ('e0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Appliances',           9000.00, 5),
  ('e0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Paint & Finishes',     2500.00, 6),
  ('e0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Labor',               12000.00, 7);

-- Vendors
INSERT INTO vendors (id, org_id, name, normalized_name, default_category_id, email, phone, notes) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Ace Plumbing Co',        'ace plumbing co',        'e0000000-0000-0000-0000-000000000002', 'billing@aceplumbing.com', '(512) 555-0101', 'Reliable, always on time'),
  ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'BrightSpark Electric',   'brightspark electric',   'e0000000-0000-0000-0000-000000000003', 'invoices@brightspark.com', '(512) 555-0202', NULL),
  ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Hill Country Cabinets',  'hill country cabinets',  'e0000000-0000-0000-0000-000000000004', 'info@hillcountrycabinets.com', '(512) 555-0303', 'Custom shop, 4-6 week lead time'),
  ('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Lone Star Flooring',     'lone star flooring',     'e0000000-0000-0000-0000-000000000005', NULL, '(512) 555-0404', NULL),
  ('f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Home Depot',             'home depot',             NULL, NULL, NULL, 'Materials & supplies'),
  ('f0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'Austin Appliance Outlet', 'austin appliance outlet', 'e0000000-0000-0000-0000-000000000006', 'sales@austinappoutlet.com', '(512) 555-0606', 'Good scratch-and-dent deals'),
  ('f0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'Martinez Painting',      'martinez painting',      'e0000000-0000-0000-0000-000000000007', NULL, '(512) 555-0707', NULL),
  ('f0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 'Demo Pros LLC',          'demo pros llc',          'e0000000-0000-0000-0000-000000000001', NULL, '(512) 555-0808', NULL);

-- ---- Kitchen Invoices ----

-- Invoice 1: Demolition
INSERT INTO invoices (id, org_id, project_id, vendor_name, invoice_number, invoice_date, total_amount, tax_amount, status, parse_method, notes) VALUES
  ('10000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'Demo Pros LLC', 'DP-2025-0418', '2025-11-05', 2850.00, 0, 'paid', 'manual', 'Kitchen demo complete');

INSERT INTO line_items (id, org_id, invoice_id, description, quantity, unit_price, amount, category_id) VALUES
  ('11000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Kitchen demolition — cabinets, counters, flooring removal', 1, 2200.00, 2200.00, 'e0000000-0000-0000-0000-000000000001'),
  ('11000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Debris hauling & dumpster rental', 1, 650.00, 650.00, 'e0000000-0000-0000-0000-000000000001');

-- Invoice 2: Plumbing rough-in
INSERT INTO invoices (id, org_id, project_id, vendor_name, invoice_number, invoice_date, total_amount, tax_amount, status, parse_method) VALUES
  ('10000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'Ace Plumbing Co', 'APC-1147', '2025-11-18', 4750.00, 250.00, 'approved', 'manual');

INSERT INTO line_items (id, org_id, invoice_id, description, quantity, unit_price, amount, category_id) VALUES
  ('11000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Rough-in plumbing — sink, dishwasher, ice maker lines', 1, 3200.00, 3200.00, 'e0000000-0000-0000-0000-000000000002'),
  ('11000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'PEX piping and fittings', 1, 850.00, 850.00, 'e0000000-0000-0000-0000-000000000002'),
  ('11000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Gas line extension for range', 1, 450.00, 450.00, 'e0000000-0000-0000-0000-000000000002'),
  ('11000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Sales tax', 1, 250.00, 250.00, NULL);

-- Invoice 3: Electrical
INSERT INTO invoices (id, org_id, project_id, vendor_name, invoice_number, invoice_date, total_amount, tax_amount, status, parse_method) VALUES
  ('10000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'BrightSpark Electric', 'BSE-3392', '2025-11-22', 5820.00, 320.00, 'approved', 'manual');

INSERT INTO line_items (id, org_id, invoice_id, description, quantity, unit_price, amount, category_id) VALUES
  ('11000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Panel upgrade to 200A', 1, 1800.00, 1800.00, 'e0000000-0000-0000-0000-000000000003'),
  ('11000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Kitchen circuit wiring — 6 new circuits (GFCI)', 1, 2400.00, 2400.00, 'e0000000-0000-0000-0000-000000000003'),
  ('11000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Under-cabinet LED lighting install', 1, 980.00, 980.00, 'e0000000-0000-0000-0000-000000000003'),
  ('11000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Recessed can lights (8x)', 8, 40.00, 320.00, 'e0000000-0000-0000-0000-000000000003');

-- Invoice 4: Cabinets
INSERT INTO invoices (id, org_id, project_id, vendor_name, invoice_number, invoice_date, total_amount, tax_amount, status, parse_method) VALUES
  ('10000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'Hill Country Cabinets', 'HCC-0891', '2025-12-10', 13200.00, 700.00, 'paid', 'manual');

INSERT INTO line_items (id, org_id, invoice_id, description, quantity, unit_price, amount, category_id) VALUES
  ('11000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Custom shaker cabinets — 14 units (maple)', 14, 650.00, 9100.00, 'e0000000-0000-0000-0000-000000000004'),
  ('11000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Quartz countertop — 42 sq ft installed', 42, 75.00, 3150.00, 'e0000000-0000-0000-0000-000000000004'),
  ('11000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Undermount sink cutout', 1, 250.00, 250.00, 'e0000000-0000-0000-0000-000000000004');

-- Invoice 5: Flooring
INSERT INTO invoices (id, org_id, project_id, vendor_name, invoice_number, invoice_date, total_amount, tax_amount, status, parse_method) VALUES
  ('10000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'Lone Star Flooring', 'LSF-2210', '2026-01-08', 4950.00, 275.00, 'reviewed', 'manual');

INSERT INTO line_items (id, org_id, invoice_id, description, quantity, unit_price, amount, category_id) VALUES
  ('11000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'Luxury vinyl plank — 180 sq ft', 180, 8.50, 1530.00, 'e0000000-0000-0000-0000-000000000005'),
  ('11000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'Subfloor prep and leveling', 1, 1200.00, 1200.00, 'e0000000-0000-0000-0000-000000000005'),
  ('11000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'Installation labor', 1, 1945.00, 1945.00, 'e0000000-0000-0000-0000-000000000005');

-- Invoice 6: Appliances
INSERT INTO invoices (id, org_id, project_id, vendor_name, invoice_number, invoice_date, total_amount, tax_amount, status, parse_method) VALUES
  ('10000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'Austin Appliance Outlet', 'AAO-7745', '2026-01-15', 7450.00, 614.00, 'approved', 'manual');

INSERT INTO line_items (id, org_id, invoice_id, description, quantity, unit_price, amount, category_id) VALUES
  ('11000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'Samsung 36" gas range', 1, 2899.00, 2899.00, 'e0000000-0000-0000-0000-000000000006'),
  ('11000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'Bosch dishwasher 500 series', 1, 1149.00, 1149.00, 'e0000000-0000-0000-0000-000000000006'),
  ('11000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'French door refrigerator 28 cu ft', 1, 2199.00, 2199.00, 'e0000000-0000-0000-0000-000000000006'),
  ('11000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'Microwave hood combo', 1, 589.00, 589.00, 'e0000000-0000-0000-0000-000000000006');

-- Invoice 7: Paint
INSERT INTO invoices (id, org_id, project_id, vendor_name, invoice_number, invoice_date, total_amount, tax_amount, status, parse_method) VALUES
  ('10000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'Martinez Painting', 'MP-0055', '2026-01-28', 2100.00, 0, 'pending', 'manual');

INSERT INTO line_items (id, org_id, invoice_id, description, quantity, unit_price, amount, category_id) VALUES
  ('11000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000007', 'Kitchen walls & ceiling paint (2 coats, Sherwin-Williams)', 1, 1400.00, 1400.00, 'e0000000-0000-0000-0000-000000000007'),
  ('11000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000007', 'Trim & baseboard painting', 1, 700.00, 700.00, 'e0000000-0000-0000-0000-000000000007');

-- Invoice 8: Home Depot supplies
INSERT INTO invoices (id, org_id, project_id, vendor_name, invoice_number, invoice_date, total_amount, tax_amount, status, parse_method) VALUES
  ('10000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'Home Depot', 'HD-9928371', '2025-12-02', 1385.00, 114.26, 'paid', 'manual');

INSERT INTO line_items (id, org_id, invoice_id, description, quantity, unit_price, amount, category_id) VALUES
  ('11000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000008', 'Tile backsplash — subway white 3x6 (12 boxes)', 12, 32.00, 384.00, 'e0000000-0000-0000-0000-000000000007'),
  ('11000000-0000-0000-0000-000000000024', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000008', 'Thinset mortar & grout', 1, 89.00, 89.00, 'e0000000-0000-0000-0000-000000000007'),
  ('11000000-0000-0000-0000-000000000025', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000008', 'Cabinet hardware — brushed brass pulls (28x)', 28, 12.50, 350.00, 'e0000000-0000-0000-0000-000000000004'),
  ('11000000-0000-0000-0000-000000000026', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000008', 'Kitchen faucet — Moen Align', 1, 289.00, 289.00, 'e0000000-0000-0000-0000-000000000002'),
  ('11000000-0000-0000-0000-000000000027', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000008', 'Garbage disposal 3/4 HP', 1, 159.00, 159.00, 'e0000000-0000-0000-0000-000000000002');

-- ============================================
-- PROJECT 2: Office Buildout
-- ============================================

INSERT INTO projects (id, org_id, name, client_name, description, status) VALUES
  ('d0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000001',
   'Westlake Office Buildout',
   'Meridian Tech Group',
   '2,400 sq ft office suite — permits, HVAC, data cabling, flooring, fixtures, furniture.',
   'active');

-- Budget categories for office
INSERT INTO budget_categories (id, org_id, project_id, name, budgeted_amount, sort_order) VALUES
  ('e0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Permits & Plans',     4000.00, 0),
  ('e0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'HVAC',               12000.00, 1),
  ('e0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Electrical & Data',   9500.00, 2),
  ('e0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Walls & Framing',     8000.00, 3),
  ('e0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Flooring',            7500.00, 4),
  ('e0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Fixtures & Lighting', 6000.00, 5),
  ('e0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Furniture',          15000.00, 6),
  ('e0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Paint & Finishes',    3500.00, 7);

-- Additional vendors for office project
INSERT INTO vendors (id, org_id, name, normalized_name, default_category_id, email, phone) VALUES
  ('f0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'CoolAir HVAC Systems',    'coolair hvac systems',    'e0000000-0000-0000-0000-000000000012', 'service@coolairhvac.com', '(512) 555-0909'),
  ('f0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 'DataWire Solutions',       'datawire solutions',      'e0000000-0000-0000-0000-000000000013', 'info@datawire.com', '(512) 555-1010'),
  ('f0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'Summit Drywall & Framing', 'summit drywall & framing', 'e0000000-0000-0000-0000-000000000014', NULL, '(512) 555-1111'),
  ('f0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', 'Modern Office Furniture',  'modern office furniture',  'e0000000-0000-0000-0000-000000000017', 'orders@modernoffice.com', '(512) 555-1212'),
  ('f0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', 'City of Austin Permits',   'city of austin permits',  'e0000000-0000-0000-0000-000000000011', NULL, NULL);

-- ---- Office Invoices ----

-- Invoice 9: Permits
INSERT INTO invoices (id, org_id, project_id, vendor_name, invoice_number, invoice_date, total_amount, tax_amount, status, parse_method) VALUES
  ('10000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
   'City of Austin Permits', 'COA-BP-24-9912', '2025-10-15', 3200.00, 0, 'paid', 'manual');

INSERT INTO line_items (id, org_id, invoice_id, description, quantity, unit_price, amount, category_id) VALUES
  ('11000000-0000-0000-0000-000000000028', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000009', 'Commercial build-out permit', 1, 2400.00, 2400.00, 'e0000000-0000-0000-0000-000000000011'),
  ('11000000-0000-0000-0000-000000000029', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000009', 'Plan review fee', 1, 800.00, 800.00, 'e0000000-0000-0000-0000-000000000011');

-- Invoice 10: HVAC
INSERT INTO invoices (id, org_id, project_id, vendor_name, invoice_number, invoice_date, total_amount, tax_amount, status, parse_method) VALUES
  ('10000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
   'CoolAir HVAC Systems', 'CA-2025-0334', '2025-11-20', 10800.00, 550.00, 'approved', 'manual');

INSERT INTO line_items (id, org_id, invoice_id, description, quantity, unit_price, amount, category_id) VALUES
  ('11000000-0000-0000-0000-000000000030', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000010', '3-ton commercial HVAC unit', 1, 5800.00, 5800.00, 'e0000000-0000-0000-0000-000000000012'),
  ('11000000-0000-0000-0000-000000000031', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000010', 'Ductwork — supply & return (2,400 sq ft)', 1, 3200.00, 3200.00, 'e0000000-0000-0000-0000-000000000012'),
  ('11000000-0000-0000-0000-000000000032', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000010', 'Thermostat (Honeywell programmable)', 2, 175.00, 350.00, 'e0000000-0000-0000-0000-000000000012'),
  ('11000000-0000-0000-0000-000000000033', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000010', 'Installation labor', 1, 1450.00, 1450.00, 'e0000000-0000-0000-0000-000000000012');

-- Invoice 11: Electrical & Data
INSERT INTO invoices (id, org_id, project_id, vendor_name, invoice_number, invoice_date, total_amount, tax_amount, status, parse_method) VALUES
  ('10000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
   'DataWire Solutions', 'DW-5501', '2025-12-05', 8750.00, 425.00, 'approved', 'manual');

INSERT INTO line_items (id, org_id, invoice_id, description, quantity, unit_price, amount, category_id) VALUES
  ('11000000-0000-0000-0000-000000000034', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', 'Cat6 data cabling — 48 drops', 48, 85.00, 4080.00, 'e0000000-0000-0000-0000-000000000013'),
  ('11000000-0000-0000-0000-000000000035', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', 'Network patch panel & rack setup', 1, 1200.00, 1200.00, 'e0000000-0000-0000-0000-000000000013'),
  ('11000000-0000-0000-0000-000000000036', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', 'Electrical outlets (40 duplex + 8 dedicated circuits)', 1, 3045.00, 3045.00, 'e0000000-0000-0000-0000-000000000013');

-- Invoice 12: Drywall & Framing
INSERT INTO invoices (id, org_id, project_id, vendor_name, invoice_number, invoice_date, total_amount, tax_amount, status, parse_method) VALUES
  ('10000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
   'Summit Drywall & Framing', 'SDF-0220', '2025-12-18', 7200.00, 0, 'reviewed', 'manual');

INSERT INTO line_items (id, org_id, invoice_id, description, quantity, unit_price, amount, category_id) VALUES
  ('11000000-0000-0000-0000-000000000037', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000012', 'Metal stud framing — 4 offices + conference room', 1, 3800.00, 3800.00, 'e0000000-0000-0000-0000-000000000014'),
  ('11000000-0000-0000-0000-000000000038', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000012', 'Drywall hang, tape, texture (Level 4 finish)', 1, 2800.00, 2800.00, 'e0000000-0000-0000-0000-000000000014'),
  ('11000000-0000-0000-0000-000000000039', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000012', 'Glass partition — conference room front', 1, 600.00, 600.00, 'e0000000-0000-0000-0000-000000000014');

-- Invoice 13: Office flooring
INSERT INTO invoices (id, org_id, project_id, vendor_name, invoice_number, invoice_date, total_amount, tax_amount, status, parse_method) VALUES
  ('10000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
   'Lone Star Flooring', 'LSF-2285', '2026-01-10', 6800.00, 380.00, 'pending', 'manual');

INSERT INTO line_items (id, org_id, invoice_id, description, quantity, unit_price, amount, category_id) VALUES
  ('11000000-0000-0000-0000-000000000040', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000013', 'Commercial carpet tile — 2,000 sq ft (Shaw Contract)', 2000, 2.85, 5700.00, 'e0000000-0000-0000-0000-000000000015'),
  ('11000000-0000-0000-0000-000000000041', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000013', 'LVP for kitchenette & restroom — 400 sq ft', 400, 2.75, 1100.00, 'e0000000-0000-0000-0000-000000000015');

-- Invoice 14: Furniture (big one!)
INSERT INTO invoices (id, org_id, project_id, vendor_name, invoice_number, invoice_date, total_amount, tax_amount, status, parse_method, notes) VALUES
  ('10000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
   'Modern Office Furniture', 'MOF-11420', '2026-02-01', 13950.00, 1151.00, 'pending', 'manual', 'Delivery scheduled Feb 15');

INSERT INTO line_items (id, org_id, invoice_id, description, quantity, unit_price, amount, category_id) VALUES
  ('11000000-0000-0000-0000-000000000042', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000014', 'Sit-stand desks (Uplift V2) — 12 workstations', 12, 649.00, 7788.00, 'e0000000-0000-0000-0000-000000000017'),
  ('11000000-0000-0000-0000-000000000043', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000014', 'Ergonomic task chairs (Steelcase Leap)', 12, 399.00, 4788.00, 'e0000000-0000-0000-0000-000000000017'),
  ('11000000-0000-0000-0000-000000000044', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000014', 'Conference table — 10-person (walnut)', 1, 1374.00, 1374.00, 'e0000000-0000-0000-0000-000000000017');

-- Invoice 15: Painting
INSERT INTO invoices (id, org_id, project_id, vendor_name, invoice_number, invoice_date, total_amount, tax_amount, status, parse_method) VALUES
  ('10000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
   'Martinez Painting', 'MP-0062', '2026-02-05', 3100.00, 0, 'pending', 'manual');

INSERT INTO line_items (id, org_id, invoice_id, description, quantity, unit_price, amount, category_id) VALUES
  ('11000000-0000-0000-0000-000000000045', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000015', 'Interior paint — offices & common areas (Benjamin Moore)', 1, 2200.00, 2200.00, 'e0000000-0000-0000-0000-000000000018'),
  ('11000000-0000-0000-0000-000000000046', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000015', 'Accent wall — conference room (dark navy)', 1, 400.00, 400.00, 'e0000000-0000-0000-0000-000000000018'),
  ('11000000-0000-0000-0000-000000000047', 'b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000015', 'Door frames & trim', 1, 500.00, 500.00, 'e0000000-0000-0000-0000-000000000018');

-- Done!
-- Login: demo@example.com / demo123
