# 🚨 URGENTE: Como Corrigir o Login AGORA

## ❌ Problema Atual

Você não consegue fazer login porque:
- **Erro**: "Network error fetching profile: Error: Profile fetch timeout"
- **Causa**: As políticas RLS (Row Level Security) da tabela `users` estão bloqueando o acesso ao perfil
- **Resultado**: O sistema não consegue carregar os dados do usuário após autenticação

## ✅ Solução Rápida (5 minutos)

### PASSO 1: Abrir o Supabase Studio
1. Acesse: **https://supabase.com/dashboard**
2. Faça login na sua conta
3. Selecione o projeto **Everest**

### PASSO 2: Ir para o SQL Editor
1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique no botão **"New Query"** (ou pressione `Ctrl+N`)

### PASSO 3: Copiar e Colar o Script
1. Abra o arquivo no Windows Explorer:
   ```
   c:\Users\Yoda\Downloads\app.everest\database\FIX_USER_CLASS_DROPDOWNS.sql
   ```
2. Selecione **TODO O CONTEÚDO** (Ctrl+A)
3. Copie (Ctrl+C)
4. Volte para o Supabase Studio
5. Cole no SQL Editor (Ctrl+V)

### PASSO 4: Executar o Script
1. Clique no botão **"Run"** (ou pressione `Ctrl+Enter`)
2. Aguarde 5-10 segundos
3. Você deve ver a mensagem: **"Success. No rows returned"**

### PASSO 5: Testar o Login
1. Volte para a aplicação Everest
2. Recarregue a página (F5)
3. Tente fazer login com: **admin@teste.com**
4. **✅ Deve funcionar agora!**

---

## 🔧 O que o Script Faz

O script corrige as políticas RLS (Row Level Security) que estão bloqueando o acesso. Especificamente:

### Antes (BLOQUEADO ❌)
```sql
-- Política antiga com recursão problemática
CREATE POLICY "Enable read access for authenticated users" ON users
    USING (
        auth.uid() = id OR
        (SELECT role FROM users WHERE id = auth.uid()) IN ('administrator', 'teacher')
        -- ↑ Esta linha causa problema de recursão
    );
```

### Depois (FUNCIONANDO ✅)
```sql
-- Nova política sem recursão
CREATE POLICY "Users can view based on role" ON users
    USING (
        id = auth.uid()
        OR
        (SELECT role FROM users WHERE id = auth.uid() LIMIT 1) IN ('administrator', 'teacher')
        -- ↑ LIMIT 1 evita problemas
    );
```

---

## 🧪 Como Verificar se Funcionou

Depois de executar o script, rode esta query no SQL Editor:

```sql
-- Cole e execute esta query
SELECT COUNT(*) as total_users FROM public.users;
```

**Resultado esperado**:
- Deve retornar um número (exemplo: `5`, `10`, etc.)
- Se retornar `0` ou erro, algo deu errado

---

## ⚠️ Se Ainda Não Funcionar

### Problema: Não encontro o projeto no Supabase
**Solução**: Verifique se você está logado na conta correta

### Problema: Erro de permissão ao executar o script
**Solução**:
1. No SQL Editor, procure por um seletor de "API Key"
2. Mude de "Anon Key" para **"Service Role"**
3. Execute novamente

### Problema: Script executou mas login ainda falha
**Solução**:
1. Faça **logout** da aplicação
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Recarregue a página (F5)
4. Tente login novamente

### Problema: Não sei qual é meu projeto Supabase
**Solução**:
1. Verifique o arquivo `.env` ou `.env.local` na raiz do projeto
2. Procure por `VITE_SUPABASE_URL`
3. A URL mostra o nome do projeto

---

## 📞 Debugging Adicional

Se após executar o script o login ainda falhar, execute estas queries no SQL Editor para diagnóstico:

### 1. Verificar quantos usuários existem
```sql
SELECT COUNT(*) FROM auth.users;
```

### 2. Verificar se seu usuário está na tabela users
```sql
SELECT * FROM public.users WHERE email = 'admin@teste.com';
```

### 3. Verificar se as políticas foram criadas
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

Você deve ver 5 políticas:
- ✅ Administrators can delete users
- ✅ Administrators can insert users
- ✅ Administrators can update all users
- ✅ Users can update own profile
- ✅ Users can view based on role

---

## 🎯 Por Que Isso Resolve o Login?

O fluxo de login funciona assim:

```
1. Você digita email/senha
   ↓
2. Supabase Auth valida credenciais ✅
   ↓
3. Sistema tenta buscar perfil na tabela 'users'
   ↓
4. RLS verifica se você tem permissão ← AQUI ESTAVA BLOQUEANDO ❌
   ↓
5. Com política corrigida, RLS permite acesso ✅
   ↓
6. Perfil carrega com sucesso
   ↓
7. Login completo! 🎉
```

---

## 📝 Resumo Ultra Rápido

1. Abra **Supabase Studio** → **SQL Editor**
2. Cole o conteúdo de **`FIX_USER_CLASS_DROPDOWNS.sql`**
3. Clique em **Run**
4. Recarregue a aplicação
5. **Faça login**

**Tempo total**: 2-3 minutos

---

**Arquivo do script**:
```
c:\Users\Yoda\Downloads\app.everest\database\FIX_USER_CLASS_DROPDOWNS.sql
```

**Documentação completa**:
```
c:\Users\Yoda\Downloads\app.everest\database\SOLUCAO_DROPDOWNS_VAZIOS.md
```
