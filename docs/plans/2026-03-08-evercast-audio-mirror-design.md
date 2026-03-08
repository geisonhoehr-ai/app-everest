# Evercast — Cursos em Audio (Espelho de Video)

## Data: 2026-03-08

## Conceito

O admin marca cursos de video como disponiveis no Evercast. O Evercast consulta diretamente as tabelas de video (sem duplicar dados), usando o HLS da Panda como fonte de audio. Progresso de audio e independente do progresso de video.

## Decisoes de Design

| Decisao | Escolha |
|---------|---------|
| Escopo do espelhamento | Admin seleciona quais cursos disponibilizar |
| Sincronizacao | Automatica (referencia direta, sem duplicacao) |
| Estrutura no Evercast | Visao album/curso + listagem plana |
| Progresso | Independente (video e audio separados) |
| Permissoes | EVERCAST + matricula no curso de video |
| Implementacao tecnica | Referencia direta (query nas tabelas de video) |

## Banco de Dados

- **Nova coluna**: `video_courses.evercast_enabled` (boolean, default false)
- **Tabela existente**: `audio_progress` reutilizada para progresso, com referencia ao `video_lesson_id`
- Nenhuma tabela nova, nenhuma duplicacao de dados

## Fluxo Admin

1. Na pagina de edicao de curso (`/admin/courses/:id`), um toggle "Disponibilizar no Evercast"
2. Ao ativar, todas as aulas do curso ficam visiveis no Evercast automaticamente
3. Mudancas no curso (adicionar/remover aulas) refletem instantaneamente — mesma fonte de dados

## Fluxo Aluno — Evercast

1. **Listagem principal** (ja existe): mostra audios avulsos + aulas de cursos espelhados, agrupados por serie (nome do curso)
2. **Visao album** (nova): ao clicar num curso, abre visao com modulos e aulas (estilo Spotify album)
3. **Player**: reutiliza o player de audio existente, tocando o HLS da Panda
4. **Progresso**: salvo em `audio_progress`, independente do video

## Permissoes

- Aluno precisa de `EVERCAST` + estar matriculado no curso de video
- Query filtra por ambas as condicoes

## Consulta de Dados

O `audioLessonService` ganha um metodo que busca cursos de video com `evercast_enabled = true`, filtra por matricula do aluno, e retorna os dados no formato que o Evercast espera — mesma interface, fonte diferente.

## UI — Visao Album

- Card do curso na listagem -> clica -> tela com:
  - Header: thumbnail, nome do curso, total de aulas/duracao
  - Accordion de modulos (similar ao CourseDetailPage)
  - Cada aula com botao play, duracao, status de progresso
  - Botao "Reproduzir tudo" no topo

## O que NAO muda

- Audios avulsos existentes continuam funcionando normalmente
- Player de audio existente (AudioPlayer.tsx) e reutilizado
- Admin de Evercast avulso continua existindo para conteudos que nao sao cursos
