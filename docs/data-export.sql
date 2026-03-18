-- ============================================
-- EXPORTAÇÃO COMPLETA DE DADOS
-- User ID substituído:
--   454e914e-1806-4c4a-bcc5-adefb7d5d60b → 3fc25e9e-6648-44b8-8faf-e4cddf12e2b3
-- ============================================

-- 1. SUBSCRIPTION PLANS
INSERT INTO subscription_plans (id, name, slug, description, price_monthly, max_trucks, max_users, features, is_active, created_at, updated_at) VALUES
('0217e622-7f0a-412d-9695-3f5fbe9c1d0f', 'Básico', 'basic', 'Ideal para pequenas frotas', 89.90, 5, 3, '["Dashboard básico","Controle de abastecimento","Relatórios simples"]'::jsonb, true, '2026-01-14 04:24:52.761021+00', '2026-02-01 17:56:34.539425+00'),
('3fff7f8d-ae89-4aaf-8433-e73d4659784b', 'Profissional', 'pro', 'Para frotas em crescimento', 99.90, 20, 10, '["Básico","Relatórios avançados","Anexos ilimitados"]'::jsonb, true, '2026-01-14 04:24:52.761021+00', '2026-02-01 17:56:19.060765+00'),
('34693bb1-27b0-409b-84b7-3cd0d0b6fa86', 'Enterprise', 'enterprise', 'Para grandes operações', 109.90, 0, 0, '["Pro","Veículos ilimitados","Usuários ilimitados","API access","Suporte prioritário"]'::jsonb, true, '2026-01-14 04:24:52.761021+00', '2026-02-01 17:56:00.010364+00')
ON CONFLICT (id) DO NOTHING;

-- 2. ORGANIZATIONS
INSERT INTO organizations (id, name, slug, cnpj, plan_id, subscription_status, trial_ends_at, subscription_ends_at, is_active, currency, timezone, fiscal_period_start, duration_months, logo_url, created_at, updated_at) VALUES
('2a92e941-bbce-4b31-a955-c5ac6d5616be', 'system', 'system-20260120031911', NULL, NULL, 'active', NULL, NULL, true, 'BRL', 'America/Sao_Paulo', 1, 12, NULL, '2026-01-20 03:19:11.401644+00', '2026-02-18 06:49:03.865942+00'),
('8f364d2f-e542-437c-8f06-1957cb5859ca', 'JOSE TRANSPORTES', 'jose-transportes-20260304031907', '50512910000121', NULL, 'trialing', '2026-03-18 03:19:07.974435+00', NULL, true, 'BRL', 'America/Sao_Paulo', 1, 12, NULL, '2026-03-04 03:19:07.974435+00', '2026-03-04 03:19:07.974435+00'),
('3cfab2d8-2d89-455c-a9e1-58a0025df1c0', 'Osmar NF-e ', 'osmar-nf-e-20260304101915', '00094188000184', NULL, 'trialing', '2026-03-18 10:19:15.6539+00', NULL, true, 'BRL', 'America/Sao_Paulo', 1, 12, NULL, '2026-03-04 10:19:15.6539+00', '2026-03-04 10:19:15.6539+00'),
('3f480be6-d3d0-42de-bd77-c7cb02701621', 'Envia RÁPIDO', 'envia-r-pido-20260304200221', '23903417000160', NULL, 'trialing', '2026-03-18 20:02:21.603245+00', NULL, true, 'BRL', 'America/Sao_Paulo', 1, 12, NULL, '2026-03-04 20:02:21.603245+00', '2026-03-04 20:02:21.603245+00'),
('f29367d6-95e9-4271-a9a4-d98951217890', 'Gerenciarfrotas ', 'gerenciarfrotas-20260305013620', '11866466000190', NULL, 'trialing', '2026-03-19 01:36:20.941998+00', NULL, true, 'BRL', 'America/Sao_Paulo', 1, 12, NULL, '2026-03-05 01:36:20.941998+00', '2026-03-05 01:36:20.941998+00'),
('a14831d0-336d-4e7a-85ec-ef969f640a40', 'Giga byte ', 'giga-byte-20260310211233', '40318065000102', NULL, 'trialing', '2026-03-24 21:12:33.317716+00', NULL, true, 'BRL', 'America/Sao_Paulo', 1, 12, NULL, '2026-03-10 21:12:33.317716+00', '2026-03-10 21:12:33.317716+00'),
('a4630d70-15c9-4144-87ab-78af6ee43d58', 'Osmar ', 'osmar-20260311211439', '22960432000187', NULL, 'trialing', '2026-03-25 21:14:39.334325+00', NULL, true, 'BRL', 'America/Sao_Paulo', 1, 12, NULL, '2026-03-11 21:14:39.334325+00', '2026-03-11 21:14:39.334325+00'),
('5bb22080-ff1e-45f8-b319-752f60ab2596', 'Nesso Tech', 'nesso-tech-20260311212533', '32679716000153', NULL, 'trialing', '2026-03-25 21:25:33.954379+00', NULL, true, 'BRL', 'America/Sao_Paulo', 1, 12, NULL, '2026-03-11 21:25:33.954379+00', '2026-03-11 21:25:33.954379+00')
ON CONFLICT (id) DO NOTHING;

-- 3. PROFILES (user_id 454e914e... → 3fc25e9e...)
INSERT INTO profiles (id, full_name, phone, avatar_url, is_owner, is_email_verified, organization_id, created_at, updated_at) VALUES
('3fc25e9e-6648-44b8-8faf-e4cddf12e2b3', 'Osmar Trojilio', NULL, NULL, true, true, '2a92e941-bbce-4b31-a955-c5ac6d5616be', '2026-01-20 03:19:11.401644+00', '2026-03-04 03:18:15.715407+00'),
('6a37bf92-e691-4301-a4db-56b0c47b6a5f', 'trojilio Bol', '44998516668', NULL, true, false, '8f364d2f-e542-437c-8f06-1957cb5859ca', '2026-03-04 03:19:07.974435+00', '2026-03-04 03:19:07.974435+00'),
('769fb68e-14e0-4e05-a3b0-d8713c4f12f2', 'Osmar Trojilio', '44998516668', NULL, true, true, '3cfab2d8-2d89-455c-a9e1-58a0025df1c0', '2026-03-04 10:19:15.6539+00', '2026-03-04 10:22:15.430046+00'),
('4ecc9b93-b8ee-4c61-8035-ae6eae7c3a49', 'Osmar Trojilio Junior', '44997475827', NULL, true, true, '3f480be6-d3d0-42de-bd77-c7cb02701621', '2026-03-04 20:02:21.603245+00', '2026-03-04 20:02:38.848888+00'),
('17e42748-273e-440c-a5f9-87ffdd4a1c45', 'gerenciarfrotas', '44998516668', NULL, true, true, 'f29367d6-95e9-4271-a9a4-d98951217890', '2026-03-05 01:36:20.941998+00', '2026-03-05 01:37:30.225339+00'),
('672185ec-3213-4fec-9516-55b329d5b882', 'Giga byte informática ', '44998690047', NULL, true, true, 'a14831d0-336d-4e7a-85ec-ef969f640a40', '2026-03-10 21:12:33.317716+00', '2026-03-10 21:15:07.540943+00'),
('fbd0e3d4-b6a0-4c1c-ad44-35599b9f27e3', 'Osmar teste erro ', '43998074038', NULL, true, true, 'a4630d70-15c9-4144-87ab-78af6ee43d58', '2026-03-11 21:14:39.334325+00', '2026-03-11 21:15:43.908284+00'),
('6c92065a-3556-462f-9dab-57dd7916c8e6', 'André Luis Nesso', '44991841139', NULL, true, true, '5bb22080-ff1e-45f8-b319-752f60ab2596', '2026-03-11 21:25:33.954379+00', '2026-03-11 21:25:49.408533+00')
ON CONFLICT (id) DO NOTHING;

-- 4. USER ROLES (user_id 454e914e... → 3fc25e9e...)
INSERT INTO user_roles (id, user_id, organization_id, role, created_at) VALUES
('397d8318-14f1-44a6-aae4-c83a59ead438', '3fc25e9e-6648-44b8-8faf-e4cddf12e2b3', '2a92e941-bbce-4b31-a955-c5ac6d5616be', 'admin', '2026-01-20 03:19:11.401644+00'),
('64e0a9aa-ecd4-44ae-8389-25f69384c7f5', '6a37bf92-e691-4301-a4db-56b0c47b6a5f', '8f364d2f-e542-437c-8f06-1957cb5859ca', 'admin', '2026-03-04 03:19:07.974435+00'),
('616ad12e-0029-4399-9c76-21c772981bcd', '769fb68e-14e0-4e05-a3b0-d8713c4f12f2', '3cfab2d8-2d89-455c-a9e1-58a0025df1c0', 'admin', '2026-03-04 10:19:15.6539+00'),
('2a01601d-ceb9-4db1-938b-5c3cf792915d', '4ecc9b93-b8ee-4c61-8035-ae6eae7c3a49', '3f480be6-d3d0-42de-bd77-c7cb02701621', 'admin', '2026-03-04 20:02:21.603245+00'),
('4981eee0-660e-4651-9a19-3996fb9e35fd', '17e42748-273e-440c-a5f9-87ffdd4a1c45', 'f29367d6-95e9-4271-a9a4-d98951217890', 'admin', '2026-03-05 01:36:20.941998+00'),
('bc2584a5-6ca3-4ba7-b70a-6729871a5c8e', '672185ec-3213-4fec-9516-55b329d5b882', 'a14831d0-336d-4e7a-85ec-ef969f640a40', 'admin', '2026-03-10 21:12:33.317716+00'),
('fd579f15-4e5f-4e27-ab39-5aadc3591c11', 'fbd0e3d4-b6a0-4c1c-ad44-35599b9f27e3', 'a4630d70-15c9-4144-87ab-78af6ee43d58', 'admin', '2026-03-11 21:14:39.334325+00'),
('a9e00ae6-16a1-4e8a-a035-820a1b83102d', '6c92065a-3556-462f-9dab-57dd7916c8e6', '5bb22080-ff1e-45f8-b319-752f60ab2596', 'admin', '2026-03-11 21:25:33.954379+00')
ON CONFLICT (id) DO NOTHING;

-- 5. PLATFORM ADMINS (user_id 454e914e... → 3fc25e9e...)
INSERT INTO platform_admins (id, user_id, created_by, notes, created_at) VALUES
('4231512c-da78-426c-a3ec-1d6b1476cc6c', '3fc25e9e-6648-44b8-8faf-e4cddf12e2b3', NULL, 'Platform owner - full access', '2026-01-20 22:11:21.137335+00')
ON CONFLICT (id) DO NOTHING;

-- 6. VEHICLES
INSERT INTO vehicles (id, organization_id, prefix, plate, model, brand, color, chassis, renavam, year, fuel_type, tank_capacity, current_km, current_hours, driver_id, acquisition_date, acquisition_value, status, notes, created_at, updated_at) VALUES
('c1028ff9-5d45-4078-8fbb-524e86e22673', '5bb22080-ff1e-45f8-b319-752f60ab2596', 'CR-V', 'EPH-0571', 'Honda CR-V', NULL, NULL, NULL, NULL, 2010, 'diesel', NULL, 200000, 0, NULL, NULL, NULL, 'in_use', NULL, '2026-03-11 21:27:18.465246+00', '2026-03-11 21:27:18.465246+00'),
('b25312f4-17ec-4106-9535-9e7887fe955a', '5bb22080-ff1e-45f8-b319-752f60ab2596', 'Celta', 'ENC-4400', 'GM Celta Spirit 4P', NULL, NULL, NULL, NULL, 2010, 'diesel', NULL, 250000, 0, NULL, NULL, NULL, 'in_use', NULL, '2026-03-11 21:28:00.289045+00', '2026-03-11 21:28:00.289045+00')
ON CONFLICT (id) DO NOTHING;

-- 7. TRIPS
INSERT INTO trips (id, organization_id, vehicle_id, driver_id, origin, destination, start_date, end_date, start_km, end_km, cargo_type, client_name, tonnage, freight_value, invoice_number, status, notes, created_by, created_at, updated_at) VALUES
('ec992aa2-f43a-4158-b53f-4f6946b0c769', '5bb22080-ff1e-45f8-b319-752f60ab2596', 'b25312f4-17ec-4106-9535-9e7887fe955a', NULL, 'Maringá', 'Umuarama', '2026-03-11 03:00:00+00', NULL, 200000, NULL, NULL, 'Teste', 5, 1500, NULL, 'scheduled', NULL, '6c92065a-3556-462f-9dab-57dd7916c8e6', '2026-03-11 21:46:15.063678+00', '2026-03-11 21:46:15.063678+00')
ON CONFLICT (id) DO NOTHING;

-- 8. PAYMENT EVENTS
INSERT INTO payment_events (id, organization_id, plan_id, payment_id, amount, status, processed_at, created_at) VALUES
('ac82c7a0-9874-421c-94d4-b089bee50ff8', '2a92e941-bbce-4b31-a955-c5ac6d5616be', '0217e622-7f0a-412d-9695-3f5fbe9c1d0f', '147314757273', 1078.80, 'cancelled', '2026-02-27 02:55:56.182375+00', '2026-02-27 02:55:56.182375+00'),
('f6a81424-5c28-4fd0-8c86-73b24ceba595', '2a92e941-bbce-4b31-a955-c5ac6d5616be', '0217e622-7f0a-412d-9695-3f5fbe9c1d0f', '147426603041', 1078.80, 'rejected', '2026-02-27 21:13:16.082352+00', '2026-02-27 21:13:16.082352+00'),
('fd4bd53c-4bd2-4a24-bfca-59e2ef7c2058', '2a92e941-bbce-4b31-a955-c5ac6d5616be', '34693bb1-27b0-409b-84b7-3cd0d0b6fa86', '147428152497', 1318.80, 'rejected', '2026-02-27 21:17:30.552488+00', '2026-02-27 21:17:30.552488+00'),
('e09a22fa-f829-4e19-ba2f-29efce662c02', '2a92e941-bbce-4b31-a955-c5ac6d5616be', '0217e622-7f0a-412d-9695-3f5fbe9c1d0f', '148031580402', 917.04, 'cancelled', '2026-02-27 04:48:05.782668+00', '2026-02-27 04:48:05.782668+00'),
('8d258300-479a-4ee4-987a-a884b8f6f68e', '2a92e941-bbce-4b31-a955-c5ac6d5616be', '3fff7f8d-ae89-4aaf-8433-e73d4659784b', '148031580458', 1019.04, 'cancelled', '2026-02-27 04:50:21.920215+00', '2026-02-27 04:50:21.920215+00'),
('d13d72d8-db0c-43f2-b642-22b00a953c3a', '2a92e941-bbce-4b31-a955-c5ac6d5616be', '34693bb1-27b0-409b-84b7-3cd0d0b6fa86', '147671026015', 1121.04, 'cancelled', '2026-03-01 17:43:56.004124+00', '2026-03-01 17:43:56.004124+00'),
('4f28afb2-c727-47de-8c35-7b4842e26add', '2a92e941-bbce-4b31-a955-c5ac6d5616be', '0217e622-7f0a-412d-9695-3f5fbe9c1d0f', '147733308439', 917.04, 'cancelled', '2026-03-02 04:17:39.0132+00', '2026-03-02 04:17:39.0132+00'),
('5888c7d7-5b92-4a2a-b49c-1fcbf6f95806', '2a92e941-bbce-4b31-a955-c5ac6d5616be', '0217e622-7f0a-412d-9695-3f5fbe9c1d0f', '147879639433', 917.04, 'cancelled', '2026-03-03 02:19:16.359398+00', '2026-03-03 02:19:16.359398+00')
ON CONFLICT (id) DO NOTHING;

-- 9. EMAIL VERIFICATION CODES (user_id 454e914e... → 3fc25e9e...)
INSERT INTO email_verification_codes (id, user_id, email, code, expires_at, verified_at, created_at) VALUES
('d03fbe9a-83c8-47ab-9637-7501f552449a', '3fc25e9e-6648-44b8-8faf-e4cddf12e2b3', 'trojilio.mga@gmail.com', '812532', '2026-03-04 03:27:23.772+00', '2026-03-04 03:18:15.354+00', '2026-03-04 03:17:24.189523+00'),
('d7af9c14-02fd-487e-9ca9-0c732154f25c', '769fb68e-14e0-4e05-a3b0-d8713c4f12f2', 'systemvirtualnfe@gmail.com', '639291', '2026-03-04 10:29:22.059+00', '2026-03-04 10:22:15.126+00', '2026-03-04 10:19:22.369341+00'),
('683e57f4-8419-4269-aed6-fcd05648150a', '4ecc9b93-b8ee-4c61-8035-ae6eae7c3a49', 'j.trojilio@treeunfe.com.br', '281223', '2026-03-04 20:12:24.858+00', '2026-03-04 20:02:38.55+00', '2026-03-04 20:02:25.16336+00'),
('de04c0db-150f-4eb4-bea6-952015522c5f', '17e42748-273e-440c-a5f9-87ffdd4a1c45', 'gerenciarfrotas@gmail.com', '380509', '2026-03-05 01:46:27.271+00', '2026-03-05 01:37:29.926+00', '2026-03-05 01:36:27.568263+00'),
('8d5689f6-ade1-4d4b-9115-94805934273b', '672185ec-3213-4fec-9516-55b329d5b882', 'systemvirtual@proton.me', '373982', '2026-03-10 21:24:21.023+00', '2026-03-10 21:15:07.198+00', '2026-03-10 21:14:21.360615+00'),
('867c70d4-ff1a-4932-98d2-f12d4a5bc816', '6a37bf92-e691-4301-a4db-56b0c47b6a5f', 'trojilio@bol.com.br', '822204', '2026-03-11 02:36:21.978+00', NULL, '2026-03-11 02:26:22.46007+00'),
('2fdcb21e-e743-426d-b139-7c81c5380207', 'fbd0e3d4-b6a0-4c1c-ad44-35599b9f27e3', 'trojilio@proton.me', '217978', '2026-03-11 21:24:43.49+00', '2026-03-11 21:15:43.613+00', '2026-03-11 21:14:43.842957+00'),
('2cb17886-734b-4933-9e72-f6497a648c81', '6c92065a-3556-462f-9dab-57dd7916c8e6', 'andre@nessotech.com.br', '657540', '2026-03-11 21:35:35.858+00', '2026-03-11 21:25:49.081+00', '2026-03-11 21:25:36.150165+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TABELAS VAZIAS (sem dados para importar):
-- - drivers
-- - driver_salaries
-- - clients
-- - expenses
-- - fuel_records
-- - maintenance_records
-- - invitations
-- - notifications
-- - organization_fiscal_data
-- - organization_settings
-- - attachments
-- - api_keys
-- - webhook_configs
-- - webhook_logs
-- - accounting_integrations
-- - erp_integrations
-- - discount_coupons
-- - coupon_usage
-- ============================================
