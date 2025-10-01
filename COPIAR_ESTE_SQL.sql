ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_admin_all" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_select_authenticated" ON users;

CREATE POLICY "users_admin_all"
ON users
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "users_select_own"
ON users
FOR SELECT
TO authenticated
USING (id = auth.uid() OR is_admin());

CREATE POLICY "users_update_own"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid() OR is_admin())
WITH CHECK (id = auth.uid() OR is_admin());

CREATE POLICY "users_select_authenticated"
ON users
FOR SELECT
TO authenticated
USING (is_authenticated());
