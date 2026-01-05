-- ==============================================================================
-- BLINDAGEM DE SEGURANÇA (RLS) PARA TABELAS LEGADO DE QUESTÕES
-- ==============================================================================
-- Tabela alvo: quiz_questions (e suas dependências subjects/topics)
-- Motivo: Eram tabelas antigas sem proteção, permitindo acesso indevido.
-- ==============================================================================

-- 1. Habilitar RLS (Força o banco a checar políticas para cada linha)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- POLÍTICAS PARA: SUBJECTS (Matérias)
-- ==============================================================================

-- Leitura: Liberada para todos autenticados (alunos precisam ver as matérias)
DROP POLICY IF EXISTS "Todos podem ver materias" ON public.subjects;
CREATE POLICY "Todos podem ver materias" 
ON public.subjects FOR SELECT 
TO authenticated 
USING (true);

-- Escrita: Apenas Admins e Professores
DROP POLICY IF EXISTS "Apenas admins gerenciam materias" ON public.subjects;
CREATE POLICY "Apenas admins gerenciam materias" 
ON public.subjects FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('administrator', 'teacher')
  )
);


-- ==============================================================================
-- POLÍTICAS PARA: TOPICS (Tópicos)
-- ==============================================================================

-- Leitura: Liberada para todos autenticados
DROP POLICY IF EXISTS "Todos podem ver topicos" ON public.topics;
CREATE POLICY "Todos podem ver topicos" 
ON public.topics FOR SELECT 
TO authenticated 
USING (true);

-- Escrita: Apenas Admins e Professores
DROP POLICY IF EXISTS "Apenas admins gerenciam topicos" ON public.topics;
CREATE POLICY "Apenas admins gerenciam topicos" 
ON public.topics FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('administrator', 'teacher')
  )
);


-- ==============================================================================
-- POLÍTICAS PARA: QUIZ_QUESTIONS (A Tabela "Legado" de Questões)
-- ==============================================================================

-- Leitura: Liberada para todos autenticados
-- Nota: Alunos precisam baixar as questões para fazer a prova/banco de questões.
DROP POLICY IF EXISTS "Todos podem ver questoes" ON public.quiz_questions;
CREATE POLICY "Todos podem ver questoes" 
ON public.quiz_questions FOR SELECT 
TO authenticated 
USING (true);

-- Escrita: Apenas Admins e Professores
-- Proteção crítica contra deleção ou alteração por alunos
DROP POLICY IF EXISTS "Apenas admins gerenciam questoes" ON public.quiz_questions;
CREATE POLICY "Apenas admins gerenciam questoes" 
ON public.quiz_questions FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('administrator', 'teacher')
  )
);

-- FIM DA BLINDAGEM
