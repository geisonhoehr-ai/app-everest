-- ============================================================
-- Migration: Import Pipeline Schema
-- Date: 2026-03-15
-- Purpose: Prepare database to receive 8,000+ quiz questions
--          and 14,000+ flashcards from ENEM, military exams,
--          and grammar books.
--
-- Changes:
--   1. Source tracking fields on quiz_questions + flashcards
--   2. Duplicate prevention constraints
--   3. New subjects & topics (ENEM + Militares)
--   4. Question images storage bucket
--   5. Acervo → Question linking
--   6. Import job tracking table
--   7. RPC for bulk import stats
-- ============================================================

-- ============================================================
-- PART 1: Source tracking on quiz_questions
-- ============================================================

-- Track where each question came from
ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS source_exam TEXT,
  ADD COLUMN IF NOT EXISTS source_banca TEXT,
  ADD COLUMN IF NOT EXISTS source_year INTEGER,
  ADD COLUMN IF NOT EXISTS source_question_number INTEGER,
  ADD COLUMN IF NOT EXISTS acervo_item_id UUID REFERENCES public.acervo_items(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.quiz_questions.source_exam IS 'Exam origin: ENEM, EAOF, EAOP, CAMAR, CADAR, CAFAR, CFOE, etc.';
COMMENT ON COLUMN public.quiz_questions.source_banca IS 'Exam board: INEP, FGR, Consulplan, FADECIT, CKM, etc.';
COMMENT ON COLUMN public.quiz_questions.source_year IS 'Year of the original exam';
COMMENT ON COLUMN public.quiz_questions.source_question_number IS 'Original question number in the exam';
COMMENT ON COLUMN public.quiz_questions.acervo_item_id IS 'Link to source PDF in acervo_items';

-- Index for filtering by source (admin reports, student practice)
CREATE INDEX IF NOT EXISTS idx_quiz_questions_source
  ON public.quiz_questions (source_exam, source_year);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_banca
  ON public.quiz_questions (source_banca);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_acervo
  ON public.quiz_questions (acervo_item_id)
  WHERE acervo_item_id IS NOT NULL;

-- ============================================================
-- PART 2: Source tracking on flashcards
-- ============================================================

ALTER TABLE public.flashcards
  ADD COLUMN IF NOT EXISTS source_exam TEXT,
  ADD COLUMN IF NOT EXISTS source_banca TEXT,
  ADD COLUMN IF NOT EXISTS source_year INTEGER,
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS acervo_item_id UUID REFERENCES public.acervo_items(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.flashcards.source_exam IS 'Origin: ENEM, EAOF, Gramática Pestana, etc.';
COMMENT ON COLUMN public.flashcards.source_type IS 'How it was created: manual, imported_csv, extracted_pdf, generated_ai';
COMMENT ON COLUMN public.flashcards.acervo_item_id IS 'Link to source PDF in acervo_items';

CREATE INDEX IF NOT EXISTS idx_flashcards_source
  ON public.flashcards (source_exam, source_year);

CREATE INDEX IF NOT EXISTS idx_flashcards_source_type
  ON public.flashcards (source_type);

-- ============================================================
-- PART 3: Duplicate prevention
-- ============================================================

-- For quiz_questions: prevent exact same question from same exam/year/number
-- Using a partial unique index (only when source_exam is set)
CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_questions_unique_source
  ON public.quiz_questions (source_exam, source_year, source_question_number)
  WHERE source_exam IS NOT NULL AND source_year IS NOT NULL AND source_question_number IS NOT NULL;

-- For flashcards: prevent exact same question text from same source
-- Using MD5 hash to handle long text comparisons efficiently
CREATE UNIQUE INDEX IF NOT EXISTS idx_flashcards_unique_source
  ON public.flashcards (md5(question), source_exam, source_year)
  WHERE source_exam IS NOT NULL;

-- ============================================================
-- PART 4: New subjects & topics for ENEM + Military exams
-- ============================================================

DO $$
DECLARE
  admin_user_id uuid;
  -- ENEM subject IDs
  s_ciencias_natureza uuid;
  s_ciencias_humanas uuid;
  s_linguagens uuid;
  s_matematica uuid;
  s_redacao uuid;
  -- Military subject IDs
  s_conhecimentos_militares uuid;
  s_historia uuid;
  s_geografia uuid;
  s_fisica uuid;
  s_quimica uuid;
  s_biologia uuid;
  s_ingles uuid;
  -- Existing subject IDs
  s_portugues uuid;
  s_matematica_existing uuid;
BEGIN
  -- Get admin user
  SELECT id INTO admin_user_id FROM public.users WHERE role = 'administrator' LIMIT 1;
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM public.users LIMIT 1;
  END IF;

  -- Get existing subjects to avoid duplicates
  SELECT id INTO s_portugues FROM public.subjects WHERE name = 'Português' OR name = 'Língua Portuguesa' LIMIT 1;
  SELECT id INTO s_matematica_existing FROM public.subjects WHERE name = 'Matemática' LIMIT 1;

  -- ========== ENEM SUBJECTS ==========

  -- Ciências da Natureza
  INSERT INTO public.subjects (id, name, category, description, created_by_user_id)
  VALUES (gen_random_uuid(), 'Ciências da Natureza', 'ENEM', 'Física, Química e Biologia - ENEM', admin_user_id)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO s_ciencias_natureza;
  IF s_ciencias_natureza IS NULL THEN
    SELECT id INTO s_ciencias_natureza FROM public.subjects WHERE name = 'Ciências da Natureza';
  END IF;

  -- Ciências Humanas
  INSERT INTO public.subjects (id, name, category, description, created_by_user_id)
  VALUES (gen_random_uuid(), 'Ciências Humanas', 'ENEM', 'História, Geografia, Sociologia e Filosofia - ENEM', admin_user_id)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO s_ciencias_humanas;
  IF s_ciencias_humanas IS NULL THEN
    SELECT id INTO s_ciencias_humanas FROM public.subjects WHERE name = 'Ciências Humanas';
  END IF;

  -- Linguagens (pode já existir como Português)
  INSERT INTO public.subjects (id, name, category, description, created_by_user_id)
  VALUES (gen_random_uuid(), 'Linguagens e Códigos', 'ENEM', 'Português, Literatura, Artes e Educação Física - ENEM', admin_user_id)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO s_linguagens;
  IF s_linguagens IS NULL THEN
    SELECT id INTO s_linguagens FROM public.subjects WHERE name = 'Linguagens e Códigos';
  END IF;

  -- Redação
  INSERT INTO public.subjects (id, name, category, description, created_by_user_id)
  VALUES (gen_random_uuid(), 'Redação', 'ENEM', 'Redação dissertativo-argumentativa - ENEM', admin_user_id)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO s_redacao;
  IF s_redacao IS NULL THEN
    SELECT id INTO s_redacao FROM public.subjects WHERE name = 'Redação';
  END IF;

  -- ========== MILITARY SUBJECTS ==========

  INSERT INTO public.subjects (id, name, category, description, created_by_user_id)
  VALUES (gen_random_uuid(), 'Conhecimentos Militares', 'Militares', 'Legislação militar, regulamentos e doutrina', admin_user_id)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO s_conhecimentos_militares;
  IF s_conhecimentos_militares IS NULL THEN
    SELECT id INTO s_conhecimentos_militares FROM public.subjects WHERE name = 'Conhecimentos Militares';
  END IF;

  INSERT INTO public.subjects (id, name, category, description, created_by_user_id)
  VALUES (gen_random_uuid(), 'História', 'Geral', 'História do Brasil e Geral', admin_user_id)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO s_historia;
  IF s_historia IS NULL THEN
    SELECT id INTO s_historia FROM public.subjects WHERE name = 'História';
  END IF;

  INSERT INTO public.subjects (id, name, category, description, created_by_user_id)
  VALUES (gen_random_uuid(), 'Geografia', 'Geral', 'Geografia do Brasil e Geral', admin_user_id)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO s_geografia;
  IF s_geografia IS NULL THEN
    SELECT id INTO s_geografia FROM public.subjects WHERE name = 'Geografia';
  END IF;

  INSERT INTO public.subjects (id, name, category, description, created_by_user_id)
  VALUES (gen_random_uuid(), 'Física', 'Exatas', 'Mecânica, Termologia, Óptica, Eletricidade', admin_user_id)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO s_fisica;
  IF s_fisica IS NULL THEN
    SELECT id INTO s_fisica FROM public.subjects WHERE name = 'Física';
  END IF;

  INSERT INTO public.subjects (id, name, category, description, created_by_user_id)
  VALUES (gen_random_uuid(), 'Química', 'Exatas', 'Química Geral, Orgânica e Inorgânica', admin_user_id)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO s_quimica;
  IF s_quimica IS NULL THEN
    SELECT id INTO s_quimica FROM public.subjects WHERE name = 'Química';
  END IF;

  INSERT INTO public.subjects (id, name, category, description, created_by_user_id)
  VALUES (gen_random_uuid(), 'Biologia', 'Exatas', 'Citologia, Genética, Ecologia, Anatomia', admin_user_id)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO s_biologia;
  IF s_biologia IS NULL THEN
    SELECT id INTO s_biologia FROM public.subjects WHERE name = 'Biologia';
  END IF;

  INSERT INTO public.subjects (id, name, category, description, created_by_user_id)
  VALUES (gen_random_uuid(), 'Inglês', 'Linguagens', 'Língua Inglesa - Interpretação e Gramática', admin_user_id)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO s_ingles;
  IF s_ingles IS NULL THEN
    SELECT id INTO s_ingles FROM public.subjects WHERE name = 'Inglês';
  END IF;

  -- ========== TOPICS FOR ENEM ==========

  -- Ciências da Natureza topics
  IF s_ciencias_natureza IS NOT NULL THEN
    INSERT INTO public.topics (id, name, subject_id, description, created_by_user_id) VALUES
      (gen_random_uuid(), 'Mecânica', s_ciencias_natureza, 'Cinemática, Dinâmica, Leis de Newton', admin_user_id),
      (gen_random_uuid(), 'Termologia', s_ciencias_natureza, 'Temperatura, Calor, Termodinâmica', admin_user_id),
      (gen_random_uuid(), 'Óptica e Ondas', s_ciencias_natureza, 'Óptica geométrica, ondas, som, luz', admin_user_id),
      (gen_random_uuid(), 'Eletricidade', s_ciencias_natureza, 'Eletrostática, circuitos, eletromagnetismo', admin_user_id),
      (gen_random_uuid(), 'Química Geral', s_ciencias_natureza, 'Estequiometria, soluções, reações', admin_user_id),
      (gen_random_uuid(), 'Química Orgânica', s_ciencias_natureza, 'Cadeias carbônicas, funções orgânicas', admin_user_id),
      (gen_random_uuid(), 'Biologia Celular', s_ciencias_natureza, 'Citologia, metabolismo, reprodução', admin_user_id),
      (gen_random_uuid(), 'Ecologia', s_ciencias_natureza, 'Ecossistemas, ciclos, meio ambiente', admin_user_id),
      (gen_random_uuid(), 'Genética e Evolução', s_ciencias_natureza, 'Leis de Mendel, DNA, seleção natural', admin_user_id),
      (gen_random_uuid(), 'Anatomia e Fisiologia', s_ciencias_natureza, 'Sistemas do corpo humano', admin_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Ciências Humanas topics
  IF s_ciencias_humanas IS NOT NULL THEN
    INSERT INTO public.topics (id, name, subject_id, description, created_by_user_id) VALUES
      (gen_random_uuid(), 'História do Brasil', s_ciencias_humanas, 'Colonial, Imperial, República', admin_user_id),
      (gen_random_uuid(), 'História Geral', s_ciencias_humanas, 'Antiguidade, Medieval, Moderna, Contemporânea', admin_user_id),
      (gen_random_uuid(), 'Geografia Física', s_ciencias_humanas, 'Relevo, clima, hidrografia, biomas', admin_user_id),
      (gen_random_uuid(), 'Geografia Humana', s_ciencias_humanas, 'Urbanização, demografia, economia', admin_user_id),
      (gen_random_uuid(), 'Geopolítica', s_ciencias_humanas, 'Conflitos, globalização, organizações internacionais', admin_user_id),
      (gen_random_uuid(), 'Sociologia', s_ciencias_humanas, 'Durkheim, Weber, Marx, movimentos sociais', admin_user_id),
      (gen_random_uuid(), 'Filosofia', s_ciencias_humanas, 'Ética, política, epistemologia, estética', admin_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Linguagens e Códigos topics
  IF s_linguagens IS NOT NULL THEN
    INSERT INTO public.topics (id, name, subject_id, description, created_by_user_id) VALUES
      (gen_random_uuid(), 'Literatura Brasileira', s_linguagens, 'Escolas literárias, autores, obras', admin_user_id),
      (gen_random_uuid(), 'Artes', s_linguagens, 'Movimentos artísticos, obras, artistas', admin_user_id),
      (gen_random_uuid(), 'Língua Estrangeira - Inglês', s_linguagens, 'Interpretação de texto em inglês', admin_user_id),
      (gen_random_uuid(), 'Língua Estrangeira - Espanhol', s_linguagens, 'Interpretação de texto em espanhol', admin_user_id),
      (gen_random_uuid(), 'Comunicação e Gêneros Textuais', s_linguagens, 'Tipos de texto, funções da linguagem', admin_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Conhecimentos Militares topics
  IF s_conhecimentos_militares IS NOT NULL THEN
    INSERT INTO public.topics (id, name, subject_id, description, created_by_user_id) VALUES
      (gen_random_uuid(), 'Estatuto dos Militares', s_conhecimentos_militares, 'Lei 6.880/80 - Estatuto dos Militares', admin_user_id),
      (gen_random_uuid(), 'Regulamento Disciplinar', s_conhecimentos_militares, 'RDAER, punições, transgressões', admin_user_id),
      (gen_random_uuid(), 'Direito Aeronáutico', s_conhecimentos_militares, 'Legislação aeronáutica, CBA', admin_user_id),
      (gen_random_uuid(), 'Organização da Aeronáutica', s_conhecimentos_militares, 'Estrutura do COMAER, comandos, unidades', admin_user_id),
      (gen_random_uuid(), 'Doutrina Militar', s_conhecimentos_militares, 'Hierarquia, disciplina, valores militares', admin_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Português topics (add missing ones to existing subject)
  IF s_portugues IS NOT NULL THEN
    INSERT INTO public.topics (id, name, subject_id, description, created_by_user_id) VALUES
      (gen_random_uuid(), 'Semântica', s_portugues, 'Significado das palavras, sinônimos, antônimos', admin_user_id),
      (gen_random_uuid(), 'Figuras de Linguagem', s_portugues, 'Metáfora, metonímia, ironia, hipérbole', admin_user_id),
      (gen_random_uuid(), 'Tipologia Textual', s_portugues, 'Narração, descrição, dissertação, injunção', admin_user_id),
      (gen_random_uuid(), 'Coesão e Coerência', s_portugues, 'Conectivos, referenciação, progressão textual', admin_user_id),
      (gen_random_uuid(), 'Acentuação', s_portugues, 'Regras de acentuação gráfica', admin_user_id),
      (gen_random_uuid(), 'Vozes Verbais', s_portugues, 'Ativa, passiva, reflexiva', admin_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Física topics (standalone)
  IF s_fisica IS NOT NULL THEN
    INSERT INTO public.topics (id, name, subject_id, description, created_by_user_id) VALUES
      (gen_random_uuid(), 'Cinemática', s_fisica, 'MRU, MRUV, lançamentos', admin_user_id),
      (gen_random_uuid(), 'Dinâmica', s_fisica, 'Leis de Newton, força, trabalho, energia', admin_user_id),
      (gen_random_uuid(), 'Hidrostática', s_fisica, 'Pressão, empuxo, princípio de Arquimedes', admin_user_id),
      (gen_random_uuid(), 'Eletromagnetismo', s_fisica, 'Campo magnético, indução, Faraday', admin_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- História topics (standalone)
  IF s_historia IS NOT NULL THEN
    INSERT INTO public.topics (id, name, subject_id, description, created_by_user_id) VALUES
      (gen_random_uuid(), 'Brasil Colônia', s_historia, 'Descobrimento, capitanias, mineração', admin_user_id),
      (gen_random_uuid(), 'Brasil Império', s_historia, 'Independência, Primeiro e Segundo Reinado', admin_user_id),
      (gen_random_uuid(), 'Brasil República', s_historia, 'República Velha, Era Vargas, Ditadura, Redemocratização', admin_user_id),
      (gen_random_uuid(), 'Guerras Mundiais', s_historia, 'Primeira e Segunda Guerra, Guerra Fria', admin_user_id),
      (gen_random_uuid(), 'Idade Média', s_historia, 'Feudalismo, Cruzadas, Renascimento', admin_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Geografia topics (standalone)
  IF s_geografia IS NOT NULL THEN
    INSERT INTO public.topics (id, name, subject_id, description, created_by_user_id) VALUES
      (gen_random_uuid(), 'Cartografia', s_geografia, 'Mapas, projeções, escalas, coordenadas', admin_user_id),
      (gen_random_uuid(), 'Climatologia', s_geografia, 'Climas do Brasil e do mundo, fenômenos', admin_user_id),
      (gen_random_uuid(), 'Urbanização', s_geografia, 'Cidades, metrópoles, problemas urbanos', admin_user_id),
      (gen_random_uuid(), 'Meio Ambiente', s_geografia, 'Biomas, desmatamento, sustentabilidade', admin_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Subjects and topics created successfully';
END $$;

-- ============================================================
-- PART 5: Question images storage bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'question-images',
  'question-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: anyone can read, admins/teachers can upload
CREATE POLICY "question_images_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'question-images');

CREATE POLICY "question_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'question-images'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('administrator', 'teacher')
    )
  );

CREATE POLICY "question_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'question-images'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'administrator'
    )
  );

-- ============================================================
-- PART 6: Import job tracking table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL, -- 'enem_csv', 'military_pdf', 'grammar_pdf', 'manual'
  source_name TEXT NOT NULL, -- 'ENEM 2024', 'EAOF 2023', 'Gramática Pestana'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  total_items INTEGER DEFAULT 0,
  imported_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  duplicate_items INTEGER DEFAULT 0,
  questions_created INTEGER DEFAULT 0,
  flashcards_created INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb, -- source file info, settings, etc.
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_type ON public.import_jobs(job_type, created_at DESC);

-- RLS: only admins can see/manage import jobs
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_jobs_admin_all" ON public.import_jobs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'administrator'
    )
  );

-- ============================================================
-- PART 7: RPC for import stats dashboard
-- ============================================================

CREATE OR REPLACE FUNCTION get_import_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_questions', (SELECT COUNT(*) FROM quiz_questions),
    'total_flashcards', (SELECT COUNT(*) FROM flashcards),
    'total_subjects', (SELECT COUNT(*) FROM subjects),
    'total_topics', (SELECT COUNT(*) FROM topics),
    'questions_by_source', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT source_exam, source_year, COUNT(*) as count
        FROM quiz_questions
        WHERE source_exam IS NOT NULL
        GROUP BY source_exam, source_year
        ORDER BY source_exam, source_year DESC
      ) t
    ),
    'flashcards_by_source', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT source_exam, source_type, COUNT(*) as count
        FROM flashcards
        WHERE source_exam IS NOT NULL
        GROUP BY source_exam, source_type
        ORDER BY source_exam
      ) t
    ),
    'recent_imports', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, job_type, source_name, status,
               total_items, imported_items, failed_items, duplicate_items,
               questions_created, flashcards_created,
               started_at, completed_at
        FROM import_jobs
        ORDER BY created_at DESC
        LIMIT 10
      ) t
    ),
    'questions_by_difficulty', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT difficulty, COUNT(*) as count
        FROM quiz_questions
        GROUP BY difficulty
        ORDER BY difficulty
      ) t
    ),
    'acervo_stats', (
      SELECT json_build_object(
        'total_items', (SELECT COUNT(*) FROM acervo_items),
        'by_category', (
          SELECT json_agg(row_to_json(t))
          FROM (
            SELECT category, COUNT(*) as count
            FROM acervo_items
            GROUP BY category
            ORDER BY count DESC
          ) t
        ),
        'by_concurso', (
          SELECT json_agg(row_to_json(t))
          FROM (
            SELECT concurso, COUNT(*) as count
            FROM acervo_items
            WHERE concurso IS NOT NULL
            GROUP BY concurso
            ORDER BY count DESC
          ) t
        )
      )
    )
  );
$$;

-- ============================================================
-- PART 8: Extend acervo_items for better categorization
-- ============================================================

-- Add more granular fields to acervo
ALTER TABLE public.acervo_items
  ADD COLUMN IF NOT EXISTS banca TEXT,
  ADD COLUMN IF NOT EXISTS questions_extracted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS questions_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN public.acervo_items.banca IS 'Exam board: INEP, FGR, Consulplan, FADECIT, etc.';
COMMENT ON COLUMN public.acervo_items.questions_extracted IS 'Whether questions were extracted from this PDF';
COMMENT ON COLUMN public.acervo_items.questions_count IS 'Number of questions extracted from this item';
COMMENT ON COLUMN public.acervo_items.description IS 'Optional description or notes about this item';

-- ============================================================
-- PART 9: Full-text search on questions (for dedup & discovery)
-- ============================================================

-- GIN index for full-text search on question text
CREATE INDEX IF NOT EXISTS idx_quiz_questions_fts
  ON public.quiz_questions
  USING gin(to_tsvector('portuguese', question_text));

CREATE INDEX IF NOT EXISTS idx_flashcards_fts
  ON public.flashcards
  USING gin(to_tsvector('portuguese', question));

-- ============================================================
-- PART 10: Analyze all affected tables
-- ============================================================

ANALYZE public.quiz_questions;
ANALYZE public.flashcards;
ANALYZE public.subjects;
ANALYZE public.topics;
ANALYZE public.acervo_items;
