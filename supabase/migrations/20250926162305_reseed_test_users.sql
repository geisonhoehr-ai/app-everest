-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- Step 0: Ensure unique constraints exist for ON CONFLICT clauses
DO $$
BEGIN
    -- Check and add constraint for students table
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_user_id_key') THEN
        -- Verify if the table exists first to avoid errors if run in empty db
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'students') THEN
             ALTER TABLE public.students ADD CONSTRAINT students_user_id_key UNIQUE (user_id);
        END IF;
    END IF;

    -- Check and add constraint for teachers table
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teachers_user_id_key') THEN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teachers') THEN
            ALTER TABLE public.teachers ADD CONSTRAINT teachers_user_id_key UNIQUE (user_id);
        END IF;
    END IF;
END $$;

-- Step 1: Delete existing test users from auth schema.
-- This will cascade and delete related entries in public.users, students, teachers, etc.,
-- ensuring a clean state before re-seeding.
DELETE FROM auth.users WHERE email IN ('aluno@teste.com', 'professor@teste.com', 'admin@teste.com');


-- Step 2: Re-create the test users in auth.users. Password for all is 'senha123'.
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
VALUES
    (
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4(),
        'authenticated',
        'authenticated',
        'aluno@teste.com',
        crypt('senha123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{}'
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4(),
        'authenticated',
        'authenticated',
        'professor@teste.com',
        crypt('senha123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{}'
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4(),
        'authenticated',
        'authenticated',
        'admin@teste.com',
        crypt('senha123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{}'
    )
ON CONFLICT (email) DO NOTHING;

-- Step 3: Re-seed the profiles in public.users.
-- This ensures the public profiles are linked to the new auth users.
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

-- Step 4: Re-seed the role-specific profiles.
INSERT INTO public.students (user_id, student_id_number, enrollment_date)
VALUES
    (
        (SELECT id FROM auth.users WHERE email = 'aluno@teste.com'),
        'ST2025001',
        CURRENT_TIMESTAMP
    )
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.teachers (user_id, employee_id_number, hire_date, department)
VALUES
    (
        (SELECT id FROM auth.users WHERE email = 'professor@teste.com'),
        'TCH2025001',
        CURRENT_TIMESTAMP,
        'Ciências Humanas'
    )
ON CONFLICT (user_id) DO NOTHING;
