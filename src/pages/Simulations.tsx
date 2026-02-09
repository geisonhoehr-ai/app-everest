import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { SimulationsTutorial } from '@/components/simulations/SimulationsTutorial'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Play,
  BarChart2,
  Calendar,
  Clock,
  Trophy,
  Target,
  BookOpen,
  TrendingUp,
  Award,
  Users,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileCheck,
  Send,
  Monitor,
  ClipboardList,
  Lock,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '@/hooks/use-auth'
import { useFeaturePermissions } from '@/hooks/use-feature-permissions'
import { FEATURE_KEYS } from '@/services/classPermissionsService'
import { logger } from '@/lib/logger'

interface Quiz {
  id: string
  title: string
  description?: string
  type: string
  status: string
  scheduled_start?: string
  scheduled_end?: string
  duration_minutes?: number
  total_points?: number
  passing_score?: number
}

interface QuizWithAttempt extends Quiz {
  user_attempts?: Array<{
    id: string
    score?: number
    total_points?: number
    percentage?: number
    status: string
    submitted_at?: string
  }>
}

export default function SimulationsPage() {
  const { isStudent } = useAuth()
  const { hasFeature, loading: permissionsLoading } = useFeaturePermissions()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('online')
  const [simulations, setSimulations] = useState<QuizWithAttempt[]>([])
  const [answerSheets, setAnswerSheets] = useState<QuizWithAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    available: 0,
    completed: 0,
    average: 0,
    best: 0
  })
  const [sheetsStats, setSheetsStats] = useState({
    available: 0,
    submitted: 0,
    average: 0,
    best: 0
  })
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('simulations_tutorial_seen')
    if (!hasSeenTutorial) {
      setShowTutorial(true)
    }
  }, [])

  const handleCloseTutorial = () => {
    setShowTutorial(false)
    localStorage.setItem('simulations_tutorial_seen', 'true')
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Buscar simulados online
      const { data: simQuizzes, error: simError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('type', 'simulation')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (simError) throw simError

      // Buscar cartões resposta
      const { data: sheetQuizzes, error: sheetError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('type', 'answer_sheet')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (sheetError) throw sheetError

      // Buscar tentativas do usuário
      const allQuizIds = [...(simQuizzes?.map(q => q.id) || []), ...(sheetQuizzes?.map(q => q.id) || [])]

      let attempts = null
      let attemptsError = null

      // Só buscar tentativas se houver quizzes disponíveis
      if (allQuizIds.length > 0) {
        const result = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', user.id)
          .in('quiz_id', allQuizIds)
          .order('started_at', { ascending: false })

        attempts = result.data
        attemptsError = result.error

        if (attemptsError) throw attemptsError
      }

      // Agrupar tentativas por quiz
      const attemptsMap = new Map<string, typeof attempts>()
      attempts?.forEach(attempt => {
        const existing = attemptsMap.get(attempt.quiz_id) || []
        attemptsMap.set(attempt.quiz_id, [...existing, attempt])
      })

      // Combinar dados - Simulados
      const combinedSims = simQuizzes?.map(quiz => ({
        ...quiz,
        user_attempts: attemptsMap.get(quiz.id) || []
      })) || []

      setSimulations(combinedSims)

      // Combinar dados - Cartões Resposta
      const combinedSheets = sheetQuizzes?.map(quiz => ({
        ...quiz,
        user_attempts: attemptsMap.get(quiz.id) || []
      })) || []

      setAnswerSheets(combinedSheets)

      // Calcular estatísticas - Simulados
      const simAttempts = attempts?.filter(a => simQuizzes?.some(q => q.id === a.quiz_id)) || []
      const simAvailable = combinedSims.filter(q => getSimulationStatus(q) === 'available').length
      const simCompleted = simAttempts.filter(a => a.status === 'submitted').length
      const simAvg = simCompleted > 0
        ? simAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / simCompleted
        : 0
      const simBest = simAttempts.reduce((max, a) => Math.max(max, a.percentage || 0), 0)

      setStats({
        available: simAvailable,
        completed: simCompleted,
        average: Math.round(simAvg),
        best: Math.round(simBest)
      })

      // Calcular estatísticas - Cartões Resposta
      const sheetAttempts = attempts?.filter(a => sheetQuizzes?.some(q => q.id === a.quiz_id) && a.status === 'submitted') || []
      const sheetAvailable = combinedSheets.filter(q => getSimulationStatus(q) === 'available').length
      const sheetSubmitted = sheetAttempts.length
      const sheetAvg = sheetSubmitted > 0
        ? sheetAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / sheetSubmitted
        : 0
      const sheetBest = sheetAttempts.reduce((max, a) => Math.max(max, a.percentage || 0), 0)

      setSheetsStats({
        available: sheetAvailable,
        submitted: sheetSubmitted,
        average: Math.round(sheetAvg),
        best: Math.round(sheetBest)
      })

    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getSimulationStatus = (quiz: QuizWithAttempt): 'available' | 'completed' | 'expired' | 'scheduled' => {
    const now = new Date()

    if (quiz.scheduled_end && new Date(quiz.scheduled_end) < now) {
      return 'expired'
    }

    if (quiz.scheduled_start && new Date(quiz.scheduled_start) > now) {
      return 'scheduled'
    }

    const hasCompleted = quiz.user_attempts?.some(a => a.status === 'submitted')
    if (hasCompleted) {
      return 'completed'
    }

    return 'available'
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponível'
      case 'completed': return 'Realizado'
      case 'expired': return 'Encerrado'
      case 'scheduled': return 'Agendado'
      default: return 'Desconhecido'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500/10 border-green-500/20 text-green-600'
      case 'completed':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-600'
      case 'expired':
        return 'bg-gray-500/10 border-gray-500/20 text-gray-600'
      case 'scheduled':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-600'
      default:
        return 'bg-muted/10 border-muted/20 text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <Play className="h-3 w-3" />
      case 'completed':
        return <CheckCircle className="h-3 w-3" />
      case 'expired':
        return <AlertCircle className="h-3 w-3" />
      case 'scheduled':
        return <Clock className="h-3 w-3" />
      default:
        return <AlertCircle className="h-3 w-3" />
    }
  }

  if (permissionsLoading || loading) {
    return (
      <MagicLayout title="Carregando..." description="Aguarde...">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MagicLayout>
    )
  }

  // Se for aluno e não tiver permissão, mostra página bloqueada
  if (isStudent && !hasFeature(FEATURE_KEYS.QUIZ)) {
    return (
      <MagicLayout
        title="Simulados"
        description="Recurso bloqueado"
      >
        <MagicCard variant="glass" size="lg" className="text-center py-24">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Recurso Bloqueado
            </h3>
            <p className="text-muted-foreground mb-8">
              Este recurso não está disponível para sua turma. Entre em contato com seu professor ou administrador para mais informações.
            </p>
          </div>
        </MagicCard>
      </MagicLayout>
    )
  }

  const currentStats = activeTab === 'online' ? stats : sheetsStats
  const currentData = activeTab === 'online' ? simulations : answerSheets

  return (
    <MagicLayout
      title="Sistema de Avaliações"
      description="Simulados online e cartões resposta de provas presenciais"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Sistema de Avaliações</h1>
                <p className="text-muted-foreground">
                  Simulados online e provas presenciais
                </p>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="online" className="gap-2">
                  <Monitor className="h-4 w-4" />
                  Simulados Online
                </TabsTrigger>
                <TabsTrigger value="presencial" className="gap-2">
                  <FileCheck className="h-4 w-4" />
                  Cartões Resposta
                </TabsTrigger>
              </TabsList>

              {/* Stats dinâmicos */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                  {activeTab === 'online' ? <Play className="h-6 w-6 text-green-500 mx-auto mb-2" /> : <Send className="h-6 w-6 text-green-500 mx-auto mb-2" />}
                  <div className="text-2xl font-bold text-green-600">
                    {activeTab === 'online' ? currentStats.available : currentStats.available}
                  </div>
                  <div className="text-sm text-muted-foreground">Disponíveis</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                  <CheckCircle className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {activeTab === 'online' ? currentStats.completed : currentStats.submitted}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activeTab === 'online' ? 'Realizados' : 'Enviados'}
                  </div>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                  <TrendingUp className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">{currentStats.average}</div>
                  <div className="text-sm text-muted-foreground">Média</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                  <Trophy className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-600">{currentStats.best}</div>
                  <div className="text-sm text-muted-foreground">Melhor</div>
                </div>
              </div>
            </Tabs>
          </div>
        </MagicCard>

        {/* Table */}
        <MagicCard variant="glass" size="lg">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                {activeTab === 'online' ? (
                  <Monitor className="h-6 w-6 text-primary" />
                ) : (
                  <ClipboardList className="h-6 w-6 text-primary" />
                )}
              </div>
              <h2 className="text-2xl font-bold">
                {activeTab === 'online' ? 'Simulados Online' : 'Provas Presenciais'}
              </h2>
            </div>

            <div className="rounded-xl overflow-hidden border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-muted/20 to-muted/10 border-border/50">
                    <TableHead className="font-semibold">Nome do Simulado</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">Data</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Última Pontuação</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {activeTab === 'online'
                          ? 'Nenhum simulado disponível no momento'
                          : 'Nenhum cartão resposta disponível no momento'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentData.map((sim, index) => {
                      const status = getSimulationStatus(sim)
                      const lastAttempt = sim.user_attempts?.[0]
                      const formattedDate = sim.scheduled_start
                        ? format(new Date(sim.scheduled_start), "dd/MM/yyyy", { locale: ptBR })
                        : '-'

                      return (
                        <TableRow
                          key={sim.id}
                          className={cn(
                            "group hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 transition-colors duration-300",
                            "border-border/50"
                          )}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                                <span className="text-sm font-bold text-primary">
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold">{sim.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {sim.description || 'Simulado oficial'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{formattedDate}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "flex items-center gap-2 px-3 py-1 rounded-full border font-medium",
                              getStatusColor(status)
                            )}>
                              {getStatusIcon(status)}
                              {getStatusLabel(status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {lastAttempt && lastAttempt.status === 'submitted' ? (
                              <div className="flex items-center justify-end gap-2">
                                <Trophy className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-primary">
                                  {lastAttempt.percentage?.toFixed(0)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              {status === 'available' && (
                                <Button
                                  size="sm"
                                  asChild
                                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold transition-transform duration-300 hover:scale-105 hover:shadow-lg inline-flex items-center justify-center"
                                >
                                  {activeTab === 'online' ? (
                                    <Link to={`/simulados/${sim.id}`}>
                                      <Play className="mr-2 h-4 w-4" />
                                      Iniciar
                                    </Link>
                                  ) : (
                                    <Link to={`/cartao-resposta/${sim.id}`}>
                                      <Send className="mr-2 h-4 w-4" />
                                      Preencher
                                    </Link>
                                  )}
                                </Button>
                              )}
                              {status === 'completed' && lastAttempt && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-colors duration-300"
                                >
                                  {activeTab === 'online' ? (
                                    <Link to={`/simulados/${sim.id}/resultado?attemptId=${lastAttempt.id}`}>
                                      <BarChart2 className="mr-2 h-4 w-4" />
                                      Ver Relatório
                                      <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                  ) : (
                                    <Link to={`/cartao-resposta/${sim.id}/resultado?attemptId=${lastAttempt.id}`}>
                                      <BarChart2 className="mr-2 h-4 w-4" />
                                      Ver Nota
                                    </Link>
                                  )}
                                </Button>
                              )}
                              {status === 'expired' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                  className="opacity-50 cursor-not-allowed"
                                >
                                  <AlertCircle className="mr-2 h-4 w-4" />
                                  Encerrado
                                </Button>
                              )}
                              {status === 'scheduled' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                  className="opacity-50 cursor-not-allowed"
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  Agendado
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </MagicCard>

        {/* Quick Actions */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Ações Rápidas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Próximo Simulado */}
              {currentData.filter(q => getSimulationStatus(q) === 'available')[0] ? (
                <div className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20 hover:border-blue-500/30 transition-transform duration-300 hover:scale-105 inline-flex items-center justify-center">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-blue-600">Próximo Simulado</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {currentData.filter(q => getSimulationStatus(q) === 'available')[0].title}
                  </p>
                  <Button
                    size="sm"
                    asChild
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    <Link to={activeTab === 'online'
                      ? `/simulados/${currentData.filter(q => getSimulationStatus(q) === 'available')[0].id}`
                      : `/cartao-resposta/${currentData.filter(q => getSimulationStatus(q) === 'available')[0].id}`
                    }>
                      <Play className="mr-2 h-4 w-4" />
                      Iniciar Agora
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-gradient-to-r from-gray-500/10 to-gray-600/5 border border-gray-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gray-500/20">
                      <Clock className="h-5 w-5 text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-gray-600">Próximo Simulado</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Nenhum simulado disponível no momento
                  </p>
                  <Button
                    size="sm"
                    disabled
                    variant="outline"
                    className="opacity-50 cursor-not-allowed"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Aguarde
                  </Button>
                </div>
              )}

              {/* Meu Progresso */}
              <div className="p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20 hover:border-green-500/30 transition-transform duration-300 hover:scale-105 inline-flex items-center justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-600">Meu Progresso</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {currentStats.completed > 0
                    ? `Você realizou ${currentStats.completed} ${currentStats.completed === 1 ? 'simulado' : 'simulados'} com média de ${currentStats.average}%`
                    : 'Comece a realizar simulados para ver seu progresso'
                  }
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80"
                >
                  <Link to="/progresso">
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Ver Relatório
                  </Link>
                </Button>
              </div>

              {/* Conquistas */}
              <div className="p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-purple-600/5 border border-purple-500/20 hover:border-purple-500/30 transition-transform duration-300 hover:scale-105 inline-flex items-center justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Award className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-purple-600">Conquistas</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {currentStats.best > 0
                    ? `Sua melhor nota: ${currentStats.best}% - Continue assim!`
                    : 'Desbloqueie novas conquistas realizando simulados'
                  }
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80"
                >
                  <Link to="/conquistas">
                    <Trophy className="mr-2 h-4 w-4" />
                    Ver Conquistas
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </MagicCard>
      </div>

      {/* Tutorial */}
      {showTutorial && <SimulationsTutorial onClose={handleCloseTutorial} />}
    </MagicLayout>
  )
}
