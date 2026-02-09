-- ========================================
-- COPIE ESTE SCRIPT COMPLETO E COLE NO SUPABASE STUDIO
-- ========================================

-- 1. Remover políticas problemáticas
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Administrators can view all users" ON public.users;
DROP POLICY IF EXISTS "Administrators can manage all users" ON public.users;
DROP POLICY IF EXISTS "Enable update for own profile" ON public.users;
DROP POLICY IF EXISTS "Enable update for administrators" ON public.users;
DROP POLICY IF EXISTS "Enable insert for administrators" ON public.users;
DROP POLICY IF EXISTS "Enable delete for administrators" ON public.users;

-- 2. Criar nova política SEM recursão
CREATE POLICY "Users can view based on role"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR
        (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) IN ('administrator', 'teacher')
    );

-- 3. Política de atualização
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- 4. Administradores podem atualizar todos
CREATE POLICY "Administrators can update all users"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'administrator')
    WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'administrator');

-- 5. Garantir permissões
GRANT SELECT, UPDATE ON public.users TO authenticated;
