-- =====================================================
-- FIX USERS TABLE ACCESS
-- =====================================================
-- Garante que a tabela users está acessível para todos usuários autenticados
-- (necessário para o auth-provider buscar perfis)

-- Habilita RLS na tabela users (se ainda não estiver)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Remove policies antigas se existirem
DROP POLICY IF EXISTS "users_admin_all" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_select_authenticated" ON users;

-- Policy 1: Administradores têm acesso total
CREATE POLICY "users_admin_all"
ON users
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Policy 2: Usuários podem ver seu próprio perfil E administradores veem todos
CREATE POLICY "users_select_own"
ON users
FOR SELECT
TO authenticated
USING (id = auth.uid() OR is_admin());

-- Policy 3: Usuários podem atualizar seu próprio perfil E administradores atualizam todos
CREATE POLICY "users_update_own"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid() OR is_admin())
WITH CHECK (id = auth.uid() OR is_admin());

-- Policy 4: Todos usuários autenticados podem ler users (necessário para joins)
CREATE POLICY "users_select_authenticated"
ON users
FOR SELECT
TO authenticated
USING (is_authenticated());

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Users table access configured successfully!';
  RAISE NOTICE '✅ All authenticated users can read users table';
  RAISE NOTICE '✅ Users can update their own profile';
  RAISE NOTICE '✅ Administrators have full access';
END $$;
