-- Enable uuid-ossp extension for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create test users in auth.users for student, teacher, and administrator roles.
-- The password for all users is 'senha123'.
-- This migration ensures that the subsequent profile seeding migrations will succeed.

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
