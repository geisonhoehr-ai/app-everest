import { useState, useEffect } from 'react'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { SectionLoader } from '@/components/SectionLoader'
import {
  getSystemStats,
  getUserGrowthData,
  getWeeklyActivityData,
  type SystemStats,
  type UserGrowthData,
  type ActivityDataPoint
} from '@/services/adminStatsService'
import {
  BarChart3,
  Users,
  BookOpen,
  FileText,
  TrendingUp,
  Download,
  Calendar,
  Target,
  Award,
  Clock,
  TrendingDown
} from 'lucide-react'
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function AdminReportsPage() {
  const [dateRange, setDateRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([])
  const [weeklyActivityData, setWeeklyActivityData] = useState<ActivityDataPoint[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [statsData, growthData, activityData] = await Promise.all([
          getSystemStats().catch(() => null),
          getUserGrowthData().catch(() => []),
          getWeeklyActivityData().catch(() => [])
        ])
        setStats(statsData)
        setUserGrowthData(growthData)
        setWeeklyActivityData(activityData)
      } catch (error) {
        console.error('Erro ao carregar dados dos relatorios:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const statsCards = [
    {
      title: 'Total de Usuarios',
      value: stats ? stats.totalUsers.toLocaleString('pt-BR') : '0',
      icon: Users,
      color: 'from-blue-500/20 to-blue-600/10',
      iconColor: 'text-blue-500'
    },
    {
      title: 'Cursos',
      value: stats ? stats.totalCourses.toLocaleString('pt-BR') : '0',
      icon: BookOpen,
      color: 'from-green-500/20 to-green-600/10',
      iconColor: 'text-green-500'
    },
    {
      title: 'Redacoes',
      value: stats ? stats.totalEssays.toLocaleString('pt-BR') : '0',
      icon: FileText,
      color: 'from-purple-500/20 to-purple-600/10',
      iconColor: 'text-purple-500'
    },
    {
      title: 'Taxa de Conclusao',
      value: stats ? `${stats.completionRate}%` : '0%',
      icon: Target,
      color: 'from-orange-500/20 to-orange-600/10',
      iconColor: 'text-orange-500'
    }
  ]

  if (loading) {
    return <SectionLoader />
  }

  return (
    <MagicLayout
      title="Relatorios e Analises"
      description="Visualize metricas e estatisticas detalhadas da plataforma"
    >
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <Tabs value={dateRange} onValueChange={setDateRange} className="w-full md:w-auto">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="7d">7 dias</TabsTrigger>
              <TabsTrigger value="30d">30 dias</TabsTrigger>
              <TabsTrigger value="90d">90 dias</TabsTrigger>
              <TabsTrigger value="1y">1 ano</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-3 w-full md:w-auto">
            <Button variant="outline" className="gap-2 flex-1 md:flex-none">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Personalizar</span>
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 flex-1 md:flex-none">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {statsCards.map((stat, index) => (
            <MagicCard key={index} variant="glass" glow>
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className={`h-4 w-4 md:h-6 md:w-6 ${stat.iconColor}`} />
                  </div>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">{stat.title}</p>
                  <h3 className="text-xl md:text-3xl font-bold mt-1">{stat.value}</h3>
                </div>
              </div>
            </MagicCard>
          ))}
        </div>

        {/* Main Reports */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
            <TabsTrigger value="overview" className="text-xs md:text-sm">Visao Geral</TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm">Usuarios</TabsTrigger>
            <TabsTrigger value="content" className="text-xs md:text-sm">Conteudo</TabsTrigger>
          </TabsList>

          {/* Visao Geral */}
          <TabsContent value="overview" className="space-y-6">
            <MagicCard variant="premium" size="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <BarChart3 className="h-5 w-5" />
                  Resumo
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Principais indicadores da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Alunos
                    </div>
                    <p className="text-xl md:text-2xl font-bold">
                      {stats ? stats.totalStudents.toLocaleString('pt-BR') : '0'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <Award className="h-4 w-4" />
                      Quizzes
                    </div>
                    <p className="text-xl md:text-2xl font-bold">
                      {stats ? stats.totalQuizzes.toLocaleString('pt-BR') : '0'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Flashcards
                    </div>
                    <p className="text-xl md:text-2xl font-bold">
                      {stats ? stats.totalFlashcards.toLocaleString('pt-BR') : '0'}
                    </p>
                  </div>
                </div>

                {userGrowthData.length > 0 && (
                  <div className="h-[250px] md:h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={userGrowthData}>
                        <defs>
                          <linearGradient id="colorUsuarios" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAtivos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="usuarios"
                          stroke="#3b82f6"
                          fillOpacity={1}
                          fill="url(#colorUsuarios)"
                          name="Total Usuarios"
                        />
                        <Area
                          type="monotone"
                          dataKey="ativos"
                          stroke="#10b981"
                          fillOpacity={1}
                          fill="url(#colorAtivos)"
                          name="Usuarios Ativos"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </MagicCard>

            {/* Atividade Semanal */}
            {weeklyActivityData.length > 0 && (
              <MagicCard variant="glass" size="lg">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Atividade Semanal</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Atividades por dia da semana</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] md:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyActivityData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="day" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="atividades" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Atividades" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </MagicCard>
            )}
          </TabsContent>

          {/* Usuarios */}
          <TabsContent value="users" className="space-y-6">
            <MagicCard variant="premium" size="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Users className="h-5 w-5" />
                  Crescimento de Usuarios
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Total vs Ativos por mes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userGrowthData.length > 0 ? (
                  <div className="h-[300px] md:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={userGrowthData}>
                        <defs>
                          <linearGradient id="colorUsuarios2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="usuarios" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsuarios2)" name="Total" />
                        <Area type="monotone" dataKey="ativos" stroke="#10b981" fill="transparent" name="Ativos" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Sem dados de crescimento disponiveis.
                  </div>
                )}
              </CardContent>
            </MagicCard>

            {/* Distribuicao por Papel */}
            <MagicCard variant="glass" size="lg">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Distribuicao de Usuarios</CardTitle>
                <CardDescription className="text-xs md:text-sm">Por papel na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats ? stats.totalStudents : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Alunos</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                    <div className="text-2xl font-bold text-green-600">
                      {stats ? stats.totalTeachers : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Professores</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats ? stats.totalAdministrators : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Administradores</div>
                  </div>
                </div>
              </CardContent>
            </MagicCard>
          </TabsContent>

          {/* Conteudo */}
          <TabsContent value="content" className="space-y-6">
            <MagicCard variant="premium" size="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <BookOpen className="h-5 w-5" />
                  Conteudo da Plataforma
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Totais por tipo de recurso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats ? stats.totalCourses : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Cursos</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                    <div className="text-2xl font-bold text-green-600">
                      {stats ? stats.totalFlashcards : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Flashcards</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats ? stats.totalQuizzes : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Quizzes</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats ? stats.totalEssays : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Redacoes</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-600/5 border border-pink-500/20">
                    <div className="text-2xl font-bold text-pink-600">
                      {stats ? stats.totalAudioCourses : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Audio Cursos</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20">
                    <div className="text-2xl font-bold text-cyan-600">
                      {stats ? stats.totalClasses : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Turmas</div>
                  </div>
                </div>
              </CardContent>
            </MagicCard>
          </TabsContent>
        </Tabs>
      </div>
    </MagicLayout>
  )
}
