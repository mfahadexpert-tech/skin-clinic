-- ==============================================================================
-- Migration 003: Seed Core Aesthetic Clinic Clinical Data
-- ==============================================================================
-- Seeds base departments, categories, services, package deals, and doctor profiles.
-- Uses ON CONFLICT DO NOTHING to preserve all existing live records.
-- ==============================================================================

-- 1. Seed Departments
INSERT INTO departments (id, name, description) VALUES
(1, 'Dermatology & Clinical Skin', 'Medical consultations, acne, eczema, and mole mapping'),
(2, 'Laser Therapy', 'Laser hair reduction, tattoo removal, Carbon peels, resurfacing'),
(3, 'Facials & Medical Peels', 'HydraFacial Deluxe, Chemical peels, Hollywood facials'),
(4, 'Injectables & Anti-Aging', 'Botox, Dermal Fillers, PRP, Profhilo'),
(5, 'Hair Restoration', 'PRP Hair, GFC Therapy, Mesotherapy'),
(6, 'Reception & Billing', 'Front desk check-in, token generation, cashier POS')
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Initial Doctors & Staff
INSERT INTO employees (id, name, department_id, designation, phone, email, commission_rate, shift_start, shift_end, is_active) VALUES
(1, 'Dr. Sarah Khan', 1, 'Consultant Dermatologist', '0300-1122334', 'dr.sarah@skinlab.com', 15.00, '10:00', '18:00', true),
(2, 'Dr. Ayesha Tariq', 4, 'Aesthetic Physician', '0301-2233445', 'dr.ayesha@skinlab.com', 12.50, '11:00', '19:00', true),
(3, 'Dr. Fahad', 1, 'Consultant Dermatologist', '0300-9988776', 'dr.fahad@skinlab.com', 12.00, '10:00', '18:00', true),
(4, 'Hina Malik', 6, 'Front Desk Executive', '0333-4455667', 'hina@skinlab.com', 0.00, '09:00', '18:00', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Categories
INSERT INTO categories (id, name, code, description) VALUES
(1, 'Laser Therapy', 'CAT-LASER', 'Diode 808nm, Alexandrite, Carbon Peels'),
(2, 'Facials & Peels', 'CAT-FACIAL', 'HydraFacial Deluxe, Salicylic Peels'),
(3, 'Injectables & Anti-Aging', 'CAT-INJECT', 'Botox, Dermal Fillers, PRP'),
(4, 'Hair Restoration', 'CAT-HAIR', 'PRP Hair, Mesotherapy'),
(5, 'Skincare Retail', 'CAT-RETAIL', 'Post-procedure sunblocks & barrier serums')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Treatments & Products
INSERT INTO products (id, name, sku, barcode, category_id, is_service, selling_price, cost_price, clinical_instructions) VALUES
(1, 'HydraFacial Deluxe (Deep Cleansing)', 'SRV-FACIAL-01', '890123450001', 2, true, 6000.00, 1200.00, 'Vortex Exfoliation -> GlySal Peel 7.5% -> Hyaluronic Infusion'),
(2, 'Full Body Laser Hair Reduction (Single Session)', 'SRV-LASER-01', '890123450002', 1, true, 7500.00, 800.00, 'Diode 808nm / Alexandrite. Fluence 12-16 J/cm2. Shave 24h prior.'),
(3, 'Carbon Laser Peel (Hollywood Peel)', 'SRV-LASER-02', '890123450003', 1, true, 5000.00, 900.00, 'Q-Switched Nd:YAG 1064nm. Apply liquid carbon layer, wait 10 min.'),
(4, 'PRP Vampire Facial with Microneedling', 'SRV-INJECT-01', '890123450004', 3, true, 12000.00, 2500.00, '10ml blood draw, centrifuge 3200 RPM for 10m. DermaPen depth 1.0-1.5mm.'),
(5, 'Botox Forehead & Crow''s Feet (20 Units)', 'SRV-INJECT-02', '890123450005', 3, true, 18000.00, 8500.00, 'Allergan Botox. Reconstituted with 2.5ml saline.'),
(6, 'Salicylic / Glycolic Chemical Peel', 'SRV-FACIAL-02', '890123450006', 2, true, 4500.00, 600.00, 'Neutralize within 3-5 minutes. Strictly mandate SPF 50 sunblock.'),
(7, 'Skin Whitening Glutathione Facial', 'SRV-FACIAL-03', '890123450007', 2, true, 12000.00, 300.00, 'Glutathione + Vitamin C brightening facial with LED therapy.'),
(8, 'DermaShield SPF 60 Sunblock (100ml)', 'RET-CREAM-01', '890123450008', 5, false, 2200.00, 1100.00, 'Post-procedure physical mineral sunscreen.')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Package Deals
INSERT INTO deals (id, name, sku, description, discounted_price, is_active) VALUES
(1, '6-Session Full Body Laser Package', 'DEAL-LASER-6S', 'Includes 6 sessions of full body laser hair reduction', 38000.00, true),
(2, 'Bridal Glow 4-Session Package', 'DEAL-GLOW-4S', 'Includes 2x HydraFacial Deluxe + 2x Carbon Laser Peels', 18000.00, true)
ON CONFLICT (id) DO NOTHING;
