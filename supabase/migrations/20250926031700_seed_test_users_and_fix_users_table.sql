-- Remove password_hash from public.users table for security
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;

-- Add foreign key constraint from public.users to auth.users if it doesn't exist
-- This enforces that a user profile must correspond to an authenticated user.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_id_fkey' AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
        ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END$$;

-- Seed test user profiles.
-- This assumes that users with these emails have already been created in Supabase Auth.
-- The passwords for all test users are '123456'.
-- ON CONFLICT is used to prevent errors if the profiles already exist.
INSERT INTO public.users (id, first_name, last_name, email, role, is_active)
VALUES
    ((SELECT id FROM auth.users WHERE email = 'aluno@teste.com'), 'Aluno', 'Teste', 'aluno@teste.com', 'student', true),
    ((SELECT id FROM auth.users WHERE email = 'professor@teste.com'), 'Professor', 'Teste', 'professor@teste.com', 'teacher', true),
    ((SELECT id FROM auth.users WHERE email = 'admin@teste.com'), 'Admin', 'Teste', 'admin@teste.com', 'administrator', true)
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;
