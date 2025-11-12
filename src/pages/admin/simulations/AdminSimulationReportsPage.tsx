import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionLoader } from '@/components/SectionLoader'
import {
  ArrowLeft,
  BarChart3,
  Users,
  Target,
  Clock,
  TrendingUp,
  TrendingDown,
  Award,
  CheckCircle,
  XCircle,
  Download,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { useErrorHandler } from '@/hooks/use-error-handler'

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6']

interface SimulationReport {
  id: string
  name: string
  date: string
  duration: number
  totalQuestions: number
  totalAttempts: number
  avgScore: number
  avgDuration: number
  completionRate: number
}

interface ScoreDistribution {
  faixa: string
  alunos: number
}

interface QuestionPerformance {
  questao: string
  corretas: number
  incorretas: number
}

interface AttemptsByDay {
  dia: string
  tentativas: number
}

interface TimeDistribution {
  name: string
  value: number
}

interface TopStudent {
  rank: number
  name: string
  score: number
  duration: number
  medal?: string
}

export default function AdminSimulationReportsPage() {
  const { simulationId } = useParams<{ simulationId: string }>()
  const navigate = useNavigate()
  const { handleError } = useErrorHandler()
  const [loading, setLoading] = useState(true)
  const [simulation, setSimulation] = useState<SimulationReport | null>(null)
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution[]>([])
  const [questionPerformance, setQuestionPerformance] = useState<QuestionPerformance[]>([])
  const [attemptsByDay, setAttemptsByDay] = useState<AttemptsByDay[]>([])
  const [timeDistribution, setTimeDistribution] = useState<TimeDistribution[]>([])
  const [topStudents, setTopStudents] = useState<TopStudent[]>([])

  useEffect(() => {
    loadSimulationReports()
  }, [simulationId])

  const loadSimulationReports = async () => {
    try {
      setLoading(true)
      logger.debug('Loading simulation reports for ID:', simulationId)

      // Buscar dados do simulado
      const { data: simData, error: simError } = await supabase
        .from('simulations')
        .select('*')
        .eq('id', simulationId)
        .single()

      if (simError) throw simError

      // Buscar tentativas do simulado
      const { data: attempts, error: attemptsError } = await supabase
        .from('simulation_attempts')
        .select(`
          id,
          score,
          duration_minutes,
          created_at,
          completed_at,
          users!simulation_attempts_user_id_fkey (
            id,
            full_name
          )
        `)
        .eq('simulation_id', simulationId)
        .order('score', { ascending: false })

      if (attemptsError) throw attemptsError

      // Calcular estatísticas
      const totalAttempts = attempts?.length || 0
      const completedAttempts = attempts?.filter(a => a.completed_at) || []
      const avgScore = completedAttempts.length > 0
        ? completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / completedAttempts.length
        : 0
      const avgDuration = completedAttempts.length > 0
        ? completedAttempts.reduce((sum, a) => sum + (a.duration_minutes || 0), 0) / completedAttempts.length
        : 0
      const completionRate = totalAttempts > 0
        ? (completedAttempts.length / totalAttempts) * 100
        : 0

      setSimulation({
        id: simData.id,
        name: simData.title,
        date: simData.created_at,
        duration: simData.duration_minutes || 270,
        totalQuestions: simData.total_questions || 0,
        totalAttempts,
        avgScore: Math.round(avgScore * 10) / 10,
        avgDuration: Math.round(avgDuration),
        completionRate: Math.round(completionRate * 10) / 10
      })

      // Calcular distribuição de notas
      const distribution: Record<string, number> = {
        '0-20%': 0,
        '21-40%': 0,
        '41-60%': 0,
        '61-80%': 0,
        '81-100%': 0
      }

      completedAttempts.forEach(attempt => {
        const score = attempt.score || 0
        if (score <= 20) distribution['0-20%']++
        else if (score <= 40) distribution['21-40%']++
        else if (score <= 60) distribution['41-60%']++
        else if (score <= 80) distribution['61-80%']++
        else distribution['81-100%']++
      })

      setScoreDistribution(
        Object.entries(distribution).map(([faixa, alunos]) => ({ faixa, alunos }))
      )

      // Calcular distribuição de tempo
      const timeDist: Record<string, number> = {
        'Menos de 2h': 0,
        '2h-3h': 0,
        '3h-4h': 0,
        'Mais de 4h': 0
      }

      completedAttempts.forEach(attempt => {
        const minutes = attempt.duration_minutes || 0
        if (minutes < 120) timeDist['Menos de 2h']++
        else if (minutes < 180) timeDist['2h-3h']++
        else if (minutes < 240) timeDist['3h-4h']++
        else timeDist['Mais de 4h']++
      })

      setTimeDistribution(
        Object.entries(timeDist).map(([name, value]) => ({ name, value }))
      )

      // Top 10 estudantes
      const top = completedAttempts
        .slice(0, 10)
        .map((attempt, index) => ({
          rank: index + 1,
          name: attempt.users?.full_name || `Aluno ${index + 1}`,
          score: Math.round(attempt.score || 0),
          duration: attempt.duration_minutes || 0,
          medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : undefined
        }))

      setTopStudents(top)

      // Tentativas por dia (últimos 7 dias)
      const dayGroups: Record<string, number> = {}
      completedAttempts.forEach(attempt => {
        const date = new Date(attempt.created_at)
        const dayKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        dayGroups[dayKey] = (dayGroups[dayKey] || 0) + 1
      })

      setAttemptsByDay(
        Object.entries(dayGroups)
          .map(([dia, tentativas]) => ({ dia, tentativas }))
          .slice(-7)
      )

      logger.success('Simulation reports loaded successfully')
    } catch (error) {
      logger.error('Erro ao carregar relatórios:', error)
      handleError(error, 'Falha ao carregar relatórios do simulado')
    } finally {
      setLoading(false)
    }
  }

  // Se não houver dados, mostrar mensagem
  const hasNoData = !loading && (!scoreDistribution.length && !topStudents.length)

  if (loading) {
    return <SectionLoader />
  }

  if (!simulation) {
    return (
      <MagicLayout title="Relatório não encontrado">
        <div className="text-center py-12">
          <p>Simulado não encontrado</p>
          <Button onClick={() => navigate('/admin/simulations')} className="mt-4">
            Voltar
          </Button>
        </div>
      </MagicLayout>
    )
  }

  return (
    <MagicLayout
      title="Relatórios do Simulado"
      description="Análise detalhada de desempenho e estatísticas"
    >
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3 md:gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/admin/simulations')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                    <h1 className="text-xl md:text-2xl font-bold">{simulation.name}</h1>
                    <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-600 w-fit">
                      {simulation.totalQuestions} questões
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Realizado em {new Date(simulation.date).toLocaleDateString('pt-BR')} • {simulation.duration} minutos
                  </p>
                </div>
              </div>
              <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 w-full md:w-auto">
                <Download className="h-4 w-4" />
                Exportar Relatório
              </Button>
            </div>
          </div>
        </MagicCard>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <MagicCard variant="glass">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-xs md:text-sm text-muted-foreground">Tentativas</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold">{simulation.totalAttempts}</div>
            </div>
          </MagicCard>

          <MagicCard variant="glass">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                <span className="text-xs md:text-sm text-muted-foreground">Média</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl md:text-3xl font-bold">{simulation.avgScore}%</div>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </MagicCard>

          <MagicCard variant="glass">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-xs md:text-sm text-muted-foreground">Tempo Médio</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold">{simulation.avgDuration}min</div>
            </div>
          </MagicCard>

          <MagicCard variant="glass">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <span className="text-xs md:text-sm text-muted-foreground">Conclusão</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold">{simulation.completionRate}%</div>
            </div>
          </MagicCard>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview" className="text-xs md:text-sm">Visão Geral</TabsTrigger>
            <TabsTrigger value="questions" className="text-xs md:text-sm">Questões</TabsTrigger>
            <TabsTrigger value="students" className="text-xs md:text-sm">Alunos</TabsTrigger>
            <TabsTrigger value="attempts" className="text-xs md:text-sm">Tentativas</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <MagicCard variant="glass" size="lg">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-1">Distribuição de Notas</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">Por faixa de pontuação</p>
                  </div>
                  <div className="h-[250px] md:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreDistribution}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="faixa" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="alunos" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Alunos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </MagicCard>

              <MagicCard variant="glass" size="lg">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-1">Distribuição de Tempo</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">Duração das tentativas</p>
                  </div>
                  <div className="h-[250px] md:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={timeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {timeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </MagicCard>
            </div>

            <MagicCard variant="glass" size="lg">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-1">Tentativas por Dia</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Volume de realizações diárias</p>
                </div>
                <div className="h-[250px] md:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attemptsByDay}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="dia" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="tentativas"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Tentativas"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </MagicCard>
          </TabsContent>

          {/* Questões */}
          <TabsContent value="questions" className="space-y-6">
            <MagicCard variant="glass" size="lg">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-1">Desempenho por Questão</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Acertos vs Erros</p>
                </div>
                <div className="h-[350px] md:h-[450px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={questionPerformance}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="questao" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="corretas" fill="#10b981" radius={[8, 8, 0, 0]} name="Corretas" />
                      <Bar dataKey="incorretas" fill="#ef4444" radius={[8, 8, 0, 0]} name="Incorretas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </MagicCard>

            <div className="grid gap-4">
              {questionPerformance.map((q, idx) => {
                const total = q.corretas + q.incorretas
                const percentCorrect = ((q.corretas / total) * 100).toFixed(1)
                return (
                  <MagicCard key={idx} variant="glass">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Target className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{q.questao}</h4>
                          <p className="text-sm text-muted-foreground">
                            {q.corretas} corretas • {q.incorretas} incorretas
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex-1 md:flex-none">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all",
                                parseFloat(percentCorrect) >= 70 ? "bg-green-500" :
                                parseFloat(percentCorrect) >= 50 ? "bg-orange-500" : "bg-red-500"
                              )}
                              style={{ width: `${percentCorrect}%` }}
                            />
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            parseFloat(percentCorrect) >= 70 ? "bg-green-500/10 border-green-500/20 text-green-600" :
                            parseFloat(percentCorrect) >= 50 ? "bg-orange-500/10 border-orange-500/20 text-orange-600" :
                            "bg-red-500/10 border-red-500/20 text-red-600"
                          )}
                        >
                          {percentCorrect}%
                        </Badge>
                      </div>
                    </div>
                  </MagicCard>
                )
              })}
            </div>
          </TabsContent>

          {/* Alunos */}
          <TabsContent value="students" className="space-y-6">
            <MagicCard variant="glass" size="lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-1">Top 10 Alunos</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">Melhores desempenhos</p>
                  </div>
                  <Award className="h-8 w-8 text-orange-500" />
                </div>

                <div className="space-y-2">
                  {topStudents.map((student) => (
                    <div
                      key={student.rank}
                      className={cn(
                        "flex items-center justify-between p-3 md:p-4 rounded-xl border transition-all",
                        student.rank <= 3
                          ? "bg-gradient-to-r from-primary/5 to-primary/0 border-primary/20"
                          : "bg-muted/30 border-border/50"
                      )}
                    >
                      <div className="flex items-center gap-3 md:gap-4 flex-1">
                        <div
                          className={cn(
                            "flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full font-bold text-sm md:text-base",
                            student.rank === 1 ? "bg-yellow-500/20 text-yellow-700" :
                            student.rank === 2 ? "bg-gray-400/20 text-gray-700" :
                            student.rank === 3 ? "bg-orange-500/20 text-orange-700" :
                            "bg-muted text-muted-foreground"
                          )}
                        >
                          {student.medal || student.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate text-sm md:text-base">{student.name}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {student.duration} minutos
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 border-green-500/20 text-green-600 text-sm md:text-base"
                      >
                        {student.score}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </MagicCard>
          </TabsContent>

          {/* Tentativas */}
          <TabsContent value="attempts" className="space-y-6">
            <MagicCard variant="glass" size="lg">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-1">Todas as Tentativas</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {simulation.totalAttempts} tentativas registradas
                  </p>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {Array.from({ length: 20 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3 md:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm md:text-base">Aluno {idx + 1}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {Math.floor(Math.random() * 60) + 180} minutos •{' '}
                            {new Date(Date.now() - Math.random() * 10000000000).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                        <Badge
                          variant="outline"
                          className={cn(
                            Math.random() > 0.5
                              ? "bg-green-500/10 border-green-500/20 text-green-600"
                              : "bg-orange-500/10 border-orange-500/20 text-orange-600"
                          )}
                        >
                          {Math.floor(Math.random() * 40) + 50}%
                        </Badge>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </MagicCard>
          </TabsContent>
        </Tabs>
      </div>
    </MagicLayout>
  )
}
