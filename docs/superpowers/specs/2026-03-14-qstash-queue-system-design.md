# QStash Queue System - Design Spec

**Date:** 2026-03-14
**Status:** Approved
**Goal:** Implementar sistema de filas async com QStash (Upstash) + Vercel API Routes para correcao de redacao por IA e envio de emails automaticos, com circuit breaker no Gemini AI.

---

## Arquitetura

```
Frontend → Supabase (insere job na tabela) → API Route /api/queue/publish → QStash
                                                                              ↓
QStash chama de volta → API Route /api/queue/handler → Processa job → Atualiza Supabase
```

## Infra

- **Upstash QStash** - fila serverless (free tier: 500 msg/dia)
- **Vercel API Routes** - pasta `api/` no projeto (ja incluso no deploy)
- **Supabase** - tabela `job_queue` pra tracking de status

## Banco de dados

**Nova tabela `job_queue`:**

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | uuid | PK, gen_random_uuid() |
| `type` | text | NOT NULL: 'essay-correction', 'send-email' |
| `status` | text | NOT NULL DEFAULT 'pending': 'pending', 'processing', 'completed', 'failed' |
| `payload` | jsonb | NOT NULL, dados do job |
| `result` | jsonb | Resultado ou mensagem de erro |
| `attempts` | int | DEFAULT 0, tentativas feitas |
| `max_attempts` | int | DEFAULT 3 |
| `created_by` | uuid | FK auth.users, quem criou o job |
| `created_at` | timestamptz | DEFAULT now() |
| `started_at` | timestamptz | Quando comecou a processar |
| `completed_at` | timestamptz | Quando terminou |

## Jobs

### 1. essay-correction

**Trigger:** Aluno submete redacao (status muda pra 'submitted')
**Payload:**
```json
{
  "essay_id": "uuid",
  "student_id": "uuid",
  "prompt_id": "uuid",
  "submission_text": "texto da redacao"
}
```
**Handler:**
1. Seta status = 'processing'
2. Chama Gemini AI com o prompt de correcao CIAAR
3. Se sucesso: salva correcao no essay, seta status = 'completed'
4. Se falha: incrementa attempts, se < max_attempts reagenda, senao seta status = 'failed'

**Impacto no frontend:**
- Pagina de redacao mostra "Corrigindo sua redacao..." com spinner
- Polling a cada 5s no status do job ate completar
- Quando completa, mostra a correcao

### 2. send-email

**Trigger:** Eventos do sistema (matricula, convite, boas-vindas)
**Payload:**
```json
{
  "to": "email@aluno.com",
  "template": "welcome|enrollment|invite",
  "data": {
    "name": "Nome do aluno",
    "course_name": "Extensivo EAOF",
    "login_url": "https://app..."
  }
}
```
**Handler:**
1. Seta status = 'processing'
2. Renderiza template de email
3. Envia via Resend API (ou SMTP)
4. Se sucesso: seta status = 'completed'
5. Se falha: retry com backoff

**Templates iniciais:**
- `welcome` - Boas vindas ao novo aluno
- `enrollment` - Conteudo liberado (matricula em nova turma)
- `invite` - Conta criada via convite

## Circuit Breaker

**Objetivo:** Se Gemini AI falhar 3x seguidas, para de enviar jobs e notifica admin.

**Implementacao:**
- Tabela `circuit_breaker_state` ou campo no `system_settings`:
  ```
  service: 'gemini-ai'
  state: 'closed' | 'open' | 'half-open'
  failure_count: int
  last_failure_at: timestamptz
  opened_at: timestamptz
  ```
- **closed** (normal): jobs sao processados normalmente
- **open** (falha): jobs nao sao enviados, ficam pending, admin e notificado
- **half-open** (testando): 1 job e enviado pra testar se voltou

**Transicoes:**
- closed → open: 3 falhas consecutivas
- open → half-open: apos 5 minutos automaticamente
- half-open → closed: 1 sucesso
- half-open → open: 1 falha

**Notificacao ao admin:**
- Toast/notificacao no painel admin: "Correcao de redacoes pausada - Gemini AI indisponivel"
- Badge vermelho no sidebar

## Vercel API Routes

### `api/queue/publish.ts`
- Recebe job do frontend
- Valida payload
- Insere na tabela `job_queue`
- Publica no QStash apontando pra `/api/queue/handler`
- Retorna job_id

### `api/queue/handler.ts`
- Recebida pelo QStash (webhook)
- Verifica assinatura QStash (seguranca)
- Le o job da tabela
- Checa circuit breaker (se essay-correction)
- Processa conforme o type
- Atualiza status na tabela

### `api/queue/status.ts`
- Frontend faz polling pra saber status do job
- GET /api/queue/status?jobId=xxx
- Retorna { status, result }

## Service no frontend

**`src/services/queueService.ts`:**
```typescript
publishJob(type: string, payload: object): Promise<string> // retorna job_id
getJobStatus(jobId: string): Promise<{ status, result }>
pollJobUntilDone(jobId: string, interval: number): Promise<result>
```

## Hook no frontend

**`src/hooks/useJobStatus.ts`:**
```typescript
useJobStatus(jobId: string | null): {
  status: 'pending' | 'processing' | 'completed' | 'failed' | null
  result: any
  loading: boolean
}
```
Faz polling automatico a cada 5s enquanto status != completed/failed.

## Integracao com sistema existente

### Redacao (src/pages/Essays.tsx / EssaySubmission)
- Ao submeter redacao, chama `publishJob('essay-correction', { essay_id, ... })`
- Recebe `jobId`, mostra status de correcao
- Quando completa, redireciona pra pagina de detalhes

### Convites (src/services/inviteService.ts)
- Ao registrar via convite, chama `publishJob('send-email', { to, template: 'invite', ... })`

### Matricula (src/services/adminUserService.ts)
- Ao matricular aluno, chama `publishJob('send-email', { to, template: 'enrollment', ... })`

## Configuracao Upstash

Variaveis de ambiente (Vercel):
```
QSTASH_TOKEN=xxx
QSTASH_CURRENT_SIGNING_KEY=xxx
QSTASH_NEXT_SIGNING_KEY=xxx
UPSTASH_REDIS_REST_URL=xxx (opcional, pro circuit breaker)
UPSTASH_REDIS_REST_TOKEN=xxx (opcional)
```
