# Próximos Passos - Correções Prioritárias

**Data:** 2025-10-18

---

## ✅ O Que Já Foi Corrigido (Hoje)

### Sessão 1: Student Pages
- ✅ 11 bugs corrigidos
- ✅ Todos commitados

### Sessão 2: Admin Pages
- ✅ Admin Dashboard - Dados reais implementados
- ✅ Foreign keys - student_classes corrigidos
- ✅ 3 commits criados

---

## 🔴 CRÍTICO - Fazer Agora

### 1. Verificar Quiz Database
**Problema:** Nenhum quiz aparece na lista
**Diagnóstico:** Logging já implementado

**Ação:**
1. Rodar a aplicação e verificar console logs
2. Checar se há dados nas tabelas:
   ```sql
   SELECT * FROM subjects;
   SELECT * FROM topics;
   SELECT * FROM quizzes;
   SELECT * FROM quiz_questions;
   ```
3. Verificar foreign keys:
   - `topics.subject_id` → `subjects.id`
   - `quizzes.topic_id` → `topics.id`
   - `quiz_questions.quiz_id` → `quizzes.id`

**Se não houver dados:** Popular tabelas com dados de exemplo
**Se foreign keys estiverem erradas:** Corrigir sintaxe igual fizemos com student_classes

---

### 2. Verificar Other Module Foreign Keys
**Arquivos a verificar:**

#### Evercast (Audio Lessons)
**Arquivo:** `src/pages/Evercast.tsx`, `src/services/audioLessonService.ts`
```typescript
// Verificar se usa sintaxe correta:
.select('lessons!audio_lessons_lesson_id_fkey(...)')
```

#### Courses (Video Courses)
**Arquivo:** `src/pages/Courses.tsx`, `src/services/courseService.ts`
```typescript
// Verificar joins e foreign keys
```

#### Essays
**Arquivo:** `src/pages/Essays.tsx`, `src/services/essayService.ts`
```typescript
// Verificar foreign keys
```

#### Simulations
**Arquivo:** `src/pages/Simulations.tsx`, `src/services/simulationService.ts`
```typescript
// Verificar foreign keys
```

---

## 🟡 ALTO - Próxima Semana

### 3. Error Handling Consistente

Criar hook reutilizável:

```typescript
// src/hooks/useErrorHandler.ts
import { useToast } from '@/hooks/use-toast'

export const useErrorHandler = () => {
  const { toast } = useToast()

  return {
    handleError: (error: Error, userMessage?: string) => {
      console.error(error)
      toast({
        title: 'Erro',
        description: userMessage || 'Algo deu errado. Tente novamente.',
        variant: 'destructive'
      })
    }
  }
}
```

**Usar em todos os services** substituindo `.catch(console.error)`

---

### 4. Admin Pages com Dados Mockados

Corrigir 11 páginas identificadas:

1. **AdminSimulationReportsPage** (mais complexa)
   - Remover setTimeout
   - Implementar queries reais

2. **AdminCoursesPage**
3. **AdminEssayFormPage**
4. **AdminSettingsPage**
5. **AdminEvercastPage**
6. **AdminEssaySubmissionsPage**
7. **AdminEssaysPage**
8. **AdminEssayComparisonPage**
9. **AdminCourseContentPage**
10. **AdminCalendarPage**
11. **AdminSimulationsPage**

---

## 🟢 MÉDIO - Próximas 2 Semanas

### 5. Logger Service
Criar logger centralizado para substituir console.log/error:

```typescript
// src/lib/logger.ts
const isDev = import.meta.env.DEV

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (isDev) console.log(`🔍 ${message}`, ...args)
  },
  info: (message: string, ...args: any[]) => {
    if (isDev) console.log(`ℹ️ ${message}`, ...args)
  },
  warn: (message: string, ...args: any[]) => {
    if (isDev) console.warn(`⚠️ ${message}`, ...args)
  },
  error: (message: string, ...args: any[]) => {
    console.error(`❌ ${message}`, ...args)
    // Aqui pode integrar com Sentry/LogRocket
  }
}
```

**Migrar 66+ ocorrências** de console.log/error para logger

---

### 6. Type Safety
Remover uso de `any`:

```typescript
// ❌ Antes:
const [data, setData] = useState<any>(null)

// ✅ Depois:
interface StudentData {
  id: string
  name: string
  // ...
}
const [data, setData] = useState<StudentData | null>(null)
```

---

### 7. Async Data Hook
Criar hook para eliminar código duplicado:

```typescript
// src/hooks/useAsyncData.ts
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const handleError = useErrorHandler()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await fetcher()
      setData(result)
      setError(null)
    } catch (err) {
      const error = err as Error
      setError(error)
      handleError.handleError(error)
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
```

**Uso:**
```typescript
// ❌ Antes (repetido 50+ vezes):
const [students, setStudents] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
useEffect(() => {
  loadStudents()
}, [])
const loadStudents = async () => {
  try {
    setLoading(true)
    const data = await getStudents()
    setStudents(data)
  } catch (err) {
    setError(err)
  } finally {
    setLoading(false)
  }
}

// ✅ Depois:
const { data: students, loading, error } = useAsyncData(() => getStudents())
```

---

## ⚪ BAIXO - Backlog

### 8. Resolver TODOs/FIXMEs
- 130 arquivos com comentários TODO
- Categorizar e criar issues no GitHub

### 9. Testes Automatizados
- Unit tests para services
- Integration tests para páginas críticas
- E2E tests para fluxos principais

### 10. i18n (Internacionalização)
- Extrair hardcoded strings
- Implementar sistema de tradução

### 11. Performance
- Code splitting
- Lazy loading
- Image optimization
- Bundle size reduction

---

## Checklist de Verificação Rápida

Antes de cada commit, verificar:

- [ ] Build passa sem erros
- [ ] Nenhum console.log novo (usar logger)
- [ ] Error handling implementado
- [ ] Loading states implementados
- [ ] Types definidos (sem 'any')
- [ ] Foreign keys usam sintaxe explícita
- [ ] User feedback (toasts) para erros
- [ ] Dados reais (sem mockups)

---

## Comandos Úteis

```bash
# Build e verificar erros
npm run build

# Verificar TypeScript
npx tsc --noEmit

# Buscar console.logs
grep -r "console\\.log" src/

# Buscar TODOs
grep -r "TODO\|FIXME" src/

# Verificar foreign keys
grep -r "select.*!" src/services/
```

---

## Resumo de Prioridades

| Prioridade | Item | Tempo Estimado | Status |
|------------|------|----------------|--------|
| 🔴 Crítico | Quiz database check | 30min | ⏳ Pendente |
| 🔴 Crítico | Verify other FKs | 1h | ⏳ Pendente |
| 🟡 Alto | Error handling hook | 2h | ⏳ Pendente |
| 🟡 Alto | Admin mockup pages | 1 semana | ⏳ Pendente |
| 🟢 Médio | Logger service | 3h | ⏳ Pendente |
| 🟢 Médio | Type safety | 1 semana | ⏳ Pendente |
| 🟢 Médio | Async data hook | 4h | ⏳ Pendente |
| ⚪ Baixo | TODOs/tests/i18n | Backlog | ⏳ Pendente |

---

## Documentos Criados Hoje

1. ✅ `BUG_FIXES_SESSION_SUMMARY.md` - Resumo sessão 1 (11 bugs student)
2. ✅ `ADMIN_FIXES_SESSION_SUMMARY.md` - Resumo sessão 2 (admin dashboard)
3. ✅ `ISSUES_ANALYSIS_REPORT.md` - Análise completa de 150+ issues
4. ✅ `NEXT_STEPS.md` - Este arquivo (próximos passos)

---

**Última atualização:** 2025-10-18
**Por:** Claude Code Agent
