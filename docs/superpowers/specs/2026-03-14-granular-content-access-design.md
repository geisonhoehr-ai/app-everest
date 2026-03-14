# Granular Content Access Control - Design Spec

**Date:** 2026-03-14
**Status:** Approved
**Goal:** Controle de acesso granular por turma para flashcards, quizzes, acervo, simulados, redacao e comunidade - permitindo criar turmas de degustacao/trial com conteudo parcial.

---

## Database

**Nova tabela `class_content_access`:**

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | uuid | PK, gen_random_uuid() |
| `class_id` | uuid | FK para classes ON DELETE CASCADE |
| `content_type` | text | NOT NULL, tipo do conteudo |
| `content_id` | text | NOT NULL, ID do item liberado |
| `created_at` | timestamptz | DEFAULT now() |
| UNIQUE | | (class_id, content_type, content_id) |

**content_type enum:**
- `flashcard_topic` - content_id = topics.id (uuid)
- `quiz_topic` - content_id = topics.id (uuid)
- `acervo_category` - content_id = categoria string ('prova', 'livro', 'apostila', 'exercicio', 'regulamento', 'mapa_mental')
- `acervo_concurso` - content_id = concurso string ('EAOF', 'EAOP', 'CAMAR', 'CADAR', 'CAFAR', 'CFOE')
- `simulation` - content_id = quizzes.id (uuid) where type='simulation'
- `essay_limit` - content_id = numero maximo de envios (ex: '1', '3')
- `community_readonly` - content_id = 'true'

**Regra fundamental:** Ausencia de registros para um content_type = tudo liberado (comportamento atual). Presenca de pelo menos 1 registro = modo restrito, so os IDs listados sao acessiveis.

**Excecoes:**
- `essay_limit`: nao filtra itens, limita quantidade de submissoes. Conta essays com status != 'draft' do usuario.
- `community_readonly`: nao filtra conteudo, desabilita criacao de posts e comentarios.

## Service: contentAccessService.ts

```typescript
getContentAccess(classId: string, contentType: string): Promise<string[]>
getAllContentAccessForClass(classId: string): Promise<Record<string, string[]>>
saveContentAccess(classId: string, contentType: string, contentIds: string[]): Promise<void>
```

`saveContentAccess`: deleta registros existentes do content_type pra classe, insere novos. Se array vazio = libera tudo (deleta registros).

## Hook: useContentAccess

```typescript
useContentAccess(contentType: string): {
  isRestricted: boolean
  allowedIds: string[]
  isAllowed: (id: string) => boolean
  loading: boolean
}
```

- Busca class_id do usuario via student_classes
- Se usuario tem is_unlimited_access = true, retorna sempre nao restrito
- Se nao ha registros pra o content_type = nao restrito
- Cache via useState com 5 min staleTime

## Impacto nas paginas do aluno

### Flashcards (src/pages/Flashcards.tsx, FlashcardTopics.tsx)
- Usa `useContentAccess('flashcard_topic')`
- Se `isRestricted`: topics nao permitidos aparecem com Lock icon, opacity-50, click mostra toast "Adquira o acesso completo"
- Topics permitidos funcionam normalmente

### Quizzes (src/pages/Quizzes.tsx, QuizTopics.tsx)
- Usa `useContentAccess('quiz_topic')`
- Mesma logica dos flashcards

### Acervo Digital (src/pages/AcervoDigital.tsx)
- Usa `useContentAccess('acervo_category')` e `useContentAccess('acervo_concurso')`
- Categorias/concursos nao permitidos aparecem com cadeado
- Items dentro de categorias bloqueadas nao sao acessiveis

### Simulados (src/pages/Simulations.tsx)
- Usa `useContentAccess('simulation')`
- Simulados nao permitidos aparecem na lista com cadeado e "Bloqueado"

### Redacao (src/pages/Essays.tsx)
- Usa `useContentAccess('essay_limit')`
- Se restrito: conta submissoes do usuario (status != 'draft')
- Se >= limite: botao "Nova Redacao" desabilitado + mensagem "Voce atingiu o limite de X redacoes"

### Comunidade (src/pages/community/CommunityPage.tsx, SpaceFeedPage.tsx)
- Usa `useContentAccess('community_readonly')`
- Se restrito: esconde botao "Novo Post", desabilita campo de comentario
- Aluno ve todo o conteudo normalmente, so nao pode interagir

## Admin UI (AdminClassFormPage)

Novas secoes apos regras de modulo, dentro de um Card "Acesso ao Conteudo":

### Flashcards Liberados
- Toggle "Todos os topicos" (default on)
- Se off: lista de checkboxes com todos os topics (agrupados por subject)
- Fetch: `SELECT id, name, subject_id FROM topics` + `SELECT id, name FROM subjects`

### Quizzes Liberados
- Mesma estrutura dos flashcards (usa mesma tabela topics)

### Acervo Digital Liberado
- Toggle "Todo o acervo" (default on)
- Se off: checkboxes de categorias ('prova', 'livro', etc) + checkboxes de concursos ('EAOF', 'EEAR', etc)

### Simulados Liberados
- Toggle "Todos os simulados" (default on)
- Se off: checkboxes com simulados disponiveis
- Fetch: `SELECT id, title FROM quizzes WHERE type = 'simulation'`

### Limite de Redacoes
- Toggle "Ilimitado" (default on)
- Se off: input numerico "Maximo de envios"

### Comunidade
- Toggle "Acesso completo" (default on)
- Se off: "Somente leitura - aluno pode ver posts mas nao pode criar ou comentar"

### Salvamento
Ao salvar a turma, chama `saveContentAccess()` pra cada content_type que foi modificado.
