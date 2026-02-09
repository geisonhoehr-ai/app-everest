import { useState } from 'react'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
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
  Brain,
  Mic,
  TrendingDown
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AdminReportsPage() {
  const [dateRange, setDateRange] = useState('30d')

  // Dados dos gráficos
  const userGrowthData = [
    { mes: 'Jan', usuarios: 245, ativos: 198, inativos: 47 },
    { mes: 'Fev', usuarios: 312, ativos: 265, inativos: 47 },
    { mes: 'Mar', usuarios: 389, ativos: 334, inativos: 55 },
    { mes: 'Abr', usuarios: 467, ativos: 412, inativos: 55 },
    { mes: 'Mai', usuarios: 598, ativos: 521, inativos: 77 },
    { mes: 'Jun', usuarios: 734, ativos: 645, inativos: 89 },
    { mes: 'Jul', usuarios: 856, ativos: 748, inativos: 108 },
    { mes: 'Ago', usuarios: 1023, ativos: 897, inativos: 126 },
    { mes: 'Set', usuarios: 1156, ativos: 1012, inativos: 144 },
    { mes: 'Out', usuarios: 1234, ativos: 1089, inativos: 145 },
  ]

  const engagementData = [
    { dia: 'Seg', sessoes: 456, tempo: 125 },
    { dia: 'Ter', sessoes: 523, tempo: 142 },
    { dia: 'Qua', sessoes: 612, tempo: 168 },
    { dia: 'Qui', sessoes: 589, tempo: 156 },
    { dia: 'Sex', sessoes: 534, tempo: 145 },
    { dia: 'Sab', sessoes: 289, tempo: 78 },
    { dia: 'Dom', sessoes: 198, tempo: 54 },
  ]

  const contentUsageData = [
    { nome: 'Flashcards', acessos: 2845, conclusao: 78 },
    { nome: 'Quizzes', acessos: 1932, conclusao: 65 },
    { nome: 'Cursos', acessos: 1567, conclusao: 45 },
    { nome: 'Redações', acessos: 892, conclusao: 88 },
    { nome: 'Evercast', acessos: 734, conclusao: 92 },
    { nome: 'Simulados', acessos: 456, conclusao: 55 },
  ]

  const performanceRadarData = [
    { materia: 'Matemática', desempenho: 78 },
    { materia: 'Português', desempenho: 85 },
    { materia: 'História', desempenho: 72 },
    { materia: 'Geografia', desempenho: 68 },
    { materia: 'Ciências', desempenho: 81 },
    { materia: 'Inglês', desempenho: 75 },
  ]

  const contentDistribution = [
    { name: 'Flashcards', value: 2845 },
    { name: 'Quizzes', value: 1932 },
    { name: 'Cursos', value: 1567 },
    { name: 'Redações', value: 892 },
    { name: 'Evercast', value: 734 },
    { name: 'Simulados', value: 456 },
  ]

  const completionRatesData = [
    { semana: 'S1', taxa: 45 },
    { semana: 'S2', taxa: 52 },
    { semana: 'S3', taxa: 61 },
    { semana: 'S4', taxa: 68 },
    { semana: 'S5', taxa: 72 },
    { semana: 'S6', taxa: 75 },
    { semana: 'S7', taxa: 78 },
    { semana: 'S8', taxa: 81 },
  ]

  const statsCards = [
    {
      title: 'Usuários Ativos',
      value: '1,234',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'from-blue-500/20 to-blue-600/10',
      iconColor: 'text-blue-500'
    },
    {
      title: 'Cursos Concluídos',
      value: '89',
      change: '+8.2%',
      trend: 'up',
      icon: BookOpen,
      color: 'from-green-500/20 to-green-600/10',
      iconColor: 'text-green-500'
    },
    {
      title: 'Redações Corrigidas',
      value: '456',
      change: '+15.3%',
      trend: 'up',
      icon: FileText,
      color: 'from-purple-500/20 to-purple-600/10',
      iconColor: 'text-purple-500'
    },
    {
      title: 'Taxa de Aprovação',
      value: '87.5%',
      change: '+2.1%',
      trend: 'up',
      icon: Target,
      color: 'from-orange-500/20 to-orange-600/10',
      iconColor: 'text-orange-500'
    }
  ]

  return (
    <MagicLayout
      title="Relatórios e Análises"
      description="Visualize métricas e estatísticas detalhadas da plataforma"
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
                  <div className={`flex items-center gap-1 text-xs md:text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {stat.trend === 'up' ? <TrendingUp className="h-3 w-3 md:h-4 md:w-4" /> : <TrendingDown className="h-3 w-3 md:h-4 md:w-4" />}
                    {stat.change}
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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview" className="text-xs md:text-sm">Visão Geral</TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm">Usuários</TabsTrigger>
            <TabsTrigger value="content" className="text-xs md:text-sm">Conteúdo</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs md:text-sm">Desempenho</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <MagicCard variant="premium" size="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <BarChart3 className="h-5 w-5" />
                  Resumo Executivo
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Principais indicadores e tendências da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Tempo Médio de Estudo
                    </div>
                    <p className="text-xl md:text-2xl font-bold">2.5h/dia</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <Award className="h-4 w-4" />
                      Conquistas Desbloqueadas
                    </div>
                    <p className="text-xl md:text-2xl font-bold">1,892</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Taxa de Engajamento
                    </div>
                    <p className="text-xl md:text-2xl font-bold">78.5%</p>
                  </div>
                </div>

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
                      <XAxis dataKey="mes" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="usuarios"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorUsuarios)"
                        name="Total Usuários"
                      />
                      <Area
                        type="monotone"
                        dataKey="ativos"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorAtivos)"
                        name="Usuários Ativos"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </MagicCard>

            {/* Engajamento Semanal */}
            <div className="grid gap-6 lg:grid-cols-2">
              <MagicCard variant="glass" size="lg">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Engajamento Semanal</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Sessões e tempo de estudo por dia</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] md:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={engagementData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="dia" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sessoes" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Sessões" />
                        <Bar dataKey="tempo" fill="#10b981" radius={[8, 8, 0, 0]} name="Tempo (min)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </MagicCard>

              <MagicCard variant="glass" size="lg">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Taxa de Conclusão</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Evolução nas últimas 8 semanas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] md:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={completionRatesData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="semana" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="taxa"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          name="Taxa (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </MagicCard>
            </div>
          </TabsContent>

          {/* Usuários */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <MagicCard variant="premium" size="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Users className="h-5 w-5" />
                    Crescimento de Usuários
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Total vs Ativos vs Inativos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] md:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={userGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="mes" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="usuarios" stroke="#3b82f6" strokeWidth={2} name="Total" />
                        <Line type="monotone" dataKey="ativos" stroke="#10b981" strokeWidth={2} name="Ativos" />
                        <Line type="monotone" dataKey="inativos" stroke="#ef4444" strokeWidth={2} name="Inativos" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </MagicCard>

              <MagicCard variant="premium" size="lg">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Distribuição de Atividades</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Por dia da semana</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] md:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={engagementData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="dia" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="sessoes" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </MagicCard>
            </div>
          </TabsContent>

          {/* Conteúdo */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <MagicCard variant="premium" size="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <BookOpen className="h-5 w-5" />
                    Uso de Conteúdo
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Acessos por tipo de recurso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] md:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={contentUsageData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis type="number" fontSize={12} />
                        <YAxis dataKey="nome" type="category" fontSize={12} width={100} />
                        <Tooltip />
                        <Bar dataKey="acessos" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </MagicCard>

              <MagicCard variant="premium" size="lg">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Distribuição de Conteúdo</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Por tipo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] md:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={contentDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {contentDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </MagicCard>
            </div>

            <MagicCard variant="glass" size="lg">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Taxa de Conclusão por Conteúdo</CardTitle>
                <CardDescription className="text-xs md:text-sm">Percentual de atividades completadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] md:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={contentUsageData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="nome" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="conclusao" fill="#10b981" radius={[8, 8, 0, 0]} name="Conclusão (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </MagicCard>
          </TabsContent>

          {/* Desempenho */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <MagicCard variant="premium" size="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Target className="h-5 w-5" />
                    Desempenho por Matéria
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Análise radar do aproveitamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] md:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={performanceRadarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="materia" fontSize={12} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} fontSize={12} />
                        <Radar
                          name="Desempenho"
                          dataKey="desempenho"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.5}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </MagicCard>

              <MagicCard variant="premium" size="lg">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Evolução de Desempenho</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Últimas 8 semanas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] md:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={completionRatesData}>
                        <defs>
                          <linearGradient id="colorTaxa" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="semana" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="taxa"
                          stroke="#10b981"
                          fillOpacity={1}
                          fill="url(#colorTaxa)"
                          name="Taxa de Conclusão (%)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </MagicCard>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MagicLayout>
  )
}
