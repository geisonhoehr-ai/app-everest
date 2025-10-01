# 🔧 Instruções para Corrigir Permissões de Administrador

## ⚠️ Problema Identificado

O sistema está deslogando administradores automaticamente ao acessar:
- Gestão de Turmas
- Módulos
- Calendário
- Qualquer página que faça queries nas tabelas do sistema

**Causa:** As RLS (Row Level Security) policies não permitem que administradores acessem as tabelas, mesmo autenticados.

## ✅ Solução

Execute o arquivo SQL que corrige todas as permissões.

### Passo a Passo:

1. **Abra o Supabase Dashboard**
   - Acesse: https://app.supabase.com
   - Faça login
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Ou acesse diretamente: `https://app.supabase.com/project/SEU_PROJECT_ID/sql`

3. **Execute o SQL**
   - Clique em "New Query"
   - Copie TODO o conteúdo do arquivo `FIX_ADMIN_PERMISSIONS_SAFE.sql`
   - Cole no editor
   - Clique em "Run" (ou pressione Ctrl+Enter)

4. **Verifique a Execução**
   - Você deve ver mensagens de sucesso como:
     ```
     ✅ Classes policies created
     ✅ Users policies created
     ✅ Students policies created
     ✅ Teachers policies created
     ✅ Subjects policies created
     ✅ Flashcards policies created
     ✅ Video_courses policies created
     ✅ Admin permissions configured successfully!
     ```

5. **Teste o Sistema**
   - Faça logout da aplicação
   - Faça login novamente como administrador
   - Tente acessar "Gestão de Turmas"
   - Tente acessar "Módulos"
   - Verifique se não é mais deslogado automaticamente

## 🔍 O que o SQL Faz

O arquivo cria:

1. **Funções Helper**
   - `is_admin()` - Verifica se o usuário autenticado é administrador
   - `is_authenticated()` - Verifica se há usuário autenticado

2. **Policies para Administradores**
   - Acesso TOTAL (SELECT, INSERT, UPDATE, DELETE) para admins
   - Em TODAS as tabelas do sistema

3. **Policies para Usuários Comuns**
   - Acesso SELECT (leitura) para usuários autenticados
   - Restrições específicas por tabela

## ⚡ Por que isso é Seguro

- O SQL verifica se cada tabela EXISTE antes de aplicar as policies
- Não cria tabelas novas
- Não modifica dados existentes
- Apenas configura as permissões de acesso

## 📝 Tabelas Afetadas

O SQL configura permissões para:
- classes
- users
- student_classes
- class_feature_permissions
- students
- teachers
- subjects
- flashcards
- video_courses

Se alguma tabela não existir, ela é simplesmente ignorada (não causa erro).

## 🐛 Se Algo Der Errado

Se encontrar erros ao executar:

1. Verifique se você está logado como OWNER do projeto
2. Copie o erro completo
3. Compartilhe comigo para análise

## ⏭️ Próximos Passos

Após executar o SQL com sucesso:

1. Teste o acesso a todas as páginas admin
2. Verifique se consegue criar/editar:
   - Turmas
   - Alunos
   - Professores
   - Flashcards
   - Vídeos
3. Confirme que o logout automático parou

---

**Arquivo a executar:** `migrations/FIX_ADMIN_PERMISSIONS_SAFE.sql`

**Tempo estimado:** 2-3 minutos
