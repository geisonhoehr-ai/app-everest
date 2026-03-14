# Admin Management Improvements - Design Spec

**Date:** 2026-03-14
**Status:** Approved
**Goal:** Melhorar o gerenciamento admin de Cursos, Turmas, Alunos e criar sistema de Convites, inspirado no MemberKit, preparando a plataforma para futuro SaaS.

---

## Overview

4 areas independentes de melhoria no painel administrativo:

- **A - Cursos**: Editor completo com capa, layout, vitrine, onboarding
- **B - Turmas**: Regras de liberacao de modulos/aulas por turma
- **C - Alunos**: Gestao completa com perfil, matriculas, ban/block
- **D - Convites**: Landing pages publicas de captacao com tracking

Ordem de implementacao: A → B → C → D (cada area depende da anterior).

---

## A - Gerenciamento de Cursos Melhorado

### Mudancas no banco de dados

**Alterar tabela `video_courses`** - adicionar colunas:

| Coluna | Tipo | Default | Descricao |
|--------|------|---------|-----------|
| `acronym` | text | null | Sigla curta (ex: "EAOF") |
| `sales_url` | text | null | Link externo pra pagina de vendas (Kiwify/Hotmart) |
| `category` | text | 'Meus Cursos' | Categoria na vitrine |
| `layout_preference` | text | 'simple_list' | 'simple_list' ou 'module_covers' |
| `show_in_storefront` | boolean | false | Mostrar na vitrine pra alunos nao matriculados |
| `moderate_comments` | boolean | false | Comentarios precisam de aprovacao |
| `onboarding_text` | text | null | Rich text de boas-vindas pos-matricula |
| `status` | text | 'draft' | 'published', 'draft', 'coming_soon' |

**Supabase Storage:** Criar bucket `course-covers` para upload de imagens de capa.

**Migracao `is_active`:** Manter coluna `is_active` como computed/derivada durante transicao. Na migration: `UPDATE video_courses SET status = 'published' WHERE is_active = true; UPDATE video_courses SET status = 'draft' WHERE is_active = false;`. Depois de validar, remover `is_active` em migration futura. A funcao `duplicateCourse()` deve copiar todas as novas colunas.

**Storage bucket `course-covers`:** Acesso de upload restrito a roles admin/teacher (RLS authenticated + role check). Leitura publica pra exibir capas. Imagens orfas limpas via cron ou ao deletar curso.

**Onboarding text:** Armazenado como HTML sanitizado (DOMPurify no render). Editor: textarea simples com markdown ou TipTap se ja existir no projeto.

### Paginas modificadas

#### AdminCourseFormPage (`/admin/courses/new`, `/admin/courses/:courseId/edit`)

Formulario reorganizado em secoes:

**Secao 1 - Detalhes do Curso:**
- Nome do curso (text, required, min 3 chars)
- Sigla (text, max 10 chars) - ao lado do nome
- URL da pagina de vendas (text, URL format)
- Descricao/Promessa do curso (textarea, rich text)
- Categoria na vitrine (dropdown: "Meus Cursos", "Preparatorios", "Bonus", "Extras")

**Secao 2 - Preferencia de Layout:**
- Radio visual: "Listas simples" vs "Capas em modulos"
- Preview wireframe de cada opcao (imagem estatica)

**Secao 3 - Imagem de Capa:**
- Upload via Supabase Storage (drag & drop ou click)
- Preview da imagem carregada
- Recomendacao: "430x215px ou 300x420 para posters verticais"

**Secao 4 - Configuracoes:**
- Toggle "Mostrar curso na vitrine de todos os alunos"
  - Subtitle: "Incentive a compra para alunos ainda nao matriculados"
- Toggle "Ativar moderacao de comentarios"
  - Subtitle: "Revise manualmente todos os comentarios antes da publicacao"

**Secao 5 - Onboarding:**
- Rich text editor (toolbar basica: B, I, U, link, lista)
- Descricao: "Texto de agradecimento pos-matricula ou termos de uso"

**Footer:**
- Botoes: "Excluir curso" (vermelho, esquerda), "Duplicar curso" (outline, esquerda)
- "Cancelar" e "Salvar" (direita)

**Status:** Dropdown no header - "Publicado" / "Rascunho" / "Em Breve"

#### AdminCoursesPage (`/admin/courses`)

- Manter tabela mas adicionar coluna de thumbnail (imagem pequena 48x48 a esquerda do nome)
- Badge de status colorido: verde (Publicado), cinza (Rascunho), laranja (Em Breve)
- Coluna "Vitrine" com icone de olho se `show_in_storefront = true`

### Vitrine de Cursos (visao do aluno)

#### MyCoursesPage (`/courses`) - modificada

Duas secoes:

**1. Meus Cursos** (cursos matriculados - como ja funciona)
- Cards com progresso, continuar assistindo, etc.

**2. Outros Cursos Disponiveis** (novo)
- Mostra cursos com `show_in_storefront = true` E aluno NAO matriculado
- Card mostra: capa, nome + sigla, descricao curta, icone de cadeado, contagem modulos/aulas
- Clique leva pra `CourseDetailPage` em modo vitrine

#### CourseDetailPage (`/courses/:courseId`) - modo vitrine

Quando aluno NAO esta matriculado:
- Banner no topo: capa do curso + descricao/promessa + botao "Adquirir este curso" (link pra `sales_url`, abre nova aba)
- Lista de modulos visivel com cadeado em cada um
- Contagem total de aulas e duracao estimada visivel
- Aulas com `is_preview = true` ficam acessiveis (degustacao)
- Ao clicar em modulo/aula trancada: toast "Adquira o curso para acessar este conteudo"

---

## B - Turmas com Regras de Liberacao

### Mudancas no banco de dados

**Nova tabela `class_module_rules`:**

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | uuid | PK |
| `class_id` | uuid | FK para classes |
| `module_id` | uuid | FK para video_modules |
| `rule_type` | text | Enum: 'free', 'scheduled_date', 'days_after_enrollment', 'hidden', 'blocked', 'module_completed' |
| `rule_value` | text | Valor contextual: data ISO, numero de dias, ou module_id |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| UNIQUE | | (class_id, module_id) |

**Nova tabela `class_lesson_rules`:**

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | uuid | PK |
| `class_id` | uuid | FK para classes |
| `lesson_id` | uuid | FK para video_lessons |
| `rule_type` | text | Mesmo enum que class_module_rules |
| `rule_value` | text | Valor contextual |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| UNIQUE | | (class_id, lesson_id) |

**Alterar tabela `classes`:**

| Coluna | Tipo | Default | Descricao |
|--------|------|---------|-----------|
| `access_duration_days` | int | null | Prazo de acesso em dias a partir da matricula |
| `is_default` | boolean | false | Turma padrao pra novos membros |

### Paginas modificadas

#### AdminClassFormPage (`/admin/classes/:classId/edit`)

Adicionar abaixo dos campos existentes:

**Secao - Prazo de Acesso:**
- Campo "Prazo de acesso" (input numerico + "dias")
- Descricao: "Ao matricular um aluno, o acesso expira apos esse prazo"

**Secao - Turma Padrao:**
- Checkbox "Turma padrao - Ingressar membros com acesso ilimitado nesta turma"

**Secao - Regras de Liberacao de Modulos:**
- Lista todos os modulos dos cursos vinculados (via `class_courses`)
- Cada modulo: nome a esquerda, dropdown de regra a direita
- Ao selecionar regra com valor (data, dias, modulo), mostra campo adicional inline
- Default: "Acesso Livre" pra todos

**Secao - Regras de Liberacao de Aulas (opcional):**
- Descricao: "Programe aulas especificas quando as regras de modulos nao forem aplicaveis"
- Dropdown pra selecionar aula + botao "Adicionar"
- Lista de regras individuais por aula

#### AdminClassesPage (`/admin/classes`)

Mudar de tabela pura pra lista com thumbnail:
- Imagem do curso (thumbnail do `video_courses` vinculado) a esquerda
- Nome da turma + nome do curso
- Membros (contador)
- Comentarios (contador)
- Progresso % (barra)
- Status badge

### Impacto no lado do aluno

**CourseDetailPage:**
- Consulta `class_module_rules` da turma do aluno
- Modulo `hidden` → nao renderiza
- Modulo `blocked` → mostra com cadeado + mensagem
- Modulo `scheduled_date` → mostra com cadeado + "Disponivel em DD/MM/YYYY"
- Modulo `days_after_enrollment` → calcula data com base em `student_classes.enrollment_date`
- Modulo `module_completed` → verifica progresso do modulo prerequisito

**LessonPlayerPage:**
- Mesma logica pra `class_lesson_rules`
- Se aula bloqueada e acessada via URL direta, redireciona pra pagina do curso com toast

**Hook `useModuleAccess(classId, moduleId)`:**
- Retorna `{ isAccessible, rule, message, unlockDate }`
- Centraliza toda a logica de verificacao
- Usa React Query com cache de 5min (staleTime)
- Se usuario tem `is_unlimited_access = true`, retorna sempre `{ isAccessible: true }`
- "Modulo concluido" = 100% das aulas marcadas como concluidas (tabela `lesson_progress`)
- Validacao no admin: nao permitir dependencia circular (A depende de B que depende de A)

**Hook `useLessonAccess(classId, lessonId)`:**
- Mesma interface, verifica primeiro regra da aula, fallback pra regra do modulo
- Mesmo cache e override de `is_unlimited_access`

**Classes existentes sem regras:** Comportamento padrao = `'free'` (acesso livre). Nao precisa criar registros - ausencia de regra = livre. So cria registro quando admin define regra diferente.

**Expiracao de acesso:** `student_classes.subscription_expires_at` e verificado no hook. Se `enrollment_date + access_duration_days < now()`, acesso negado com mensagem "Seu acesso expirou". RLS policy tambem filtra enrollments expirados.

---

## C - Gestao de Alunos Completa

### Mudancas no banco de dados

**Alterar tabela `users`:**

| Coluna | Tipo | Default | Descricao |
|--------|------|---------|-----------|
| `phone` | text | null | Telefone com DDD |
| `cpf_cnpj` | text | null | Documento |
| `is_banned` | boolean | false | Impede acesso a plataforma |
| `is_unlimited_access` | boolean | false | Libera todos os conteudos |
| `last_seen_at` | timestamptz | null | Ultimo acesso |

**Ban enforcement:** Verificado no `AuthProvider` do frontend - ao carregar perfil, se `is_banned = true`, faz logout e mostra "Seu acesso foi bloqueado. Entre em contato com o suporte." Tambem protegido via RLS policy que nega SELECT em tabelas de conteudo se `is_banned = true`.

**Trigger `update_last_seen`:** Atualizar `last_seen_at` apenas se > 5 minutos desde ultimo update (debounce pra evitar writes excessivos). Implementar via middleware no frontend que chama RPC `update_last_seen()` com throttle.

**`is_unlimited_access`:** Bypass total - ignora regras de modulo, regras de aula, expiracao de turma. Acesso a TODOS os cursos da plataforma, mesmo sem matricula. Verificado nos hooks `useModuleAccess` e `useLessonAccess`.

**Reset de senha:** Via Supabase Edge Function que usa service_role key. Admin chama endpoint `/functions/v1/admin-reset-password` com email do aluno. Retorna link de recovery ou envia email direto.

### Paginas modificadas

#### AdminManagementPage / UserManagement

**Tabs no topo:**
- Todos (total) | Assinantes (com turma ativa) | Ilimitados (is_unlimited_access) | Colaboradores (teachers) | Banidos (is_banned)

**Filtros por badge clicavel:**
- `+ Curso` → dropdown de cursos, filtra por matricula
- `+ Turma` → dropdown de turmas
- `+ Ultima vez visto` → date range picker
- `+ Membros inativos` → last_seen_at > 30 dias

**Colunas da tabela:**
- Avatar placeholder + Nome completo
- Email
- Data de inscricao
- Ultima vez visto
- Botao editar (lapis)
- Menu "..." → Ver perfil, Reenviar senha, Bloquear acesso

#### Nova pagina: AdminUserProfilePage (`/admin/users/:userId/profile`)

**Secao 1 - Dados do Membro:**
- Nome completo (text, required)
- Email (text, read-only em edicao)
- Telefone (text, mask)
- CPF/CNPJ (text, mask)
- Nova senha / Confirmar nova senha
  - Descricao: "Deixe em branco para manter a atual"

**Secao 2 - Controles de Acesso:**
- Toggle **Banido** - "Impede o acesso do aluno na area de membros"
- Toggle **Acesso Ilimitado** - "Todos os conteudos liberados (atuais e futuros)"
- Dropdown **Permissoes** - selecionar role (student/teacher/administrator)

**Secao 3 - Controle de Matriculas:**

Tabela com TODOS os cursos da plataforma:

| Nome do Curso | Selecionar Turma | Expiracao | Status |
|---------------|-----------------|-----------|--------|
| Extensivo EAOF 2027 | Turma A (dropdown) | __/__/____ | Ativo (dropdown) |
| Clube de Redacao | -- (nao matriculado) | | -- |
| Curso CFOE Portugues | Turma B (dropdown) | 15/06/2026 | Expirado |

- Admin pode matricular: seleciona turma → cria registro em `student_classes`
- Admin pode desmatricular: muda status pra inativo ou remove
- Admin define data de expiracao individual
- Cursos sem turma selecionada = aluno nao matriculado

**Secao 4 - Historico (read-only):**
- Progresso por curso (% barra)
- Ultima aula assistida (nome + data)
- XP acumulado
- Data de criacao da conta

### Acoes rapidas na lista

**Reenviar senha:**
- Usa Supabase Auth `admin.generateLink({ type: 'recovery', email })`
- Envia email de reset ao aluno
- Toast de confirmacao

**Bloquear acesso:**
- Seta `is_banned = true`
- Toast "Acesso bloqueado"
- Aluno e deslogado na proxima request

### Acoes em lote (preparacao SaaS)

- Checkbox de selecao multipla na tabela (coluna a esquerda)
- Barra de acoes aparece ao selecionar: "X selecionados" + botoes (Banir, Ativar, Adicionar a turma, Exportar CSV)
- **Nao implementar agora** - apenas prever o checkbox na tabela pra nao precisar refatorar depois

---

## D - Sistema de Convites

### Mudancas no banco de dados

**Nova tabela `invites`:**

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | uuid | PK |
| `slug` | text | UNIQUE, URL-friendly (ex: "degustacao-eaof-2027") |
| `title` | text | Nome interno (ex: "Degustacao EAOF 2027") |
| `description` | text | Texto de chamada publico |
| `course_id` | uuid | FK para video_courses |
| `class_id` | uuid | FK para classes |
| `access_duration_days` | int | Dias de acesso a partir da inscricao (null = ilimitado) |
| `max_slots` | int | Limite de vagas (null = ilimitado) |
| `cover_image_url` | text | Imagem de capa da landing page |
| `status` | text | 'active' ou 'archived' |
| `created_by_user_id` | uuid | FK para auth.users |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Nova tabela `invite_registrations`:**

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | uuid | PK |
| `invite_id` | uuid | FK para invites |
| `user_id` | uuid | FK para auth.users |
| `registered_at` | timestamptz | |
| UNIQUE | | (invite_id, user_id) |

### Novas paginas

#### AdminInvitesPage (`/admin/invites`)

**Header:** "Convites" + botao "Novo convite"

**Tabs:** Ativos (count) | Arquivados (count)

**Lista/tabela:**

| Texto de chamada | Inscritos | Link de divulgacao | Acoes |
|-----------------|-----------|-------------------|-------|
| Degustacao EAOF 2027 - descricao... | 25 membros → | https://app.../invite/degustacao-eaof-2027 [copiar] | [editar] [excluir] |

#### AdminInviteFormPage (`/admin/invites/new`, `/admin/invites/:inviteId/edit`)

Formulario:
- Titulo (text, required)
- Slug (text, auto-gerado do titulo, editavel)
- Texto de chamada (textarea, rich text)
- Curso vinculado (dropdown de video_courses)
- Turma vinculada (dropdown de classes, filtrado pelo curso)
- Prazo de acesso (input numerico + "dias", opcional)
- Limite de vagas (input numerico, opcional)
- Imagem de capa (upload via Supabase Storage)
- Status (active/archived)

#### Landing Page Publica: InvitePage (`/invite/:slug`)

**Pagina publica (sem autenticacao):**
- Capa do curso (imagem hero)
- Titulo do convite
- Texto de chamada
- Vagas restantes (se max_slots definido): "X de Y vagas disponiveis"
- Formulario: Nome completo, Email, Senha
- Botao "Criar conta e acessar"

**Fluxo ao submeter:**
1. Verifica se slug existe e convite esta ativo
2. Verifica vagas disponiveis (se aplicavel)
3. Se usuario ja existe no auth:
   - Matricula na turma
   - Toast "Acesso liberado! Faca login para acessar"
   - Redireciona pra `/login`
4. Se usuario novo:
   - Cria conta via Supabase Auth
   - Cria perfil em `users`
   - Matricula em `student_classes` (com expiracao se `access_duration_days` definido)
   - Registra em `invite_registrations`
   - Redireciona pra `/login` com toast "Conta criada! Faca login"

**RLS policies:**
- `invites` SELECT publico: apenas colunas `id, slug, title, description, cover_image_url, max_slots, status, course_id, class_id` onde `status = 'active'`
- `invite_registrations` INSERT publico: apenas `invite_id, user_id, registered_at`
- `invite_registrations` SELECT: apenas admin/teacher
- Race condition em `max_slots`: usar `SELECT count(*) FROM invite_registrations WHERE invite_id = X` dentro de transaction com `FOR UPDATE` no invite

**Invite com `access_duration_days`:** Sobrescreve o `classes.access_duration_days`. Se invite define 30 dias, o `student_classes.subscription_expires_at` = now() + 30 dias, independente da config da turma.

**Email duplicado no registro:** Tentar signup. Se Supabase retorna erro "User already registered", buscar user por email via service_role e apenas criar matricula. Tratar gracefully no frontend.

**Deletar convite:** Soft delete (status = 'archived'). Registros em `invite_registrations` sao mantidos pra historico. Matriculas ja criadas nao sao afetadas.

### Sidebar admin

Novo item "Convites" na secao de gerenciamento do admin, com icone de envelope/link.

---

## Resumo de Mudancas

### Novas tabelas (4)
- `class_module_rules` - regras de liberacao por modulo/turma
- `class_lesson_rules` - regras de liberacao por aula/turma
- `invites` - convites com landing page
- `invite_registrations` - tracking de inscricoes por convite

### Tabelas alteradas (2)
- `video_courses` - +8 colunas (acronym, sales_url, category, layout_preference, show_in_storefront, moderate_comments, onboarding_text, status)
- `users` - +5 colunas (phone, cpf_cnpj, is_banned, is_unlimited_access, last_seen_at)
- `classes` - +2 colunas (access_duration_days, is_default)

### Supabase Storage (1)
- Bucket `course-covers` para upload de imagens

### Paginas novas (4)
- `AdminUserProfilePage` - perfil completo do aluno
- `AdminInvitesPage` - lista de convites
- `AdminInviteFormPage` - criar/editar convite
- `InvitePage` - landing page publica

### Paginas modificadas (6)
- `AdminCourseFormPage` - formulario expandido
- `AdminCoursesPage` - thumbnails e status badges
- `AdminClassFormPage` - regras de liberacao
- `AdminClassesPage` - layout com thumbnails
- `AdminManagementPage` / UserManagement - tabs, filtros, acoes
- `MyCoursesPage` - secao vitrine
- `CourseDetailPage` - modo vitrine + regras de acesso

### Hooks novos (2)
- `useModuleAccess(classId, moduleId)` - verifica acesso ao modulo
- `useLessonAccess(classId, lessonId)` - verifica acesso a aula

### Services novos/modificados
- `moduleRulesService.ts` - `getRulesForClass()`, `upsertRule()`, `deleteRule()`, `checkCircularDependency()`
- `lessonRulesService.ts` - `getRulesForClass()`, `upsertRule()`, `deleteRule()`
- `inviteService.ts` - `getAll()`, `getBySlug()`, `create()`, `update()`, `archive()`, `registerUser()`, `getRegistrationCount()`
- `adminCourseService.ts` - expandir `create/update` com novas colunas, `uploadCoverImage()`, atualizar `duplicateCourse()` pra copiar novas colunas
- `adminUserService.ts` - expandir com `banUser()`, `unbanUser()`, `setUnlimitedAccess()`, `resetPassword()`, `getEnrollmentsByUser()`, `enrollInCourse()`, `unenrollFromCourse()`

### Indexes de banco
- `users.last_seen_at` - pra filtro de inativos
- `users.is_banned` - pra filtro de banidos
- `invites.slug` - UNIQUE ja cobre
- `student_classes(user_id, class_id)` - pra lookup de matriculas
- `class_module_rules(class_id)` - pra carregar regras por turma
