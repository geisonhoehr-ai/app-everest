-- =====================================================
-- DESABILITAR SISTEMA DE AUTO-ATRIBUIÇÃO À TURMA DEGUSTAÇÃO
-- =====================================================
--
-- Esta migration desabilita o sistema automático que adiciona
-- novos alunos à turma de "Degustação" ao se cadastrarem.
--
-- O que esta migration faz:
-- 1. Remove o trigger que auto-atribui alunos à turma Degustação
-- 2. Remove a função associada ao trigger
--
-- NOTA: A turma "Degustação" NÃO é deletada do banco.
-- Ela permanece disponível caso você queira usá-la manualmente.
--
-- =====================================================

-- 1. Remover o trigger de auto-atribuição
DROP TRIGGER IF EXISTS trigger_auto_assign_tasting_class ON public.users;

-- 2. Remover a função associada
DROP FUNCTION IF EXISTS public.auto_assign_student_to_tasting_class();

-- 3. Também remover o trigger antigo (se existir)
DROP TRIGGER IF EXISTS on_user_created_auto_enroll ON public.users;

-- 4. Remover a função antiga (se existir)
DROP FUNCTION IF EXISTS public.auto_enroll_in_default_class();

-- =====================================================
-- OBSERVAÇÕES
-- =====================================================
--
-- ✅ Sistema de auto-atribuição DESABILITADO
-- ✅ Novos usuários NÃO serão mais adicionados automaticamente à turma Degustação
-- ✅ A turma "Degustação" continua existindo no banco (pode ser usada manualmente)
-- ✅ Alunos já atribuídos à turma Degustação permanecem nela (não são removidos)
--
-- Para reabilitar este sistema no futuro, execute novamente a migration:
-- supabase/migrations/20251019000001_create_tasting_class_auto_assignment.sql
--
-- =====================================================

COMMENT ON TABLE public.classes IS 'Tabela de turmas. O sistema de auto-atribuição à turma Degustação foi desabilitado em 2025-11-16.';
