-- Correção para sincronizar auth.users com public.users
-- Resolve o conflito de constraint única users_email_idx

-- 1. Primeiro, vamos identificar e corrigir registros órfãos em auth.users
DO $$
DECLARE
    orphan_record RECORD;
BEGIN
    -- Encontrar usuários em auth.users que não têm perfil correspondente em public.users
    FOR orphan_record IN
        SELECT au.id, au.email
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE pu.id IS NULL
    LOOP
        RAISE NOTICE 'Usuário órfão encontrado: % (ID: %)', orphan_record.email, orphan_record.id;

        -- Criar perfil básico para o usuário órfão
        INSERT INTO public.users (id, email, first_name, last_name, role, is_active)
        VALUES (
            orphan_record.id,
            orphan_record.email,
            'Usuário',
            'Migrado',
            'student', -- papel padrão
            true
        )
        ON CONFLICT (id) DO NOTHING;

        RAISE NOTICE 'Perfil criado para: %', orphan_record.email;
    END LOOP;
END$$;

-- 2. Verificar e corrigir emails duplicados na tabela public.users
DO $$
DECLARE
    duplicate_record RECORD;
    counter INTEGER;
BEGIN
    -- Encontrar emails duplicados
    FOR duplicate_record IN
        SELECT email, COUNT(*) as count
        FROM public.users
        GROUP BY email
        HAVING COUNT(*) > 1
    LOOP
        RAISE NOTICE 'Email duplicado encontrado: % (% registros)', duplicate_record.email, duplicate_record.count;

        -- Manter apenas o primeiro registro e remover os duplicados
        counter := 0;
        FOR duplicate_record IN
            SELECT id FROM public.users
            WHERE email = duplicate_record.email
            ORDER BY created_at ASC
        LOOP
            counter := counter + 1;
            IF counter > 1 THEN
                DELETE FROM public.users WHERE id = duplicate_record.id;
                RAISE NOTICE 'Registro duplicado removido: %', duplicate_record.id;
            END IF;
        END LOOP;
    END LOOP;
END$$;

-- 3. Criar função para sincronização automática
CREATE OR REPLACE FUNCTION sync_auth_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando um novo usuário é criado em auth.users, criar automaticamente um perfil
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.users (id, email, first_name, last_name, role, is_active)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'first_name', 'Novo'),
            COALESCE(NEW.raw_user_meta_data->>'last_name', 'Usuário'),
            'student',
            true
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
            last_name = COALESCE(EXCLUDED.last_name, public.users.last_name);

        RETURN NEW;
    END IF;

    -- Quando um usuário é atualizado em auth.users, sincronizar o perfil
    IF TG_OP = 'UPDATE' THEN
        UPDATE public.users
        SET
            email = NEW.email,
            first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', first_name),
            last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', last_name)
        WHERE id = NEW.id;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger para sincronização automática
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_auth_user_profile();

-- 5. Função para limpar usuários órfãos periodicamente
CREATE OR REPLACE FUNCTION cleanup_orphaned_users()
RETURNS void AS $$
BEGIN
    -- Remove usuários de public.users que não têm correspondente em auth.users
    DELETE FROM public.users
    WHERE id NOT IN (SELECT id FROM auth.users);

    RAISE NOTICE 'Limpeza de usuários órfãos concluída';
END;
$$ LANGUAGE plpgsql;

-- 6. Garantir que a constraint única no email seja mantida
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- 7. Verificação final
DO $$
DECLARE
    auth_count INTEGER;
    users_count INTEGER;
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO auth_count FROM auth.users;
    SELECT COUNT(*) INTO users_count FROM public.users;

    SELECT COUNT(*) INTO orphan_count
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL;

    RAISE NOTICE 'Verificação final:';
    RAISE NOTICE 'Usuários em auth.users: %', auth_count;
    RAISE NOTICE 'Perfis em public.users: %', users_count;
    RAISE NOTICE 'Usuários órfãos restantes: %', orphan_count;
END$$;