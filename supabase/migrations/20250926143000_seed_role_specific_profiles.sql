-- Seed student profile for the test student user
-- This links the user with email 'aluno@teste.com' from auth.users to a profile in the students table.
INSERT INTO public.students (user_id, student_id_number, enrollment_date)
VALUES
    (
        (SELECT id FROM auth.users WHERE email = 'aluno@teste.com'),
        'ST2025001',
        CURRENT_TIMESTAMP
    )
ON CONFLICT (user_id) DO NOTHING;

-- Seed teacher profile for the test teacher user
-- This links the user with email 'professor@teste.com' from auth.users to a profile in the teachers table.
INSERT INTO public.teachers (user_id, employee_id_number, hire_date, department)
VALUES
    (
        (SELECT id FROM auth.users WHERE email = 'professor@teste.com'),
        'TCH2025001',
        CURRENT_TIMESTAMP,
        'Ciências Humanas'
    )
ON CONFLICT (user_id) DO NOTHING;
