-- Add missing foreign keys on essays table
-- Fixes: "Could not find a relationship between 'essays' and 'users' in the schema cache"
-- The essays table has student_id and teacher_id columns but no FK constraints to users

-- FK for student_id -> users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'essays_student_id_fkey'
    AND table_name = 'essays'
  ) THEN
    ALTER TABLE public.essays
      ADD CONSTRAINT essays_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES public.users(id);
  END IF;
END $$;

-- FK for teacher_id -> users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'essays_teacher_id_fkey'
    AND table_name = 'essays'
  ) THEN
    ALTER TABLE public.essays
      ADD CONSTRAINT essays_teacher_id_fkey
      FOREIGN KEY (teacher_id) REFERENCES public.users(id);
  END IF;
END $$;
