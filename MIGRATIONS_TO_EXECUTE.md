# 🔧 Migrations Pendentes - Execute no Supabase

## ⚠️ IMPORTANTE
As migrations abaixo precisam ser executadas manualmente no Supabase SQL Editor com permissões de administrador.

## 📝 Migration: Melhorias para Administração

**Arquivo**: `supabase/migrations/20250930000000_enhance_admin_features.sql`

### O que essa migration faz:

1. **Adiciona categoria às conquistas (achievements)**
   - Campo `category` para organizar conquistas por tipo
   - Valores: `general`, `study`, `quiz`, `essay`, `social`

2. **Adiciona status às turmas (classes)**
   - Enum `class_status` com valores: `active`, `inactive`, `archived`
   - Permite melhor controle do ciclo de vida das turmas

3. **Melhora sistema de gamificação (user_progress)**
   - `total_xp`: XP total acumulado pelo usuário
   - `level`: Nível atual baseado no XP
   - `current_streak_days`: Sequência atual de dias estudando
   - `longest_streak_days`: Maior sequência alcançada
   - `last_activity_date`: Última data de atividade

4. **Cria views para otimização**
   - `class_stats`: Estatísticas agregadas de turmas
   - `user_ranking`: Ranking global de estudantes por XP

5. **Cria função útil**
   - `get_achievement_unlock_count()`: Retorna quantas vezes uma conquista foi desbloqueada

6. **Configura políticas RLS**
   - Todos podem ver conquistas
   - Apenas admins/professores podem gerenciar conquistas
   - Usuários veem suas próprias conquistas desbloqueadas

## 🚀 Como Executar

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Crie uma nova query
4. Copie e cole todo o conteúdo do arquivo `supabase/migrations/20250930000000_enhance_admin_features.sql`
5. Execute a query
6. Verifique se não houve erros

## ✅ Verificação

Após executar, verifique se os seguintes comandos retornam dados:

```sql
-- Verificar se a coluna category foi adicionada
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'achievements' AND column_name = 'category';

-- Verificar se a coluna status foi adicionada
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'classes' AND column_name = 'status';

-- Verificar se as colunas de gamificação foram adicionadas
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_progress' 
AND column_name IN ('total_xp', 'level', 'current_streak_days');

-- Verificar se a view foi criada
SELECT * FROM public.class_stats LIMIT 1;
SELECT * FROM public.user_ranking LIMIT 1;
```

## 📌 Nota

As páginas administrativas **já estão preparadas** para funcionar com ou sem essas migrations:
- ✅ Se a migration foi executada: usa as views otimizadas
- ✅ Se não foi executada: usa queries alternativas (fallback)

Isso garante que o sistema funcione imediatamente, mas executar a migration melhora a performance!

