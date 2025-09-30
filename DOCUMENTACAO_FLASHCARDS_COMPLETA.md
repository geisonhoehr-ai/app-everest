# DOCUMENTAÇÃO COMPLETA DO SISTEMA DE FLASHCARDS

## VISÃO GERAL DO SISTEMA

O sistema de flashcards do Everest é uma plataforma avançada de aprendizado baseada no algoritmo SM-2 (SuperMemo), que permite aos estudantes revisar conteúdo de forma eficiente através de espaçamento inteligente. O sistema inclui funcionalidades de gamificação, progresso personalizado, e múltiplos modos de estudo.

## ARQUITETURA DO SISTEMA

### 🗄️ **Estrutura do Banco de Dados**

```sql
-- Tabela principal de matérias
subjects (
  id: uuid PRIMARY KEY,
  name: text NOT NULL,
  description: text,
  image_url: text,
  category: text,
  created_at: timestamp,
  updated_at: timestamp
)

-- Tópicos dentro de cada matéria
topics (
  id: uuid PRIMARY KEY,
  subject_id: uuid REFERENCES subjects(id),
  name: text NOT NULL,
  description: text,
  created_at: timestamp,
  updated_at: timestamp
)

-- Flashcards individuais
flashcards (
  id: uuid PRIMARY KEY,
  topic_id: uuid REFERENCES topics(id),
  question: text NOT NULL,
  answer: text NOT NULL,
  explanation: text,
  difficulty: integer DEFAULT 1,
  external_resource_url: text,
  created_at: timestamp,
  updated_at: timestamp
)

-- Progresso do usuário (algoritmo SM-2)
flashcard_progress (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  flashcard_id: uuid REFERENCES flashcards(id),
  last_reviewed_at: timestamp,
  next_review_at: timestamp,
  interval_days: integer DEFAULT 1,
  ease_factor: decimal DEFAULT 2.5,
  repetitions: integer DEFAULT 0,
  quality: integer,
  response_time_seconds: integer,
  created_at: timestamp,
  updated_at: timestamp,
  UNIQUE(user_id, flashcard_id)
)

-- Histórico de sessões
flashcard_session_history (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  topic_id: uuid REFERENCES topics(id),
  session_mode: text,
  cards_reviewed: integer,
  correct_answers: integer,
  incorrect_answers: integer,
  started_at: timestamp,
  ended_at: timestamp
)

-- Conjuntos de flashcards personalizados
flashcard_sets (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  name: text NOT NULL,
  description: text,
  is_public: boolean DEFAULT false,
  created_at: timestamp,
  updated_at: timestamp
)

-- Cards em conjuntos personalizados
flashcard_set_cards (
  id: uuid PRIMARY KEY,
  set_id: uuid REFERENCES flashcard_sets(id),
  question: text NOT NULL,
  answer: text NOT NULL,
  explanation: text,
  external_resource_url: text,
  created_at: timestamp,
  updated_at: timestamp
)

-- Colaboradores em conjuntos
flashcard_set_collaborators (
  id: uuid PRIMARY KEY,
  set_id: uuid REFERENCES flashcard_sets(id),
  user_id: uuid REFERENCES users(id),
  permission: text DEFAULT 'viewer', -- 'owner', 'editor', 'viewer'
  created_at: timestamp,
  updated_at: timestamp,
  UNIQUE(set_id, user_id)
)
```

## 📱 **PÁGINAS E FLUXO COMPLETO**

### 1. **Página Principal de Flashcards** (`/flashcards`)

#### **Estrutura da Página:**
```tsx
// src/pages/Flashcards.tsx
export default function FlashcardsPage() {
  // Estados principais
  const [subjects, setSubjects] = useState<SubjectWithTopicCount[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Carregamento de dados
  useEffect(() => {
    getSubjects()
      .then(setSubjects)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  // Agrupamento por categoria (Português/Regulamentos)
  const groupedSubjects = groupBy(
    subjects,
    (subject) => subject.name === 'Português' ? 'Português' : 'Regulamentos',
  )
}
```

#### **Funcionalidades:**
- **Hero Section**: Título animado com descrição do sistema
- **Grid de Matérias**: Cards visuais para cada matéria (Português e Regulamentos)
- **Estatísticas em Tempo Real**: Número de tópicos e flashcards por matéria
- **Progresso Visual**: Barras de progresso e badges de status
- **Animações Staggered**: Entrada sequencial dos cards com delays
- **Design Premium**: Efeitos glow, gradientes e LEDs coloridos

#### **Elementos Visuais:**
- **MagicCard** com variante "premium"
- **LEDs coloridos** (purple, cyan, pink, blue, green, orange)
- **Imagens de fundo** dinâmicas para cada matéria
- **Partículas flutuantes** animadas
- **Badges de status** (Ativo, Progresso)
- **Botões com gradientes** e efeitos hover

#### **Navegação:**
- Clique em qualquer card → `/flashcards/{subjectId}` (página de tópicos)

---

### 2. **Página de Tópicos** (`/flashcards/{subjectId}`)

#### **Estrutura da Página:**
```tsx
// src/pages/FlashcardTopics.tsx
export default function FlashcardTopicsPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const [subject, setSubject] = useState<Subject | null>(null)
  const [topics, setTopics] = useState<TopicWithCardCount[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)

  // Carregamento de dados
  useEffect(() => {
    const fetchData = async () => {
      const [subjectData, topicsData] = await Promise.all([
        getSubjectById(subjectId),
        getTopicsBySubjectId(subjectId),
      ])
      setSubject(subjectData)
      setTopics(topicsData)
    }
    fetchData()
  }, [subjectId])
}
```

#### **Funcionalidades:**
- **Header com Breadcrumb**: Nome da matéria e botão voltar
- **Grid de Tópicos**: Cards para cada tópico da matéria
- **Contadores Animados**: Número de flashcards por tópico
- **Modal de Modo de Estudo**: Diálogo para selecionar modo de estudo
- **Badges de Status**: Indicadores visuais de atividade

#### **Componente TopicCard:**
```tsx
const TopicCard = ({ topic, index, delay, onStudyClick }: TopicCardProps) => {
  const { count, startAnimation } = useCountAnimation(
    topic.flashcards[0]?.count || 0,
    1000
  )

  return (
    <MagicCard
      led
      ledColor={index % 4 === 0 ? 'cyan' : index % 4 === 1 ? 'purple' : index % 4 === 2 ? 'orange' : 'green'}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Conteúdo do card */}
      <Button onClick={() => onStudyClick(topic.id)}>
        <Play className="h-4 w-4 mr-2" />
        Estudar Agora
      </Button>
    </MagicCard>
  )
}
```

#### **Navegação:**
- Clique em "Estudar Agora" → Abre modal de modo de estudo
- Modal → `/flashcards/{subjectId}/{topicId}/study` com parâmetros

---

### 3. **Modal de Modo de Estudo** (`StudyModeDialog`)

#### **Estrutura do Modal:**
```tsx
// src/components/flashcards/StudyModeDialog.tsx
const studyModes = [
  {
    name: 'Sessão Completa',
    description: 'Estude todos os cards do tópico no seu ritmo.',
    icon: BookOpen,
    mode: 'full',
  },
  {
    name: 'Revisão de Difíceis',
    description: 'Foque nos cards que você marcou como difíceis.',
    icon: BrainCircuit,
    mode: 'difficult_review',
  },
  {
    name: 'Modo Relâmpago',
    description: 'Uma revisão rápida com cards aleatórios.',
    icon: Zap,
    mode: 'lightning',
  },
  {
    name: 'Modo Teste',
    description: 'Simule um ambiente de prova com tempo cronometrado.',
    icon: TestTube,
    mode: 'test',
  },
  {
    name: 'Estudo Livre',
    description: 'Personalize a quantidade e a ordem dos cards.',
    icon: SlidersHorizontal,
    mode: 'free',
  },
]
```

#### **Fluxo do Modal:**
1. **Passo 1**: Seleção do modo de estudo
2. **Passo 2**: Seleção da quantidade de cards (5, 10, 15, 20, 25, 30, todos)
3. **Navegação**: Redireciona para página de estudo com parâmetros

#### **Parâmetros de URL:**
- `?mode=full&count=20` - Sessão completa com 20 cards
- `?mode=difficult_review` - Revisão de difíceis
- `?mode=lightning&count=10` - Modo relâmpago com 10 cards

---

### 4. **Página de Estudo** (`/flashcards/{subjectId}/{topicId}/study`)

#### **Estrutura da Página:**
```tsx
// src/pages/FlashcardStudyPage.tsx
export default function FlashcardStudyPage() {
  const { subjectId, topicId } = useParams()
  const [searchParams] = useSearchParams()
  const studyMode = searchParams.get('mode') || 'full'
  const cardCountParam = searchParams.get('count')

  // Estados principais
  const [topicData, setTopicData] = useState<TopicWithSubjectAndCards | null>(null)
  const [studyDeck, setStudyDeck] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([])

  // Carregamento do deck de estudo
  useEffect(() => {
    const fetchAndSetDeck = async () => {
      let fetchedCards: Flashcard[] = []
      
      if (studyMode === 'difficult_review') {
        fetchedCards = await getDifficultFlashcardsForTopic(topicId)
      } else {
        const data = await getTopicWithCards(topicId)
        if (data) {
          setTopicData(data)
          fetchedCards = data.flashcards
        }
      }

      // Embaralhar cards
      let deck = [...fetchedCards].sort(() => 0.5 - Math.random())
      
      // Limitar quantidade se especificado
      if (cardCountParam && cardCountParam !== 'all') {
        const count = parseInt(cardCountParam, 10)
        if (count > 0 && count < deck.length) {
          deck = deck.slice(0, count)
        }
      }
      
      setStudyDeck(deck)
    }
    fetchAndSetDeck()
  }, [topicId, studyMode, cardCountParam])
}
```

#### **Funcionalidades Principais:**

##### **Interface de Estudo:**
- **Card 3D**: Efeito de flip com CSS transforms
- **Controles de Navegação**: Botões anterior/próximo
- **Barra de Progresso**: Mostra progresso da sessão
- **Contador**: "X / Total" cards
- **Modo Tela Cheia**: Botão para fullscreen

##### **Interações:**
- **Flip do Card**: Clique no card ou barra de espaço
- **Avaliação de Qualidade**: Botões "Difícil", "Médio", "Fácil"
- **Navegação por Teclado**: Setas direita/esquerda, espaço
- **Favoritos**: Botão estrela para marcar cards

##### **Algoritmo SM-2:**
```tsx
const handleAnswer = async (quality: number) => {
  if (!isFlipped) {
    toast({
      title: 'Vire o card primeiro!',
      description: 'Veja a resposta antes de avaliar seu conhecimento.',
      variant: 'destructive',
    })
    return
  }

  try {
    await updateFlashcardProgress(currentCard.id, quality)
    const result: 'correct' | 'incorrect' = quality <= 2 ? 'incorrect' : 'correct'
    setSessionResults((prev) => [...prev, { cardId: currentCard.id, result }])
  } catch (error) {
    toast({ title: 'Erro ao salvar progresso', variant: 'destructive' })
  }
  
  setTimeout(handleNext, 200)
}
```

##### **Finalização da Sessão:**
```tsx
const finishSession = async () => {
  if (!topicData) return

  const correct = sessionResults.filter((r) => r.result === 'correct').length
  const incorrect = sessionResults.length - correct

  const sessionPayload: SaveSessionPayload = {
    topicId: topicData.id,
    mode: studyMode,
    totalCards: studyDeck.length,
    correct,
    incorrect,
  }

  const sessionId = await saveFlashcardSession(sessionPayload)
  navigate(`/flashcards/session/${sessionId}/result`)
}
```

---

### 5. **Página de Resultados** (`/flashcards/session/{sessionId}/result`)

#### **Estrutura da Página:**
```tsx
// src/pages/FlashcardSessionResult.tsx
export default function FlashcardSessionResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<FlashcardSession | null>(null)
  const [isShareOpen, setIsShareOpen] = useState(false)

  useEffect(() => {
    if (sessionId) {
      getFlashcardSessionDetails(sessionId)
        .then(setSession)
        .finally(() => setIsLoading(false))
    }
  }, [sessionId])

  const percentage = session.totalCards > 0 
    ? Math.round((session.correct / session.totalCards) * 100) 
    : 0
}
```

#### **Funcionalidades:**
- **Card de Resultados**: Percentual de acertos e estatísticas
- **Revisão Detalhada**: Accordion com todos os cards da sessão
- **Compartilhamento**: Modal para compartilhar resultados
- **Navegação**: Links para histórico e próxima sessão

#### **Elementos Visuais:**
- **Percentual Grande**: Display centralizado do desempenho
- **Ícones de Status**: CheckCircle (acertos) e XCircle (erros)
- **Accordion**: Revisão card por card com pergunta/resposta
- **Botões de Ação**: Compartilhar e ver histórico

---

### 6. **Página de Histórico** (`/flashcards/history`)

#### **Estrutura da Página:**
```tsx
// src/pages/FlashcardSessionHistory.tsx
export default function FlashcardSessionHistoryPage() {
  const [history, setHistory] = useState<FlashcardSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getFlashcardSessionHistory()
      .then(setHistory)
      .finally(() => setIsLoading(false))
  }, [])
}
```

#### **Funcionalidades:**
- **Tabela de Histórico**: Todas as sessões anteriores
- **Informações Detalhadas**: Tópico, data, modo, desempenho
- **Links para Detalhes**: Botão para ver resultados completos
- **Formatação de Data**: Data e hora em português

---

### 7. **Sistema de Conjuntos Personalizados**

#### **Página Meus Conjuntos** (`/flashcards/sets`)
```tsx
// src/pages/MyFlashcardSets.tsx
const mockSets = [
  {
    id: 'set1',
    name: 'Revolução Industrial - Collab',
    description: 'Set de flashcards para a prova de História.',
    owner: { name: 'João Pedro', id: 'user-self' },
    permission: 'owner',
    collaboratorsCount: 3,
    cardCount: 42,
  },
  // ... outros sets
]
```

#### **Funcionalidades:**
- **Grid de Conjuntos**: Cards para cada conjunto
- **Permissões**: Owner, Editor, Viewer
- **Colaboração**: Contador de colaboradores
- **Ações por Permissão**: Estudar, Editar, Gerenciar

#### **Página Editor** (`/flashcards/sets/{setId}/edit`)
```tsx
// src/pages/FlashcardSetEditor.tsx
const flashcardSetSchema = z.object({
  name: z.string().min(3, 'O nome do conjunto é muito curto.'),
  description: z.string().optional(),
  flashcards: z.array(
    z.object({
      question: z.string().min(1, 'A pergunta é obrigatória.'),
      answer: z.string().min(1, 'A resposta é obrigatória.'),
      external_resource_url: z.string().url('URL inválida.').optional(),
    }),
  ),
})
```

#### **Funcionalidades do Editor:**
- **Formulário Dinâmico**: Adicionar/remover flashcards
- **Validação**: Zod para validação de campos
- **Permissões**: Diferentes níveis de acesso
- **Campos**: Pergunta, resposta, URL externa

---

## 🔧 **SERVIÇOS E API**

### **flashcardService.ts**

#### **Principais Funções:**

```typescript
// Buscar matérias com contagem de tópicos
export const getSubjects = async (): Promise<SubjectWithTopicCount[]>

// Buscar tópicos de uma matéria
export const getTopicsBySubjectId = async (subjectId: string): Promise<TopicWithCardCount[]>

// Buscar tópico com flashcards
export const getTopicWithCards = async (topicId: string): Promise<TopicWithSubjectAndCards | null>

// Salvar sessão de estudo
export const saveFlashcardSession = async (payload: SaveSessionPayload): Promise<string | null>

// Atualizar progresso (algoritmo SM-2)
export const updateFlashcardProgress = async (flashcardId: string, quality: number): Promise<FlashcardProgress>

// Buscar flashcards difíceis
export const getDifficultFlashcardsForTopic = async (topicId: string): Promise<Flashcard[]>

// Histórico de sessões
export const getFlashcardSessionHistory = async (): Promise<FlashcardSession[]>
```

#### **Algoritmo SM-2:**
```typescript
export const updateFlashcardProgress = async (flashcardId: string, quality: number) => {
  // Calcular novos valores usando algoritmo SM-2
  let newInterval = 1
  let newRepetitions = 1
  let newEaseFactor = 2.5

  if (currentProgress) {
    newEaseFactor = currentProgress.ease_factor
    newRepetitions = currentProgress.repetitions

    if (quality >= 3) {
      if (newRepetitions === 0) {
        newInterval = 1
      } else if (newRepetitions === 1) {
        newInterval = 6
      } else {
        newInterval = Math.round(currentProgress.interval_days * newEaseFactor)
      }
      newRepetitions += 1
    } else {
      newRepetitions = 0
      newInterval = 1
    }

    // Ajustar ease factor
    newEaseFactor = newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    newEaseFactor = Math.max(1.3, newEaseFactor)
  }

  const nextReview = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000)
  
  // Salvar no banco
  await supabase.from('flashcard_progress').upsert({
    user_id: userId,
    flashcard_id: flashcardId,
    last_reviewed_at: now.toISOString(),
    next_review_at: nextReview.toISOString(),
    interval_days: newInterval,
    ease_factor: newEaseFactor,
    repetitions: newRepetitions,
    quality: quality,
  })
}
```

---

## 🎨 **DESIGN SYSTEM E COMPONENTES**

### **MagicCard Variants:**
- **Premium**: Cards da página principal com efeitos avançados
- **Standard**: Cards simples para tópicos
- **Study**: Cards de estudo com animações 3D

### **Animações:**
- **Staggered Animation**: Entrada sequencial com delays
- **Count Animation**: Contadores animados
- **Flip Animation**: Efeito 3D nos cards de estudo
- **Particle Animation**: Partículas flutuantes
- **Gradient Shift**: Gradientes animados

### **Cores e LEDs:**
- **Primary**: Azul principal
- **Secondary**: Roxo/cyan para gradientes
- **LED Colors**: purple, cyan, pink, blue, green, orange
- **Status Colors**: Verde (acerto), Vermelho (erro), Amarelo (médio)

---

## 📊 **FLUXO COMPLETO DO USUÁRIO**

### **1. Entrada no Sistema:**
```
/flashcards → Lista de matérias (Português/Regulamentos)
```

### **2. Seleção de Matéria:**
```
/flashcards/portugues → Lista de tópicos de Português
```

### **3. Seleção de Tópico:**
```
Modal → Escolha modo de estudo → Escolha quantidade
/flashcards/portugues/gramatica/study?mode=full&count=20
```

### **4. Sessão de Estudo:**
```
Card 1 → Flip → Avaliar (1-5) → Próximo
Card 2 → Flip → Avaliar (1-5) → Próximo
...
Último Card → Finalizar Sessão
```

### **5. Resultados:**
```
/flashcards/session/123/result → Ver desempenho
→ Compartilhar ou Ver Histórico
```

### **6. Histórico:**
```
/flashcards/history → Todas as sessões anteriores
→ Clique em detalhes → Ver resultados específicos
```

---

## 🚀 **FUNCIONALIDADES AVANÇADAS**

### **Modos de Estudo:**
1. **Sessão Completa**: Todos os cards do tópico
2. **Revisão de Difíceis**: Apenas cards com ease_factor < 2.0
3. **Modo Relâmpago**: Revisão rápida aleatória
4. **Modo Teste**: Ambiente cronometrado
5. **Estudo Livre**: Quantidade personalizada

### **Gamificação:**
- **Progresso Visual**: Barras e percentuais
- **Streaks**: Sequências de acertos
- **Conquistas**: Badges por marcos
- **Estatísticas**: Tempo de resposta, precisão

### **Colaboração:**
- **Conjuntos Compartilhados**: Flashcards em equipe
- **Permissões**: Owner, Editor, Viewer
- **Colaboração**: Múltiplos editores
- **Público**: Conjuntos abertos

### **Personalização:**
- **Configurações**: Tempo, animações, sons
- **Layouts**: Diferentes visualizações
- **Temas**: Claro/escuro
- **Acessibilidade**: Teclado, screen reader

---

## 🔒 **SEGURANÇA E PERFORMANCE**

### **Row Level Security (RLS):**
```sql
-- Política para flashcard_progress
CREATE POLICY "Users can only see their own progress" ON flashcard_progress
FOR ALL USING (auth.uid() = user_id);

-- Política para conjuntos
CREATE POLICY "Users can see public sets or their own" ON flashcard_sets
FOR SELECT USING (is_public = true OR user_id = auth.uid());
```

### **Otimizações:**
- **Lazy Loading**: Carregamento sob demanda
- **Caching**: Cache de sessões e progresso
- **Batch Operations**: Múltiplas atualizações em lote
- **Indexes**: Índices para consultas frequentes

### **Validação:**
- **Frontend**: Zod schemas para validação
- **Backend**: Validação no Supabase
- **Sanitização**: Limpeza de inputs
- **Rate Limiting**: Limite de requisições

---

Este sistema de flashcards representa uma implementação completa e moderna de uma plataforma de aprendizado espaçado, com funcionalidades avançadas de gamificação, colaboração e personalização, tudo integrado ao ecossistema educacional do Everest.
