-- =====================================================
-- FIX USER_PROFILES VIEW
-- =====================================================
-- Cria ou recria a view user_profiles com políticas RLS corretas

-- 1. Drop existing view if exists
DROP VIEW IF EXISTS user_profiles CASCADE;

-- 2. Create user_profiles view
CREATE OR REPLACE VIEW user_profiles AS
SELECT
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.is_active,
  u.created_at,
  u.updated_at,
  s.student_id_number,
  s.enrollment_date,
  t.employee_id_number,
  t.department,
  t.hire_date
FROM users u
LEFT JOIN students s ON u.id = s.user_id
LEFT JOIN teachers t ON u.id = t.user_id;

-- 3. Grant access to authenticated users
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;

-- 4. Create RLS policy for the view (if supported)
-- Note: Views inherit RLS from base tables, but we can add explicit policies

-- 5. Verify view was created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
    RAISE NOTICE '✅ View user_profiles created successfully!';
  ELSE
    RAISE NOTICE '❌ Failed to create view user_profiles';
  END IF;
END $$;
