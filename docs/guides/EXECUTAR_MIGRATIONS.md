# 🚀 Como Executar as Migrations

## ✅ Migration Corrigida!

O erro foi corrigido. A tabela `classes` usa `status` (não `is_active`).

## Opção 1: Via Supabase Dashboard (RECOMENDADO)

1. **Acesse**: https://supabase.com/dashboard
2. **Selecione** seu projeto Everest
3. **Vá em**: SQL Editor
4. **Abra o arquivo**: `supabase/migrations/20251019000001_create_tasting_class_auto_assignment.sql`
5. **Copie todo o conteúdo**
6. **Cole no SQL Editor**
7. **Clique em**: Run (ou Ctrl+Enter)

### Resultado Esperado

Você verá mensagens como:
```
NOTICE: Turma de Degustação criada com ID: [uuid]
```

Ou se já existir:
```
NOTICE: Turma de Degustação já existe com ID: [uuid]
```

---

## Opção 2: Via CLI do Supabase

### Pré-requisitos

```bash
# Instalar Supabase CLI (se ainda não tem)
npm install -g supabase

# Verificar instalação
supabase --version
```

### Executar Migration

```bash
# 1. Navegar para o diretório do projeto
cd "C:\Users\Yoda\Downloads\app.everest"

# 2. Linkar com seu projeto (primeira vez)
supabase link --project-ref SEU_PROJECT_REF

# 3. Executar todas as migrations pendentes
supabase db push
```

### Se quiser executar apenas esta migration específica

```bash
# Executar SQL diretamente
supabase db execute -f supabase/migrations/20251019000001_create_tasting_class_auto_assignment.sql
```

---

## ✅ Verificar se Funcionou

Depois de executar, verifique se a turma foi criada:

### Via SQL Editor

```sql
-- Ver turma de Degustação
SELECT * FROM public.classes WHERE name = 'Degustação';

-- Ver function criada
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'auto_assign_student_to_tasting_class';

-- Ver trigger criado
SELECT tgname, tgrelid::regclass, tgfoid::regproc
FROM pg_trigger
WHERE tgname = 'trigger_auto_assign_tasting_class';
```

---

## 🧪 Testar o Sistema

### Teste Manual

Você pode descomentar a seção de teste no final da migration e executar:

```sql
-- Descomentar linhas 157-197 do arquivo
-- Executar novamente no SQL Editor
```

### Teste Real

1. Vá para `/register`
2. Crie uma conta de teste
3. Verifique se o aluno aparece na turma "Degustação":

```sql
SELECT
  u.email,
  c.name as turma
FROM users u
JOIN student_classes sc ON sc.user_id = u.id
JOIN classes c ON c.id = sc.class_id
WHERE u.email = 'seu-email-teste@example.com';
```

---

## 🐛 Troubleshooting

### Erro: "relation classes does not exist"

A tabela `classes` ainda não foi criada. Você precisa executar as migrations anteriores primeiro:

```bash
supabase db push
```

### Erro: "column teacher_id does not exist"

Se der erro dizendo que falta `teacher_id`, pode ser que ela seja NOT NULL. Nesse caso, vamos precisar adicionar um valor default. Entre em contato.

### Erro: "duplicate key value violates unique constraint"

A turma "Degustação" já existe! Isso é OK. O trigger já deve estar funcionando.

### Trigger não está executando

Verifique se o trigger existe:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_assign_tasting_class';
```

Se não existir, execute a migration novamente.

---

## 📋 Próximos Passos

Depois de executar esta migration:

1. ✅ Execute a migration de RLS policies (se ainda não executou):
   ```bash
   supabase db push
   ```

2. ✅ Configure o Supabase Auth seguindo: [SUPABASE_AUTH_CONFIG.md](SUPABASE_AUTH_CONFIG.md)

3. ✅ Teste o cadastro completo

4. ✅ Libere para os alunos! 🎉

---

## 💡 Dicas

- **Backup**: O Supabase faz backup automático, mas não custa nada fazer um manual antes
- **Teste em Dev**: Se tiver ambiente de desenvolvimento, teste lá primeiro
- **Rollback**: Se algo der errado, você pode deletar a turma e o trigger:
  ```sql
  DROP TRIGGER IF EXISTS trigger_auto_assign_tasting_class ON users;
  DROP FUNCTION IF EXISTS auto_assign_student_to_tasting_class();
  DELETE FROM classes WHERE name = 'Degustação';
  ```

---

**Última Atualização**: 19 de Outubro de 2025
