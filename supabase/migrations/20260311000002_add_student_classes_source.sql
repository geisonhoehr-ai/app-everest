-- Track how students were enrolled and coupon usage
ALTER TABLE student_classes
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- Add constraint for valid sources
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_classes_source_check'
  ) THEN
    ALTER TABLE student_classes
      ADD CONSTRAINT student_classes_source_check
      CHECK (source IN ('manual', 'memberkit', 'kiwify'));
  END IF;
END $$;

COMMENT ON COLUMN student_classes.source IS 'How student was enrolled: manual, memberkit, kiwify';
COMMENT ON COLUMN student_classes.coupon_code IS 'Kiwify coupon code used at purchase (ex-student discount)';
