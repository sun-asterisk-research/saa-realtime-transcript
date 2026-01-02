-- Development-only test data
-- Set SUPABASE_EXTRA_SEEDS=./seeds/dev/*.sql in .env to enable

-- Sample test session
INSERT INTO sessions (code, host_name, mode, target_language, status)
VALUES ('TEST01', 'Test Host', 'one_way', 'vi', 'active')
ON CONFLICT (code) DO NOTHING;

-- Sample two-way session
INSERT INTO sessions (code, host_name, mode, language_a, language_b, status)
VALUES ('TEST02', 'Test Host 2', 'two_way', 'ja', 'vi', 'active')
ON CONFLICT (code) DO NOTHING;
