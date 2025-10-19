import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-provider'
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Check,
  Clock,
  TrendingUp,
  BookOpen,
  PenTool,
  Brain,
  Target,
  Calendar,
  Trophy,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  Volume2,
  VolumeX,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@/components/ui/responsive-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SectionLoader } from '@/components/SectionLoader'
import * as studyPlannerService from '@/services/studyPlannerService'

type StudyTopic = {
  id: string
  title: string
  category: 'portugues' | 'redacao' | 'matematica' | 'raciocinio-logico' | 'direito-constitucional' | 'direito-administrativo' | 'direito-penal' | 'direito-civil' | 'informatica' | 'atualidades' | 'conhecimentos-gerais' | 'ingles' | 'historia' | 'geografia' | 'legislacao' | 'outros'
  type: 'teoria' | 'exercicios' | 'pratica' | 'revisao'
  status: 'pending' | 'in-progress' | 'completed'
  pomodoros: number
  user_id: string
  created_at: string
}

type PomodoroSession = {
  id: string
  topic_id?: string
  topic_title: string
  duration_minutes: number
  completed: boolean
  user_id: string
  created_at: string
}

export default function StudyPlannerPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState<'planner' | 'timer' | 'history'>('planner')
  const [isLoading, setIsLoading] = useState(true)
  
  // Timer states
  const [timerActive, setTimerActive] = useState(false)
  const [timerMode, setTimerMode] = useState<'study' | 'break'>('study')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [currentTopicForTimer, setCurrentTopicForTimer] = useState('')
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  
  // Topics states
  const [topics, setTopics] = useState<StudyTopic[]>([])
  const [sessions, setSessions] = useState<PomodoroSession[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTopic, setEditingTopic] = useState<StudyTopic | null>(null)
  const [newTopic, setNewTopic] = useState({
    title: '',
    category: 'portugues' as const,
    type: 'teoria' as const
  })

  // Load data
  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      console.log('🔍 Loading study planner data for user:', user.id)

      // Carregar tópicos de estudo do Supabase
      const loadedTopics = await studyPlannerService.getStudyTopics(user.id)
      setTopics(loadedTopics)
      console.log('✅ Loaded study topics:', loadedTopics.length)

      // Carregar sessões pomodoro
      const loadedSessions = await studyPlannerService.getPomodoroSessions(user.id, 20)
      setSessions(loadedSessions)
      console.log('✅ Loaded pomodoro sessions:', loadedSessions.length)
    } catch (error) {
      console.error('❌ Error loading study planner data:', error)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar seu plano de estudos.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleTimerComplete()
    }
    return () => clearInterval(interval)
  }, [timerActive, timeLeft])

  const handleTimerComplete = () => {
    setTimerActive(false)
    
    if (soundEnabled) {
      playNotificationSound()
    }
    
    if (timerMode === 'study') {
      setCompletedPomodoros(prev => prev + 1)
      toast({
        title: '🎉 Pomodoro Completo!',
        description: 'Hora de fazer uma pausa de 5 minutos.',
      })
      setTimerMode('break')
      setTimeLeft(5 * 60)
    } else {
      toast({
        title: '✅ Pausa Completa!',
        description: 'Pronto para mais um pomodoro de estudo?',
      })
      setTimerMode('study')
      setTimeLeft(25 * 60)
    }
  }

  const playNotificationSound = () => {
    // Criar um som simples com Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const resetTimer = () => {
    setTimerActive(false)
    setTimerMode('study')
    setTimeLeft(25 * 60)
    setCurrentTopicForTimer('')
    setCompletedPomodoros(0)
  }

  const addOrUpdateTopic = async () => {
    if (!newTopic.title.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha o título do conteúdo.',
        variant: 'destructive'
      })
      return
    }

    if (!user) return

    try {
      if (editingTopic) {
        // Atualizar tópico existente no banco
        const updatedTopic = await studyPlannerService.updateStudyTopic(editingTopic.id, newTopic)
        setTopics(topics.map(t => t.id === editingTopic.id ? updatedTopic : t))
        toast({
          title: '✅ Conteúdo atualizado!',
          description: 'Suas alterações foram salvas.'
        })
      } else {
        // Criar novo tópico no banco
        const topicData = {
          ...newTopic,
          status: 'pending' as const,
          pomodoros: 0,
          user_id: user.id
        }
        const createdTopic = await studyPlannerService.createStudyTopic(topicData)
        setTopics([...topics, createdTopic])
        toast({
          title: '✅ Conteúdo adicionado!',
          description: 'Novo tópico de estudo criado com sucesso.'
        })
      }

      setNewTopic({ title: '', category: 'portugues', type: 'teoria' })
      setEditingTopic(null)
      setShowAddModal(false)
    } catch (error) {
      console.error('Error saving topic:', error)
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o tópico. Tente novamente.',
        variant: 'destructive'
      })
    }
  }

  const deleteTopic = async (id: string) => {
    try {
      await studyPlannerService.deleteStudyTopic(id)
      setTopics(topics.filter(t => t.id !== id))
      toast({
        title: 'Conteúdo removido',
        description: 'O tópico foi excluído do seu planejamento.'
      })
    } catch (error) {
      console.error('Error deleting topic:', error)
      toast({
        title: 'Erro ao deletar',
        description: 'Não foi possível deletar o tópico. Tente novamente.',
        variant: 'destructive'
      })
    }
  }

  const updateTopicStatus = async (id: string, status: StudyTopic['status']) => {
    try {
      await studyPlannerService.updateStudyTopic(id, { status })
      setTopics(topics.map(t => t.id === id ? { ...t, status } : t))
    } catch (error) {
      console.error('Error updating topic status:', error)
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o status. Tente novamente.',
        variant: 'destructive'
      })
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'portugues': return <BookOpen className="w-5 h-5" />
      case 'redacao': return <PenTool className="w-5 h-5" />
      case 'matematica': return <Target className="w-5 h-5" />
      case 'raciocinio-logico': return <Brain className="w-5 h-5" />
      case 'direito-constitucional': return <Trophy className="w-5 h-5" />
      case 'direito-administrativo': return <Trophy className="w-5 h-5" />
      case 'direito-penal': return <Trophy className="w-5 h-5" />
      case 'direito-civil': return <Trophy className="w-5 h-5" />
      case 'informatica': return <Zap className="w-5 h-5" />
      case 'atualidades': return <TrendingUp className="w-5 h-5" />
      case 'conhecimentos-gerais': return <Brain className="w-5 h-5" />
      case 'ingles': return <BookOpen className="w-5 h-5" />
      case 'historia': return <BookOpen className="w-5 h-5" />
      case 'geografia': return <Target className="w-5 h-5" />
      case 'legislacao': return <CheckCircle className="w-5 h-5" />
      default: return <Target className="w-5 h-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'portugues': return 'blue'
      case 'redacao': return 'purple'
      case 'matematica': return 'orange'
      case 'raciocinio-logico': return 'cyan'
      case 'direito-constitucional': return 'green'
      case 'direito-administrativo': return 'emerald'
      case 'direito-penal': return 'red'
      case 'direito-civil': return 'indigo'
      case 'informatica': return 'yellow'
      case 'atualidades': return 'pink'
      case 'conhecimentos-gerais': return 'violet'
      case 'ingles': return 'sky'
      case 'historia': return 'amber'
      case 'geografia': return 'teal'
      case 'legislacao': return 'lime'
      default: return 'gray'
    }
  }

  const completedTopics = topics.filter(t => t.status === 'completed').length
  const totalPomodoros = topics.reduce((acc, t) => acc + t.pomodoros, 0)
  const progressPercentage = topics.length > 0 ? Math.round((completedTopics / topics.length) * 100) : 0

  const topicsByCategory = {
    portugues: topics.filter(t => t.category === 'portugues'),
    redacao: topics.filter(t => t.category === 'redacao'),
    matematica: topics.filter(t => t.category === 'matematica'),
    'raciocinio-logico': topics.filter(t => t.category === 'raciocinio-logico'),
    'direito-constitucional': topics.filter(t => t.category === 'direito-constitucional'),
    'direito-administrativo': topics.filter(t => t.category === 'direito-administrativo'),
    'direito-penal': topics.filter(t => t.category === 'direito-penal'),
    'direito-civil': topics.filter(t => t.category === 'direito-civil'),
    informatica: topics.filter(t => t.category === 'informatica'),
    atualidades: topics.filter(t => t.category === 'atualidades'),
    'conhecimentos-gerais': topics.filter(t => t.category === 'conhecimentos-gerais'),
    ingles: topics.filter(t => t.category === 'ingles'),
    historia: topics.filter(t => t.category === 'historia'),
    geografia: topics.filter(t => t.category === 'geografia'),
    legislacao: topics.filter(t => t.category === 'legislacao'),
    outros: topics.filter(t => t.category === 'outros')
  }

  if (isLoading) {
    return <SectionLoader />
  }

  return (
    <MagicLayout
      title="Planejamento de Estudos"
      description="Organize seus estudos com a técnica Pomodoro"
    >
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* Header com Stats */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Meu Plano de Estudos
                </h1>
                <p className="text-muted-foreground mt-1">
                  Organize seus estudos de forma inteligente com a técnica Pomodoro
                </p>
              </div>
              <Button
                onClick={() => { setEditingTopic(null); setShowAddModal(true); }}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 w-full md:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Conteúdo
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="p-4 md:p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-green-500 opacity-50" />
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Conteúdos Completos</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600">{completedTopics}</p>
              </div>

              <div className="p-4 md:p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-blue-500 opacity-50" />
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Total de Tópicos</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-600">{topics.length}</p>
              </div>

              <div className="p-4 md:p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 md:w-10 md:h-10 text-purple-500 opacity-50" />
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Pomodoros Feitos</p>
                <p className="text-2xl md:text-3xl font-bold text-purple-600">{totalPomodoros}</p>
              </div>

              <div className="p-4 md:p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 md:w-10 md:h-10 text-orange-500 opacity-50" />
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Progresso Geral</p>
                <p className="text-2xl md:text-3xl font-bold text-orange-600">{progressPercentage}%</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso total</span>
                <span className="font-medium">{completedTopics} de {topics.length} concluídos</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
          </div>
        </MagicCard>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setActiveTab('planner')}
            variant={activeTab === 'planner' ? 'default' : 'outline'}
            className={cn(
              "flex-1 md:flex-none",
              activeTab === 'planner' && "bg-gradient-to-r from-primary to-primary/80"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Planejamento
          </Button>
          <Button
            onClick={() => setActiveTab('timer')}
            variant={activeTab === 'timer' ? 'default' : 'outline'}
            className={cn(
              "flex-1 md:flex-none",
              activeTab === 'timer' && "bg-gradient-to-r from-primary to-primary/80"
            )}
          >
            <Clock className="mr-2 h-4 w-4" />
            Cronômetro Pomodoro
          </Button>
          <Button
            onClick={() => setActiveTab('history')}
            variant={activeTab === 'history' ? 'default' : 'outline'}
            className={cn(
              "flex-1 md:flex-none",
              activeTab === 'history' && "bg-gradient-to-r from-primary to-primary/80"
            )}
          >
            <Trophy className="mr-2 h-4 w-4" />
            Histórico
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'planner' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Renderizar todas as categorias que têm tópicos */}
            {Object.entries(topicsByCategory).map(([key, categoryTopics]) => {
              if (categoryTopics.length === 0) return null
              
              const categoryNames: Record<string, string> = {
                'portugues': 'Português',
                'redacao': 'Redação',
                'matematica': 'Matemática',
                'raciocinio-logico': 'Raciocínio Lógico',
                'direito-constitucional': 'Direito Constitucional',
                'direito-administrativo': 'Direito Administrativo',
                'direito-penal': 'Direito Penal',
                'direito-civil': 'Direito Civil',
                'informatica': 'Informática',
                'atualidades': 'Atualidades',
                'conhecimentos-gerais': 'Conhecimentos Gerais',
                'ingles': 'Inglês',
                'historia': 'História',
                'geografia': 'Geografia',
                'legislacao': 'Legislação',
                'outros': 'Outros'
              }

              return (
                <CategoryCard
                  key={key}
                  title={categoryNames[key] || key}
                  icon={getCategoryIcon(key)}
                  color={getCategoryColor(key)}
                  topics={categoryTopics}
                  onAddTopic={() => {
                    setNewTopic({ ...newTopic, category: key as any })
                    setShowAddModal(true)
                  }}
                  onUpdateStatus={updateTopicStatus}
                  onEdit={(topic) => {
                    setEditingTopic(topic)
                    setNewTopic({
                      title: topic.title,
                      category: topic.category,
                      type: topic.type
                    })
                    setShowAddModal(true)
                  }}
                  onDelete={deleteTopic}
                />
              )
            })}
          </div>
        )}

        {activeTab === 'timer' && (
          <PomodoroTimer
            timerActive={timerActive}
            timerMode={timerMode}
            timeLeft={timeLeft}
            currentTopic={currentTopicForTimer}
            completedPomodoros={completedPomodoros}
            soundEnabled={soundEnabled}
            onToggleTimer={() => setTimerActive(!timerActive)}
            onResetTimer={resetTimer}
            onTopicChange={setCurrentTopicForTimer}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            formatTime={formatTime}
          />
        )}

        {activeTab === 'history' && (
          <StudyHistory
            totalPomodoros={totalPomodoros}
            completedTopics={completedTopics}
            sessions={sessions}
          />
        )}

      </div>

      {/* Add/Edit Modal */}
      <ResponsiveDialog open={showAddModal} onOpenChange={setShowAddModal}>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {editingTopic ? 'Editar Conteúdo' : 'Adicionar Novo Conteúdo'}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Adicione um novo tópico ao seu plano de estudos
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Conteúdo</Label>
              <Input
                id="title"
                value={newTopic.title}
                onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                placeholder="Ex: Crase, Vírgula, Argumentação..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Matéria</Label>
              <Select
                value={newTopic.category}
                onValueChange={(value: any) => setNewTopic({ ...newTopic, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="portugues">📘 Português</SelectItem>
                  <SelectItem value="redacao">📝 Redação</SelectItem>
                  <SelectItem value="matematica">🔢 Matemática</SelectItem>
                  <SelectItem value="raciocinio-logico">🧩 Raciocínio Lógico</SelectItem>
                  <SelectItem value="direito-constitucional">⚖️ Direito Constitucional</SelectItem>
                  <SelectItem value="direito-administrativo">🏛️ Direito Administrativo</SelectItem>
                  <SelectItem value="direito-penal">⚔️ Direito Penal</SelectItem>
                  <SelectItem value="direito-civil">📋 Direito Civil</SelectItem>
                  <SelectItem value="informatica">💻 Informática</SelectItem>
                  <SelectItem value="atualidades">📰 Atualidades</SelectItem>
                  <SelectItem value="conhecimentos-gerais">🌍 Conhecimentos Gerais</SelectItem>
                  <SelectItem value="ingles">🇬🇧 Inglês</SelectItem>
                  <SelectItem value="historia">📜 História</SelectItem>
                  <SelectItem value="geografia">🗺️ Geografia</SelectItem>
                  <SelectItem value="legislacao">📚 Legislação</SelectItem>
                  <SelectItem value="outros">📌 Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Estudo</Label>
              <Select
                value={newTopic.type}
                onValueChange={(value: any) => setNewTopic({ ...newTopic, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teoria">Teoria</SelectItem>
                  <SelectItem value="exercicios">Exercícios</SelectItem>
                  <SelectItem value="pratica">Prática</SelectItem>
                  <SelectItem value="revisao">Revisão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              onClick={addOrUpdateTopic}
              className="flex-1"
            >
              {editingTopic ? 'Salvar Alterações' : 'Adicionar'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false)
                setEditingTopic(null)
                setNewTopic({ title: '', category: 'portugues', type: 'teoria' })
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </MagicLayout>
  )
}

// Component for category cards
function CategoryCard({
  title,
  icon,
  color,
  topics,
  onAddTopic,
  onUpdateStatus,
  onEdit,
  onDelete
}: {
  title: string
  icon: React.ReactNode
  color: string
  topics: StudyTopic[]
  onAddTopic: () => void
  onUpdateStatus: (id: string, status: StudyTopic['status']) => void
  onEdit: (topic: StudyTopic) => void
  onDelete: (id: string) => void
}) {
  const completedCount = topics.filter(t => t.status === 'completed').length

  const colorClasses = {
    icon: {
      'blue': "bg-blue-100 dark:bg-blue-950/30 text-blue-600",
      'purple': "bg-purple-100 dark:bg-purple-950/30 text-purple-600",
      'orange': "bg-orange-100 dark:bg-orange-950/30 text-orange-600",
      'cyan': "bg-cyan-100 dark:bg-cyan-950/30 text-cyan-600",
      'green': "bg-green-100 dark:bg-green-950/30 text-green-600",
      'emerald': "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600",
      'red': "bg-red-100 dark:bg-red-950/30 text-red-600",
      'indigo': "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600",
      'yellow': "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-600",
      'pink': "bg-pink-100 dark:bg-pink-950/30 text-pink-600",
      'violet': "bg-violet-100 dark:bg-violet-950/30 text-violet-600",
      'sky': "bg-sky-100 dark:bg-sky-950/30 text-sky-600",
      'amber': "bg-amber-100 dark:bg-amber-950/30 text-amber-600",
      'teal': "bg-teal-100 dark:bg-teal-950/30 text-teal-600",
      'lime': "bg-lime-100 dark:bg-lime-950/30 text-lime-600",
      'gray': "bg-gray-100 dark:bg-gray-950/30 text-gray-600"
    },
    hover: {
      'blue': "hover:bg-blue-50 dark:hover:bg-blue-950/20",
      'purple': "hover:bg-purple-50 dark:hover:bg-purple-950/20",
      'orange': "hover:bg-orange-50 dark:hover:bg-orange-950/20",
      'cyan': "hover:bg-cyan-50 dark:hover:bg-cyan-950/20",
      'green': "hover:bg-green-50 dark:hover:bg-green-950/20",
      'emerald': "hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
      'red': "hover:bg-red-50 dark:hover:bg-red-950/20",
      'indigo': "hover:bg-indigo-50 dark:hover:bg-indigo-950/20",
      'yellow': "hover:bg-yellow-50 dark:hover:bg-yellow-950/20",
      'pink': "hover:bg-pink-50 dark:hover:bg-pink-950/20",
      'violet': "hover:bg-violet-50 dark:hover:bg-violet-950/20",
      'sky': "hover:bg-sky-50 dark:hover:bg-sky-950/20",
      'amber': "hover:bg-amber-50 dark:hover:bg-amber-950/20",
      'teal': "hover:bg-teal-50 dark:hover:bg-teal-950/20",
      'lime': "hover:bg-lime-50 dark:hover:bg-lime-950/20",
      'gray': "hover:bg-gray-50 dark:hover:bg-gray-950/20"
    }
  }

  return (
    <MagicCard variant="glass" size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              colorClasses.icon[color as keyof typeof colorClasses.icon]
            )}>
              {icon}
            </div>
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-sm text-muted-foreground">
                {completedCount} de {topics.length} completos
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onAddTopic}
            className={cn(
              colorClasses.hover[color as keyof typeof colorClasses.hover]
            )}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {topics.map(topic => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onUpdateStatus={onUpdateStatus}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </MagicCard>
  )
}

// Component for topic cards
function TopicCard({
  topic,
  onUpdateStatus,
  onEdit,
  onDelete
}: {
  topic: StudyTopic
  onUpdateStatus: (id: string, status: StudyTopic['status']) => void
  onEdit: (topic: StudyTopic) => void
  onDelete: (id: string) => void
}) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg border-2 transition-all",
        topic.status === 'completed' && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
        topic.status === 'in-progress' && "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800",
        topic.status === 'pending' && "bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-2 truncate">{topic.title}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {topic.type}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {topic.pomodoros} pomodoros
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          {topic.status !== 'completed' && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onUpdateStatus(
                topic.id,
                topic.status === 'pending' ? 'in-progress' : 'completed'
              )}
              className={cn(
                "w-8 h-8",
                topic.status === 'in-progress' 
                  ? "text-green-600 hover:bg-green-100 dark:hover:bg-green-950/20"
                  : "text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-950/20"
              )}
            >
              {topic.status === 'in-progress' ? <Check className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(topic)}
            className="w-8 h-8"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(topic.id)}
            className="w-8 h-8 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Pomodoro Timer Component
function PomodoroTimer({
  timerActive,
  timerMode,
  timeLeft,
  currentTopic,
  completedPomodoros,
  soundEnabled,
  onToggleTimer,
  onResetTimer,
  onTopicChange,
  onToggleSound,
  formatTime
}: {
  timerActive: boolean
  timerMode: 'study' | 'break'
  timeLeft: number
  currentTopic: string
  completedPomodoros: number
  soundEnabled: boolean
  onToggleTimer: () => void
  onResetTimer: () => void
  onTopicChange: (topic: string) => void
  onToggleSound: () => void
  formatTime: (seconds: number) => string
}) {
  return (
    <MagicCard variant="premium" size="lg" className="max-w-3xl mx-auto">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Zap className={cn(
              "w-6 h-6",
              timerMode === 'study' ? "text-primary animate-pulse" : "text-green-500"
            )} />
            <h2 className="text-2xl md:text-3xl font-bold">
              {timerMode === 'study' ? '⏱️ Tempo de Estudo' : '☕ Tempo de Pausa'}
            </h2>
          </div>
          <p className="text-muted-foreground">
            Técnica Pomodoro: 25min estudo / 5min pausa
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">
              {completedPomodoros} pomodoros completados hoje
            </span>
          </div>
        </div>

        <div className={cn(
          "text-center p-8 md:p-12 rounded-2xl transition-colors",
          timerMode === 'study' 
            ? "bg-gradient-to-br from-primary/10 to-primary/5" 
            : "bg-gradient-to-br from-green-500/10 to-green-600/5"
        )}>
          <div className={cn(
            "text-6xl md:text-8xl font-bold mb-4 transition-colors",
            timerMode === 'study' ? "text-primary" : "text-green-600"
          )}>
            {formatTime(timeLeft)}
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-sm px-4 py-2",
              timerMode === 'study'
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-green-500/10 text-green-600 border-green-500/30"
            )}
          >
            {timerMode === 'study' ? '🎯 Foco total!' : '😌 Relaxe um pouco'}
          </Badge>
        </div>

        {timerMode === 'study' && (
          <div className="space-y-2">
            <Label htmlFor="currentTopic">
              O que você está estudando agora?
            </Label>
            <Input
              id="currentTopic"
              value={currentTopic}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder="Ex: Sintaxe - Período Composto"
              className="text-lg"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onToggleTimer}
            size="lg"
            className={cn(
              "flex-1 font-semibold shadow-lg",
              timerMode === 'study'
                ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                : "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
            )}
          >
            {timerActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {timerActive ? 'Pausar' : 'Iniciar'}
          </Button>
          
          <Button
            onClick={onResetTimer}
            variant="outline"
            size="lg"
            className="flex-1 sm:flex-none"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Resetar
          </Button>

          <Button
            onClick={onToggleSound}
            variant="outline"
            size="lg"
            className="sm:w-auto"
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </MagicCard>
  )
}

// Study History Component
function StudyHistory({
  totalPomodoros,
  completedTopics,
  sessions
}: {
  totalPomodoros: number
  completedTopics: number
  sessions: PomodoroSession[]
}) {
  return (
    <div className="space-y-6">
      <MagicCard variant="premium" size="lg">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Histórico de Estudos</h2>
              <p className="text-muted-foreground">Acompanhe sua evolução</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <Clock className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="text-4xl font-bold text-primary mb-1">{totalPomodoros}</p>
              <p className="text-sm text-muted-foreground">Total de Pomodoros</p>
            </div>

            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-4xl font-bold text-green-600 mb-1">{completedTopics}</p>
              <p className="text-sm text-muted-foreground">Conteúdos Concluídos</p>
            </div>

            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
              <Zap className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <p className="text-4xl font-bold text-orange-600 mb-1">{totalPomodoros * 25}</p>
              <p className="text-sm text-muted-foreground">Minutos Estudados</p>
            </div>
          </div>
        </div>
      </MagicCard>

      <MagicCard variant="glass" size="lg">
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Histórico em Desenvolvimento</h3>
          <p className="text-muted-foreground">
            Em breve você poderá ver todo o seu histórico de estudos com gráficos e estatísticas detalhadas!
          </p>
        </div>
      </MagicCard>
    </div>
  )
}

