# Guia de Deploy na Vercel - Projeto app.everest

## Configuração das Variáveis de Ambiente

Após fazer o deploy na Vercel, você precisa configurar as variáveis de ambiente no painel da Vercel:

### 1. Acesse o Painel da Vercel
1. Vá para [vercel.com](https://vercel.com)
2. Acesse o projeto **app.everest**
3. Vá em **Settings** > **Environment Variables**

### 2. Configure as Variáveis
Adicione as seguintes variáveis de ambiente:

```
VITE_SUPABASE_URL=https://hnhzindsfuqnaxosujay.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuaHppbmRzZnVxbmF4b3N1amF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzU5NTIsImV4cCI6MjA2ODUxMTk1Mn0.cT7fe1wjee9HfZw_IVD7K_exMqu-LtUxiClCD-sDLyU
NODE_ENV=production
```

### 3. Configurações do Supabase
No painel do Supabase, certifique-se de que:

1. **Authentication > URL Configuration:**
   - Site URL: `https://app.everestpreparatorios.com.br`
   - Redirect URLs: `https://app.everestpreparatorios.com.br/**`

2. **API > CORS:**
   - Adicione: `https://app.everestpreparatorios.com.br`

### 4. Redeploy
Após configurar as variáveis:
1. Vá em **Deployments**
2. Clique nos três pontos do último deploy
3. Selecione **Redeploy**

## Solução de Problemas

### Erro 404 em Rotas Internas
Se você está vendo erro 404 ao acessar `/login`, `/dashboard`, etc.:

1. **Verifique o `vercel.json`** - Deve estar na raiz do projeto
2. **Redeploy completo** - Faça um novo deploy após as correções
3. **Teste o roteamento** - Acesse `https://app.everestpreparatorios.com.br` primeiro, depois navegue internamente

### Erro de Conexão
Se ainda aparecer "Erro de Conexão":
1. Verifique se as variáveis estão configuradas corretamente
2. Aguarde alguns minutos para o cache da Vercel atualizar
3. Teste em uma aba anônima

### Timeout de Autenticação
O código foi otimizado para:
- Aumentar timeouts de 3s para 8s
- Aumentar tentativas de 3 para 5
- Melhorar backoff exponencial

### Problemas de Rota
O arquivo `vercel.json` foi criado para resolver problemas de SPA (Single Page Application).
Também foi criado um arquivo `public/_redirects` como fallback.

## Verificação
Após o redeploy, o site deve:
1. Carregar sem erros de conexão
2. Permitir login/logout
3. Navegar entre páginas sem problemas
