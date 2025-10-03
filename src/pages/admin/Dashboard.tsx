import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Badge } from '@/components/ui/badge'
import { SectionLoader } from '@/components/SectionLoader'
import { getSystemStats, type SystemStats } from '@/services/adminStatsService'
import {
  Shield,
  Users,
  GraduationCap,
  BookOpen,
  Brain,
  Target,
  FileText,
  Mic,
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

/**
 * Dashboard Admin - Visão executiva do sistema
 *
 * Métricas e gráficos específicos para administradores:
 * - KPIs principais (usuários, turmas, cursos, atividades)
 * - Gráficos de crescimento e engajamento
 * - Atividades recentes
 * - Alertas e notificações importantes
 */

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAdministrators: 0,
    totalClasses: 0,
    totalCourses: 0,
    totalFlashcards: 0,
    totalQuizzes: 0,
    totalEssays: 0,
    totalAudioCourses: 0,
    activeUsers: 0,
    completionRate: 0,
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getSystemStats()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Dados simulados para gráficos (substituir por dados reais da API)
  const userGrowthData = [
    { month: 'Jan', usuarios: 45, ativos: 38 },
    { month: 'Fev', usuarios: 52, ativos: 44 },
    { month: 'Mar', usuarios: 61, ativos: 51 },
    { month: 'Abr', usuarios: 72, ativos: 63 },
    { month: 'Mai', usuarios: 85, ativos: 74 },
    { month: 'Jun', usuarios: stats.totalUsers, ativos: stats.activeUsers },
  ]

  const contentDistribution = [
    { name: 'Flashcards', value: stats.totalFlashcards },
    { name: 'Quizzes', value: stats.totalQuizzes },
    { name: 'Redações', value: stats.totalEssays },
    { name: 'Cursos', value: stats.totalCourses },
    { name: 'Áudio', value: stats.totalAudioCourses },
  ]

  const activityData = [
    { day: 'Seg', atividades: 145 },
    { day: 'Ter', atividades: 167 },
    { day: 'Qua', atividades: 189 },
    { day: 'Qui', atividades: 203 },
    { day: 'Sex', atividades: 178 },
    { day: 'Sab', atividades: 95 },
    { day: 'Dom', atividades: 67 },
  ]

  const mainKPIs = [
    {
      label: 'Usuários Totais',
      value: stats.totalUsers,
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600 bg-blue-500/10',
    },
    {
      label: 'Usuários Ativos',
      value: stats.activeUsers,
      change: '+8%',
      trend: 'up',
      icon: Activity,
      color: 'text-green-600 bg-green-500/10',
    },
    {
      label: 'Turmas Ativas',
      value: stats.totalClasses,
      change: '+5%',
      trend: 'up',
      icon: GraduationCap,
      color: 'text-purple-600 bg-purple-500/10',
    },
    {
      label: 'Taxa de Conclusão',
      value: `${stats.completionRate}%`,
      change: '+3%',
      trend: 'up',
      icon: CheckCircle,
      color: 'text-orange-600 bg-orange-500/10',
    },
  ]

  const contentStats = [
    { label: 'Cursos', value: stats.totalCourses, icon: BookOpen },
    { label: 'Flashcards', value: stats.totalFlashcards, icon: Brain },
    { label: 'Quizzes', value: stats.totalQuizzes, icon: Target },
    { label: 'Redações', value: stats.totalEssays, icon: FileText },
    { label: 'Evercast', value: stats.totalAudioCourses, icon: Mic },
  ]

  const recentActivities = [
    { type: 'user', message: 'Novo aluno cadastrado', time: '5 min atrás', icon: Users },
    { type: 'essay', message: '3 redações aguardando correção', time: '15 min atrás', icon: FileText },
    { type: 'course', message: 'Curso "React Avançado" publicado', time: '1 hora atrás', icon: BookOpen },
    { type: 'achievement', message: '12 conquistas desbloqueadas hoje', time: '2 horas atrás', icon: Award },
    { type: 'class', message: 'Nova turma "2025.2" criada', time: '3 horas atrás', icon: GraduationCap },
  ]

  const alerts = [
    {
      type: 'warning',
      message: '5 redações pendentes há mais de 48h',
      action: 'Ver redações',
      link: '/admin/essays',
    },
    {
      type: 'info',
      message: 'Backup do sistema concluído com sucesso',
      action: null,
      link: null,
    },
  ]

  if (loading) {
    return <SectionLoader />
  }

  return (
    <MagicLayout
      title="Dashboard Admin"
      description="Visão executiva do sistema e métricas importantes"
    >
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <MagicCard variant="premium" size="lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/20">
                <Shield className="h-8 w-8 md:h-10 md:w-10 text-red-600" />
              </div>
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold">Bem-vindo, Admin</h1>
                  <Badge variant="outline" className="bg-red-500/10 border-red-500/20 text-red-600 w-fit">
                    <Shield className="h-3 w-3 mr-1" />
                    Administrador
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm md:text-base">
                  {profile?.first_name} {profile?.last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-600">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                Sistema Online
              </Badge>
            </div>
          </div>
        </MagicCard>

        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <MagicCard key={index} variant="glass">
                <div className="flex items-start gap-3">
                  <AlertCircle className={cn(
                    "h-5 w-5 mt-0.5",
                    alert.type === 'warning' ? "text-orange-600" : "text-blue-600"
                  )} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    {alert.action && (
                      <a href={alert.link || '#'} className="text-xs text-primary hover:underline mt-1 inline-block">
                        {alert.action} →
                      </a>
                    )}
                  </div>
                </div>
              </MagicCard>
            ))}
          </div>
        )}

        {/* KPIs Principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {mainKPIs.map((kpi, index) => (
            <MagicCard key={index} variant="glass" className="hover:scale-105 transition-transform">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={cn('p-2 rounded-lg', kpi.color)}>
                    <kpi.icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    {kpi.change}
                  </div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold mb-1">{kpi.value}</div>
                  <div className="text-xs md:text-sm font-medium text-muted-foreground">
                    {kpi.label}
                  </div>
                </div>
              </div>
            </MagicCard>
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
          {/* Crescimento de Usuários */}
          <MagicCard variant="glass" size="lg">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Crescimento de Usuários</h3>
                  <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
                </div>
              </div>
              <div className="h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="usuarios"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Total"
                    />
                    <Line
                      type="monotone"
                      dataKey="ativos"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Ativos"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </MagicCard>

          {/* Distribuição de Conteúdo */}
          <MagicCard variant="glass" size="lg">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Distribuição de Conteúdo</h3>
                  <p className="text-xs text-muted-foreground">Por tipo de recurso</p>
                </div>
              </div>
              <div className="h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contentDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
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
            </div>
          </MagicCard>

          {/* Atividade Semanal */}
          <MagicCard variant="glass" size="lg">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/10">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Atividade Semanal</h3>
                  <p className="text-xs text-muted-foreground">Interações dos usuários</p>
                </div>
              </div>
              <div className="h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="day" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="atividades" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </MagicCard>

          {/* Estatísticas de Conteúdo */}
          <MagicCard variant="glass" size="lg">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Conteúdo da Plataforma</h3>
                  <p className="text-xs text-muted-foreground">Recursos disponíveis</p>
                </div>
              </div>
              <div className="space-y-3">
                {contentStats.map((stat, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{stat.label}</span>
                    </div>
                    <span className="text-lg font-bold">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </MagicCard>
        </div>

        {/* Atividades Recentes */}
        <MagicCard variant="glass" size="lg">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Atividades Recentes</h3>
                <p className="text-xs text-muted-foreground">Últimas ações no sistema</p>
              </div>
            </div>
            <div className="space-y-2">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <activity.icon className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
