-- Add drawing_data column to lesson_notes for notebook canvas drawings
ALTER TABLE lesson_notes ADD COLUMN IF NOT EXISTS drawing_data text;
