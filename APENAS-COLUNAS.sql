-- APENAS ADICIONAR COLUNAS - SUPER SIMPLES

ALTER TABLE public.quizzes ADD COLUMN type VARCHAR(50) DEFAULT 'quiz';
ALTER TABLE public.quizzes ADD COLUMN status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE public.quizzes ADD COLUMN scheduled_start TIMESTAMPTZ;
ALTER TABLE public.quizzes ADD COLUMN scheduled_end TIMESTAMPTZ;
ALTER TABLE public.quizzes ADD COLUMN total_points INTEGER DEFAULT 0;
ALTER TABLE public.quizzes ADD COLUMN passing_score INTEGER;
ALTER TABLE public.quizzes ADD COLUMN show_results_immediately BOOLEAN DEFAULT true;
ALTER TABLE public.quizzes ADD COLUMN shuffle_questions BOOLEAN DEFAULT false;
ALTER TABLE public.quizzes ADD COLUMN shuffle_options BOOLEAN DEFAULT false;
ALTER TABLE public.quizzes ADD COLUMN allow_review BOOLEAN DEFAULT true;
ALTER TABLE public.quizzes ADD COLUMN instructions TEXT;
ALTER TABLE public.quizzes ADD COLUMN created_by UUID;
