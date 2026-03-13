# Redesign do Sistema de Redações

## Resumo
Reformular o sistema de redações para ser centrado em turmas, com fluxo de correção mais claro, status intermediário, adição manual em todas as abas, e envio de resultados em massa.

## Mudanças

### 1. Página Principal — Visão por Turma
- Cards por turma do professor com contadores (pendentes, em correção, corrigidas)
- Botão "Gerenciar Temas" para CRUD de prompts (separado)

### 2. Página da Turma — Lista de Redações
- **Filtros:** Status | Tema | Data de envio (de/até)
- **Colunas:** Aluno | Tema | Data de Envio | Status | Nota | Ações
- **Ações em massa:** checkboxes + "Enviar Resultados" (notifica alunos selecionados)
- **Ação individual:** "Enviar Resultado" por linha
- Ordenação por data de envio (mais recente primeiro)

### 3. Página de Correção — UI Limpa
- Header reorganizado: card com grid — Nome, Turma, Tema, Data de envio em campos rotulados
- Botões no padrão shadcn (variant="outline" / "default", sem cores custom)
- **Salvar Rascunho** → status `correcting`
- **Finalizar Correção** → dialog de confirmação → status `corrected`
- Link rápido para configurações do template

### 4. Abas manuais (sem dependência de IA)
- Expressão: já tem adicionar manual + campo de débito editável (input numérico)
- Estrutura: botão "Adicionar Parágrafo" + tipo + textarea + débito
- Conteúdo: botão "Adicionar Critério" + tipo + nível + textarea + débito
- Sugestões: botão "Adicionar Sugestão" + categoria + textarea

### 5. Status
| Status | Significado |
|---|---|
| `submitted` | Aluno enviou, aguardando |
| `correcting` | Professor começou mas não finalizou |
| `corrected` | Professor confirmou correção finalizada |

### 6. Filtro de data de envio
- Campos "De" e "Até" na lista da turma
- Resolve disputas de "aluno disse que enviou dia X"

## Arquivos principais afetados
- `src/pages/admin/essays/AdminEssaysPage.tsx` (reescrever para turmas)
- `src/pages/admin/essays/AdminEssaySubmissionsPage.tsx` (filtros + ações em massa)
- `src/pages/admin/essays/AdminEssayCorrectionPage.tsx` (header + botões + abas manuais)
- `src/services/adminEssayService.ts` (queries por turma)
