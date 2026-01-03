# Plano de Migração de Segurança: Movendo Chaves Sensíveis para o Backend

## Objetivo
Eliminar a exposição de chaves de API sensíveis (Dify AI, PandaVideo, Memberkit) no código do lado do cliente e no `localStorage`. Mover todas as interações de API de terceiros para Supabase Edge Functions seguras.

## Risco Atual
- **Crítico**: As chaves de API estão armazenadas no `localStorage` e são enviadas via requisições de rede do lado do cliente.
- **Impacto**: Usuários maliciosos podem extrair chaves e abusar das cotas ou acessar dados sensíveis nas contas Dify/PandaVideo/Memberkit.

## Passos da Migração

### 1. Configuração das Supabase Edge Functions
- Inicializar Supabase Edge Functions no projeto.
- Criar funções específicas para cada integração:
  - `functions/dify-proxy`
  - `functions/panda-proxy`
  - `functions/memberkit-proxy`

### 2. Gerenciamento de Segredos
- **NÃO** deixe chaves fixas (hardcoded) nas Edge Functions.
- Use **Supabase Secrets** para armazenar chaves de API com segurança.
  - `DIFY_API_KEY`
  - `PANDA_VIDEO_API_KEY`
  - `MEMBERKIT_API_KEY`
- Comando para definir segredos:
  ```bash
  supabase secrets set DIFY_API_KEY=sua_chave_aqui
  ```

### 3. Implementação das Edge Functions

#### Dify Proxy (`functions/dify-proxy/index.ts`)
- **Endpoints**:
  - `POST /chat-messages` (para chat)
  - `POST /completion-messages` (para geração de texto/correção de redação)
- **Lógica**:
  - Verificar Supabase Auth JWT (garantir que o usuário esteja logado).
  - Repassar a requisição para `https://api.dify.ai/v1/...`.
  - Injetar o cabeçalho `Authorization: Bearer <DIFY_API_KEY>` a partir dos segredos.
  - Retornar a resposta para o cliente.

#### PandaVideo Proxy (`functions/panda-proxy/index.ts`)
- **Endpoints**:
  - `GET /videos/:id` (para obter detalhes do vídeo/URL HLS)
- **Lógica**:
  - Verificar Papel do Usuário (ex: deve ser 'aluno' ou 'admin').
  - Chamar API da PandaVideo.
  - Retornar URL assinada ou detalhes do vídeo.

### 4. Refatoração do Frontend

#### `src/services/difyService.ts`
- Remover argumento `api_key` das funções.
- Alterar `fetch('https://api.dify.ai/v1/...')` para `supabase.functions.invoke('dify-proxy', ...)`
- Remover lógica de `localStorage` para 'dify_api_key'.

#### `src/services/essayCorrectionService.ts`
- Atualizar para usar o novo `difyService` que chama a Edge Function.

#### `src/hooks/use-integrations.tsx`
- Remover lógica que salva chaves de API no `localStorage`.
- Simplificar para verificar apenas se o "Serviço está Ativado" (via configuração pública ou presumido como ligado).

### 5. Limpeza
- Limpar `localStorage` no navegador para usuários existentes (opcional).
- Remover variáveis de ambiente prefixadas com `VITE_` que contenham esses segredos (se houver).

## Cronograma
- **Fase 1**: Criar Edge Functions & Secrets (Backend).
- **Fase 2**: Refatorar `difyService` (Frontend).
- **Fase 3**: Refatorar `pandaVideoService` (Frontend).
- **Fase 4**: Auditoria de Segurança (Verificar que não há chaves na aba de rede).
