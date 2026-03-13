-- Add missing foreign keys on essays and student_classes tables
-- Fixes PGRST200 errors:
--   "Could not find a relationship between 'essays' and 'users'"
--   "Could not find a relationship between 'users' and 'student_classes'"

-- FK for essays.student_id -> users(id)
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

-- FK for essays.teacher_id -> users(id)
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

-- FK for student_classes.user_id -> users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'student_classes_user_id_fkey'
    AND table_name = 'student_classes'
  ) THEN
    ALTER TABLE public.student_classes
      ADD CONSTRAINT student_classes_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id);
  END IF;
END $$;
