-- =====================================================
-- CORREÇÃO DE VISIBILIDADE DE QUIZZES E SIMULADOS (v2)
-- =====================================================

DO $$ 
DECLARE 
    v_admin_id uuid;
BEGIN 
    -- 1. Identificar um ID de usuário válido para satisfazer as FKs
    -- Tenta primeiro um administrador
    SELECT id INTO v_admin_id FROM public.users WHERE role = 'administrator' LIMIT 1;
    
    -- Se não houver admin, pega o primeiro usuário que existir
    IF v_admin_id IS NULL THEN
        SELECT id INTO v_admin_id FROM public.users LIMIT 1;
    END IF;

    -- 2. Publicar todos os quizzes
    UPDATE public.quizzes 
    SET status = 'published' 
    WHERE status = 'draft' OR status IS NULL;

    -- 3. Corrigir IDs de criador que não existem na tabela users (evita erro de FK)
    IF v_admin_id IS NOT NULL THEN
        -- Se o created_by for inválido, aponta para o admin/user válido
        UPDATE public.quizzes 
        SET created_by = v_admin_id 
        WHERE created_by IS NOT NULL 
        AND created_by NOT IN (SELECT id FROM public.users);

        -- Se a coluna legada existir, migra com segurança
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'created_by_user_id') THEN
            -- Primeiro, atualiza os que têm IDs válidos
            UPDATE public.quizzes 
            SET created_by = created_by_user_id
            WHERE created_by IS NULL 
            AND created_by_user_id IN (SELECT id FROM public.users);

            -- O que sobrou (ID inválido ou nulo na origem) recebe o v_admin_id
            UPDATE public.quizzes 
            SET created_by = v_admin_id
            WHERE created_by IS NULL;
        END IF;

        -- Garante que nenhum created_by ficou nulo (se a tabela exigir)
        UPDATE public.quizzes SET created_by = v_admin_id WHERE created_by IS NULL;
    END IF;

    -- 4. Garantir que as matérias (subjects) e tópicos (topics) tenham ícones/imagens
    UPDATE public.subjects 
    SET image_url = 'https://img.usecurling.com/p/400/200?q=' || name
    WHERE image_url IS NULL;

END $$;

COMMENT ON TABLE public.quizzes IS 'Quizzes atualizados para published e IDs de criador corrigidos para evitar erros de FK.';

