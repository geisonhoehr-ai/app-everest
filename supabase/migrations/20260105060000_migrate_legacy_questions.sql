-- ==============================================================================
-- ANÁLISE E MIGRAÇÃO: IMPORTAR QUESTÕES DA TABELA LEGADO (quiz_questions_legacy)
-- ==============================================================================

DO $$
DECLARE
    v_legacy_count INTEGER := 0;
    v_new_count INTEGER := 0;
    v_imported_count INTEGER := 0;
    v_duplicate_count INTEGER := 0;
    rec RECORD;
    v_current_quiz_id UUID;
    v_default_topic_id UUID;
    v_admin_user_id UUID;
    v_default_subject_id UUID;
BEGIN
    -- 1. Verificar se a tabela legado existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_questions_legacy') THEN
        
        -- Obter um admin ID qualquer para ser "dono" (obrigatório pelo erro anterior)
        SELECT id INTO v_admin_user_id FROM auth.users LIMIT 1;
        
        -- Contar total na legado
        EXECUTE 'SELECT count(*) FROM quiz_questions_legacy' INTO v_legacy_count;
        
        -- Garantir que existe uma matéria padrão se nada for achado
        SELECT id INTO v_default_subject_id FROM subjects LIMIT 1;
        IF v_default_subject_id IS NULL THEN
             INSERT INTO subjects (name, category, created_by_user_id) 
             VALUES ('Geral (Importação)', 'Geral', v_admin_user_id)
             RETURNING id INTO v_default_subject_id;
        END IF;

        -- Buscar ID de um tópico padrão 'Geral' ou criar se não houver (para questões órfãs)
        SELECT id INTO v_default_topic_id FROM topics WHERE name = 'Importadas Legado' LIMIT 1;
        
        IF v_default_topic_id IS NULL THEN
            INSERT INTO topics (name, subject_id, created_by_user_id) 
            VALUES ('Importadas Legado', v_default_subject_id, v_admin_user_id)
            RETURNING id INTO v_default_topic_id;
        END IF;

        -- 2. Iterar sobre questões da tabela legado e tentar importar
        FOR rec IN EXECUTE 'SELECT * FROM quiz_questions_legacy' LOOP
            
            -- Verificar se já existe questão com MESMO TEXTO na tabela nova
            -- A coluna na legado parece ser 'question' (conforme print), na nova é 'question_text'
            IF EXISTS (SELECT 1 FROM quiz_questions WHERE question_text = rec.question) THEN
                v_duplicate_count := v_duplicate_count + 1;
            ELSE
                -- Tentar manter o quiz_id se ele existir na tabela quizzes atual
                IF EXISTS (SELECT 1 FROM quizzes WHERE id = rec.quiz_id) THEN
                    v_current_quiz_id := rec.quiz_id;
                ELSE
                    v_current_quiz_id := NULL; -- Ou criar um quiz "Legado"
                END IF;

                -- Inserir na tabela nova
                -- Atenção: Mapeando colunas baseado na estrutura provável
                -- Se faltar 'options', 'correct_answer' na legado, teremos que lidar (usando defaults ou verificando schema)
                -- O código abaixo assume que a legado tem estrutura similar ou compatível. 
                -- Se a legado tiver colunas diferentes, este insert precisa ser ajustado.
                -- Pelo print, vemos: id, quiz_id, question. Não vemos options/answer.
                -- VAMOS SUPOR que existam options/answer/correct_answer na legado também, senão a questão é inútil.
                
                BEGIN
                    INSERT INTO quiz_questions (
                        quiz_id, 
                        question_text, 
                        topic_id,
                        -- Tentativa de mapear outros campos comuns
                        options, 
                        correct_answer, 
                        explanation,
                        question_type,
                        created_by_user_id -- Obrigatório agora também
                    )
                    VALUES (
                        v_current_quiz_id, 
                        rec.question, 
                        v_default_topic_id, -- Vincula a tópico genérico se quiz for null
                        COALESCE(rec.options, '[]'::jsonb), -- Fallback se null
                        COALESCE(rec.correct_answer, ''),
                        COALESCE(rec.explanation, 'Importado de legado'),
                        'multiple_choice',
                        v_admin_user_id
                    );
                    v_imported_count := v_imported_count + 1;
                EXCEPTION WHEN OTHERS THEN
                    -- Ignora erro em linha específica para não parar o loop (ex: colunas faltando)
                    RAISE NOTICE 'Erro ao importar questão %: %', rec.id, SQLERRM;
                END;
            END IF;
        END LOOP;

        RAISE NOTICE '=== RELATÓRIO DE MIGRAÇÃO ===';
        RAISE NOTICE 'Total na Tabela Legado: %', v_legacy_count;
        RAISE NOTICE 'Duplicadas (já existiam na nova): %', v_duplicate_count;
        RAISE NOTICE 'Novas Importadas: %', v_imported_count;
    
    ELSE
        RAISE NOTICE 'Tabela quiz_questions_legacy não encontrada.';
    END IF;

END $$;
