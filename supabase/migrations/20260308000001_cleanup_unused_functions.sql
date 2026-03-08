-- Cleanup: Remove unused RPC functions and disabled trigger

-- Unused RPC functions (never called from any service)
DROP FUNCTION IF EXISTS calculate_quiz_result CASCADE;
DROP FUNCTION IF EXISTS validate_answer_sheet CASCADE;
DROP FUNCTION IF EXISTS get_achievement_unlock_count CASCADE;
DROP FUNCTION IF EXISTS cleanup_orphaned_users CASCADE;
DROP FUNCTION IF EXISTS auto_assign_student_to_tasting_class CASCADE;

-- Disabled trigger (was disabled in migration 20251116000000)
DROP TRIGGER IF EXISTS trigger_auto_assign_tasting_class ON auth.users;
