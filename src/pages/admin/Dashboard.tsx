import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { logger } from '@/lib/logger'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Badge } from '@/components/ui/badge'
import { SectionLoader } from '@/components/SectionLoader'
import {
  getSystemStats,
  getUserGrowthData,
  getWeeklyActivityData,
  getRecentActivities,
  getSystemAlerts,
  getKPIChanges,
  type SystemStats,
  type UserGrowthData,
  type ActivityDataPoint,
  type RecentActivity,
  type Alert,
} from '@/services/adminStatsService'
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
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([])
  const [activityData, setActivityData] = useState<ActivityDataPoint[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [kpiChanges, setKpiChanges] = useState({
    users: { current: 0, previous: 0, change: '+0%', trend: 'stable' as const },
    activeUsers: { current: 0, previous: 0, change: '+0%', trend: 'stable' as const },
    classes: { current: 0, previous: 0, change: '+0%', trend: 'stable' as const },
    completionRate: { current: 0, previous: 0, change: '+0%', trend: 'stable' as const },
  })

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      const [
        statsData,
        growthData,
        weeklyData,
        activitiesData,
        alertsData,
        kpiData
      ] = await Promise.all([
        getSystemStats(),
        getUserGrowthData(),
        getWeeklyActivityData(),
        getRecentActivities(),
        getSystemAlerts(),
        getKPIChanges()
      ])

      setStats(statsData)
      setUserGrowthData(growthData)
      setActivityData(weeklyData)
      setRecentActivities(activitiesData)
      setAlerts(alertsData)
      setKpiChanges(kpiData)
    } catch (error) {
      logger.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const contentDistribution = [
    { name: 'Flashcards', value: stats.totalFlashcards },
    { name: 'Quizzes', value: stats.totalQuizzes },
    { name: 'Redações', value: stats.totalEssays },
    { name: 'Cursos', value: stats.totalCourses },
    { name: 'Áudio', value: stats.totalAudioCourses },
  ]

  const mainKPIs = [
    {
      label: 'Usuários Totais',
      value: stats.totalUsers,
      change: kpiChanges.users.change,
      trend: kpiChanges.users.trend,
      icon: Users,
      color: 'text-blue-600 bg-blue-500/10',
    },
    {
      label: 'Usuários Ativos',
      value: stats.activeUsers,
      change: kpiChanges.activeUsers.change,
      trend: kpiChanges.activeUsers.trend,
      icon: Activity,
      color: 'text-green-600 bg-green-500/10',
    },
    {
      label: 'Turmas Ativas',
      value: stats.totalClasses,
      change: kpiChanges.classes.change,
      trend: kpiChanges.classes.trend,
      icon: GraduationCap,
      color: 'text-purple-600 bg-purple-500/10',
    },
    {
      label: 'Taxa de Conclusão',
      value: `${stats.completionRate}%`,
      change: kpiChanges.completionRate.change,
      trend: kpiChanges.completionRate.trend,
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

  // Map icon strings to icon components
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      Users,
      FileText,
      BookOpen,
      Award,
      GraduationCap,
    }
    return iconMap[iconName] || Activity
  }

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
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  )}>
                    {kpi.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : kpi.trend === 'down' ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : null}
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
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => {
                  const IconComponent = getIconComponent(activity.icon)
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <IconComponent className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma atividade recente
                </p>
              )}
            </div>
          </div>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
