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

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6']

export default function AdminSimulationReportsPage() {
  const { simulationId } = useParams<{ simulationId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [simulation, setSimulation] = useState<any>(null)

  useEffect(() => {
    loadSimulationReports()
  }, [simulationId])

  const loadSimulationReports = async () => {
    try {
      // Simular dados (substituir por chamada real à API)
      setTimeout(() => {
        setSimulation({
          id: simulationId,
          name: 'Simulado ENEM 2024 - 1ª Aplicação',
          date: '2024-03-15',
          duration: 270,
          totalQuestions: 90,
          totalAttempts: 156,
          avgScore: 67.5,
          avgDuration: 245,
          completionRate: 87.2,
        })
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error)
      setLoading(false)
    }
  }

  // Dados simulados para os gráficos
  const scoreDistribution = [
    { faixa: '0-20%', alunos: 8 },
    { faixa: '21-40%', alunos: 15 },
    { faixa: '41-60%', alunos: 42 },
    { faixa: '61-80%', alunos: 67 },
    { faixa: '81-100%', alunos: 24 },
  ]

  const questionPerformance = [
    { questao: 'Q1', corretas: 142, incorretas: 14 },
    { questao: 'Q2', corretas: 134, incorretas: 22 },
    { questao: 'Q3', corretas: 98, incorretas: 58 },
    { questao: 'Q4', corretas: 156, incorretas: 0 },
    { questao: 'Q5', corretas: 45, incorretas: 111 },
    { questao: 'Q6', corretas: 123, incorretas: 33 },
    { questao: 'Q7', corretas: 89, incorretas: 67 },
    { questao: 'Q8', corretas: 145, incorretas: 11 },
  ]

  const attemptsByDay = [
    { dia: '15/03', tentativas: 23 },
    { dia: '16/03', tentativas: 45 },
    { dia: '17/03', tentativas: 38 },
    { dia: '18/03', tentativas: 29 },
    { dia: '19/03', tentativas: 12 },
    { dia: '20/03', tentativas: 9 },
  ]

  const timeDistribution = [
    { name: 'Menos de 2h', value: 18 },
    { name: '2h-3h', value: 45 },
    { name: '3h-4h', value: 67 },
    { name: 'Mais de 4h', value: 26 },
  ]

  const topStudents = [
    { rank: 1, name: 'Ana Silva', score: 95, duration: 235, medal: '🥇' },
    { rank: 2, name: 'Carlos Santos', score: 92, duration: 248, medal: '🥈' },
    { rank: 3, name: 'Maria Oliveira', score: 89, duration: 252, medal: '🥉' },
    { rank: 4, name: 'João Costa', score: 87, duration: 241 },
    { rank: 5, name: 'Fernanda Lima', score: 85, duration: 238 },
    { rank: 6, name: 'Pedro Alves', score: 84, duration: 256 },
    { rank: 7, name: 'Juliana Souza', score: 82, duration: 243 },
    { rank: 8, name: 'Rafael Rocha', score: 81, duration: 267 },
    { rank: 9, name: 'Camila Ferreira', score: 79, duration: 239 },
    { rank: 10, name: 'Lucas Martins', score: 78, duration: 254 },
  ]

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
