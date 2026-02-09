-- ==============================================================================
-- LIMPEZA DE TABELAS OBSOLETAS
-- ==============================================================================
-- Remove tabelas que não são mais utilizadas pelo sistema para liberar espaço
-- e manter o schema limpo.
--
-- Tabelas removidas:
-- 1. quiz_questions_legacy: Dados já migrados para quiz_questions.
-- 2. user_incorrect_flashcards: Lógica substituída por logs de progresso.
-- 3. user_downloaded_audio_lessons: Funcionalidade gerida via cache/local.
-- ==============================================================================

BEGIN;

DROP TABLE IF EXISTS public.quiz_questions_legacy;
DROP TABLE IF EXISTS public.user_incorrect_flashcards;
DROP TABLE IF EXISTS public.user_downloaded_audio_lessons;

COMMIT;
