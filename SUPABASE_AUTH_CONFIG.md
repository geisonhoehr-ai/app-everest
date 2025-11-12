# Configuração do Supabase Authentication

Este documento fornece um guia passo a passo para configurar corretamente o Supabase Authentication na plataforma Everest antes de liberar para os alunos.

## 📋 Índice

1. [Configurações Essenciais](#configurações-essenciais)
2. [Verificação de Email](#verificação-de-email)
3. [Recuperação de Senha](#recuperação-de-senha)
4. [URLs de Redirecionamento](#urls-de-redirecionamento)
5. [Turma de Degustação Automática](#turma-de-degustação-automática)
6. [Templates de Email](#templates-de-email)
7. [Checklist Pré-Lançamento](#checklist-pré-lançamento)

---

## Configurações Essenciais

### 1. Acessar o Painel do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto Everest
3. Vá em **Authentication** → **Settings**

### 2. Configurar Email Provider

Por padrão, o Supabase usa seu próprio serviço de email (limitado a 3 emails/hora em desenvolvimento).

**Para Produção:**

1. Vá em **Authentication** → **Email Templates** → **SMTP Settings**
2. Configure um provedor de email (recomendado: SendGrid, Resend, ou Amazon SES)

**Exemplo com SendGrid:**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [Sua API Key do SendGrid]
Sender email: noreply@everest.app
Sender name: Plataforma Everest
```

---

## Verificação de Email

### Por que Ativar?

- Previne cadastros com emails falsos
- Garante que você pode contactar o aluno
- Aumenta a segurança da plataforma

### Como Ativar

1. Acesse **Authentication** → **Providers** → **Email**
2. Em **Email Confirmations**:
   - ✅ **Ative** "Confirm email"
   - Configure "Confirmation URL": `https://seu-dominio.com/auth/confirm` (ou `http://localhost:5173/auth/confirm` para desenvolvimento)

### Estados do Usuário

Quando ativado:
- **Cadastro**: Usuário recebe email com link de confirmação
- **Antes de confirmar**: Usuário NÃO consegue fazer login
- **Após confirmar**: Usuário pode fazer login normalmente

### Durante Desenvolvimento (APENAS PARA TESTES)

Se você quiser DESATIVAR temporariamente para facilitar testes:

1. Vá em **Authentication** → **Providers** → **Email**
2. **Desmarque** "Confirm email"
3. ⚠️ **IMPORTANTE**: REATIVE antes de liberar para alunos!

---

## Recuperação de Senha

### Configuração

1. Acesse **Authentication** → **Email Templates**
2. Selecione "Reset Password"
3. Configure a URL de redirecionamento:
   - **Produção**: `https://seu-dominio.com/reset-password`
   - **Desenvolvimento**: `http://localhost:5173/reset-password`

### Fluxo Completo

1. Aluno clica em "Esqueci minha senha" ([/forgot-password](src/pages/ForgotPassword.tsx))
2. Aluno digita seu email
3. Sistema envia email com link de recuperação
4. Aluno clica no link do email
5. Aluno é redirecionado para [/reset-password](src/pages/ResetPassword.tsx)
6. Aluno define nova senha
7. Aluno é redirecionado para /login

### Personalizar Template de Email

```html
<h2>Recuperar Senha - Everest</h2>
<p>Olá,</p>
<p>Recebemos uma solicitação para redefinir sua senha.</p>
<p>Clique no link abaixo para criar uma nova senha:</p>
<p><a href="{{ .ConfirmationURL }}">Redefinir Senha</a></p>
<p>Se você não solicitou esta alteração, ignore este email.</p>
<p>Este link expira em 1 hora.</p>
<br>
<p>Equipe Everest</p>
```

---

## URLs de Redirecionamento

### Site URL (Produção)

1. Acesse **Authentication** → **Settings** → **URL Configuration**
2. Configure:
   ```
   Site URL: https://seu-dominio.com
   ```

### Redirect URLs (Permitidas)

Adicione TODAS as URLs que a plataforma pode redirecionar:

```
http://localhost:5173/*
http://localhost:5173/auth/confirm
http://localhost:5173/reset-password
https://seu-dominio.com/*
https://seu-dominio.com/auth/confirm
https://seu-dominio.com/reset-password
```

---

## Turma de Degustação Automática

### O que é?

Todo aluno que se cadastrar será AUTOMATICAMENTE adicionado à turma "Degustação". Isso permite que você:

1. Verifique o email do aluno
2. Confirme que ele é um aluno real
3. Mova manualmente para a turma correta

### Implementação

Já está implementado! A migration [20251019000001_create_tasting_class_auto_assignment.sql](supabase/migrations/20251019000001_create_tasting_class_auto_assignment.sql) cria:

1. **Turma "Degustação"** (se não existir)
2. **Function** que adiciona alunos automaticamente
3. **Trigger** que executa após INSERT na tabela users

### Como Executar a Migration

```bash
# Conectar ao Supabase
npx supabase link --project-ref SEU_PROJECT_REF

# Executar migration
npx supabase db push
```

Ou executar manualmente no SQL Editor do Supabase:

1. Acesse **SQL Editor** no dashboard
2. Cole o conteúdo da migration
3. Execute

### Como Mover Alunos Para Turma Definitiva

1. Vá em **Admin** → **Turmas** → **Degustação**
2. Veja lista de alunos
3. Verifique o email de cada aluno
4. Clique em "Mover para outra turma"
5. Selecione a turma correta

---

## Templates de Email

### Emails que o Supabase Envia

1. **Confirmation** - Confirmação de cadastro
2. **Reset Password** - Recuperação de senha
3. **Magic Link** - Login sem senha (se ativado)
4. **Email Change** - Confirmação de troca de email

### Personalizar Todos os Templates

1. Acesse **Authentication** → **Email Templates**
2. Para cada template, personalize:
   - **Subject**: Assunto do email
   - **Body**: Corpo HTML do email
   - Use variáveis: `{{ .Email }}`, `{{ .ConfirmationURL }}`, etc.

### Template Recomendado - Confirmação de Email

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0;">Bem-vindo ao Everest!</h1>
    </div>

    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
      <p>Olá!</p>

      <p>Obrigado por se cadastrar na Plataforma Everest.</p>

      <p>Para confirmar seu email e ativar sua conta, clique no botão abaixo:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}"
           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 15px 40px;
                  text-decoration: none;
                  border-radius: 5px;
                  display: inline-block;
                  font-weight: bold;">
          Confirmar Email
        </a>
      </div>

      <p style="font-size: 12px; color: #666;">
        Se você não se cadastrou na Plataforma Everest, ignore este email.
      </p>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

      <p style="font-size: 12px; color: #666; text-align: center;">
        © 2025 Plataforma Everest. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>
```

---

## Checklist Pré-Lançamento

### Segurança ✅

- [ ] Verificação de email ATIVADA
- [ ] RLS policies aplicadas ([20251019000000_add_admin_rls_policies.sql](supabase/migrations/20251019000000_add_admin_rls_policies.sql))
- [ ] Migration de turma de degustação executada
- [ ] Senhas com mínimo 6 caracteres (já configurado em [Register.tsx](src/pages/Register.tsx:37))

### Authentication ✅

- [ ] Email provider configurado (SendGrid/Resend/SES)
- [ ] Template de confirmação personalizado
- [ ] Template de recuperação de senha personalizado
- [ ] URL de produção configurada
- [ ] Redirect URLs configuradas

### Páginas ✅

- [ ] [Login](src/pages/Login.tsx) - Funcionando com link "Esqueci minha senha"
- [ ] [Register](src/pages/Register.tsx) - Funcionando com validação
- [ ] [Forgot Password](src/pages/ForgotPassword.tsx) - Funcionando
- [ ] [Reset Password](src/pages/ResetPassword.tsx) - Funcionando
- [ ] [Contact](src/pages/Contact.tsx) - Funcionando

### Funcionalidades ✅

- [ ] Offline mode implementado para flashcards e quizzes
- [ ] Indicador visual de status offline ([OfflineIndicator.tsx](src/components/ui/OfflineIndicator.tsx))
- [ ] Sincronização automática quando voltar online
- [ ] Responsividade mobile testada

### Testes Recomendados ✅

#### Teste 1: Cadastro Completo
1. Ir para `/register`
2. Criar conta com email válido
3. Verificar se recebeu email de confirmação
4. Clicar no link de confirmação
5. Verificar se consegue fazer login
6. Verificar se está na turma "Degustação"

#### Teste 2: Recuperação de Senha
1. Ir para `/login`
2. Clicar em "Esqueci minha senha"
3. Digitar email cadastrado
4. Verificar se recebeu email
5. Clicar no link do email
6. Definir nova senha
7. Tentar fazer login com nova senha

#### Teste 3: Turma de Degustação
1. Cadastrar novo aluno
2. Ir em Admin → Turmas → Degustação
3. Verificar se aluno aparece na lista
4. Mover aluno para turma definitiva
5. Verificar se aluno sumiu da Degustação

#### Teste 4: Offline Mode
1. Acessar página de flashcards
2. Desativar internet
3. Verificar indicador offline aparecendo
4. Estudar flashcards offline
5. Reativar internet
6. Verificar sincronização automática

---

## Comandos Úteis

### Verificar Status do Supabase

```bash
npx supabase status
```

### Executar Migrations

```bash
# Verificar migrations pendentes
npx supabase migration list

# Executar todas
npx supabase db push

# Executar migration específica
npx supabase db push -f supabase/migrations/20251019000001_create_tasting_class_auto_assignment.sql
```

### Ver Logs do Supabase

```bash
npx supabase functions logs
```

---

## Suporte

Se encontrar problemas:

1. **Documentação Supabase**: https://supabase.com/docs/guides/auth
2. **Discord da Comunidade**: https://discord.supabase.com
3. **GitHub Issues**: https://github.com/supabase/supabase/issues

---

## Próximos Passos Após Configuração

1. ✅ Executar todas as migrations
2. ✅ Configurar SMTP provider
3. ✅ Ativar verificação de email
4. ✅ Testar fluxo completo de cadastro
5. ✅ Testar recuperação de senha
6. ✅ Verificar turma de degustação funcionando
7. ✅ Fazer deploy em produção
8. ✅ Configurar domínio personalizado
9. ✅ Convidar primeiros alunos beta
10. ✅ Liberar para todos os alunos

---

**Data desta documentação**: 19 de Outubro de 2025
**Autor**: Sistema Everest
**Versão**: 1.0
