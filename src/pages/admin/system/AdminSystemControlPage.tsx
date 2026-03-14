import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { logger } from '@/lib/logger'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageTabs } from '@/components/PageTabs'
import { SectionLoader } from '@/components/SectionLoader'
import { getSystemStats, type SystemStats } from '@/services/adminStatsService'
import {
  Shield,
  Database,
  Users,
  GraduationCap,
  BookOpen,
  Brain,
  Target,
  FileText,
  Mic,
  Trophy,
  Settings,
  BarChart3,
  Calendar,
  Bell,
  Lock,
  Zap,
  Activity,
  HardDrive,
  Network,
  Server,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Eye,
  Key,
  Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Página de Controle Total do Sistema (APENAS ADMIN)
 *
 * Central de comando completa para administradores:
 * - Visão geral de todo o sistema
 * - Gerenciamento de usuários, turmas e permissões
 * - Monitoramento de recursos e performance
 * - Controle de features e configurações globais
 * - Estatísticas e relatórios em tempo real
 */

interface SystemStat {
  label: string
  value: string | number
  icon: React.ElementType
  change?: string
  status: 'success' | 'warning' | 'error' | 'info'
  description: string
}

export default function AdminSystemControlPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
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
    completionRate: 0
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getSystemStats()
      setStats(data)
    } catch (error) {
      logger.error('Error loading system stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Estatísticas principais do sistema
  const systemStats: SystemStat[] = [
    {
      label: 'Usuários Totais',
      value: stats.totalUsers,
      icon: Users,
      status: 'success',
      description: 'Total de usuários no sistema'
    },
    {
      label: 'Turmas',
      value: stats.totalClasses,
      icon: GraduationCap,
      status: 'info',
      description: 'Turmas cadastradas e ativas'
    },
    {
      label: 'Cursos',
      value: stats.totalCourses,
      icon: BookOpen,
      status: 'success',
      description: 'Cursos disponíveis na plataforma'
    },
    {
      label: 'Taxa de Conclusão',
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      status: 'success',
      description: 'Média de conclusão de atividades'
    },
    {
      label: 'Flashcards',
      value: stats.totalFlashcards.toLocaleString(),
      icon: Brain,
      status: 'info',
      description: 'Total de flashcards no sistema'
    },
    {
      label: 'Quizzes',
      value: stats.totalQuizzes,
      icon: Target,
      status: 'info',
      description: 'Quizzes criados'
    },
    {
      label: 'Redações',
      value: stats.totalEssays,
      icon: FileText,
      status: 'success',
      description: 'Redações submetidas'
    },
    {
      label: 'Evercast',
      value: stats.totalAudioCourses,
      icon: Mic,
      status: 'info',
      description: 'Aulas em áudio disponíveis'
    },
  ]

  // Estatísticas de performance (based on real data we can access)
  const performanceStats = [
    {
      label: 'Alunos',
      value: stats.totalStudents,
      status: 'success',
      icon: Users,
      description: 'Alunos cadastrados'
    },
    {
      label: 'Professores',
      value: stats.totalTeachers,
      status: 'info',
      icon: GraduationCap,
      description: 'Professores ativos'
    },
    {
      label: 'Administradores',
      value: stats.totalAdministrators,
      status: 'info',
      icon: Shield,
      description: 'Admins do sistema'
    },
    {
      label: 'Conclusão',
      value: `${stats.completionRate}%`,
      status: stats.completionRate >= 50 ? 'success' : 'warning',
      icon: TrendingUp,
      description: 'Taxa de conclusão geral'
    },
  ]

  // Módulos do sistema
  const systemModules = [
    {
      name: 'Gestão de Usuários',
      icon: Users,
      status: 'active',
      link: '/admin/management',
      description: 'Criar, editar e gerenciar usuários, professores e alunos'
    },
    {
      name: 'Gestão de Turmas',
      icon: GraduationCap,
      status: 'active',
      link: '/admin/classes',
      description: 'Gerenciar turmas, matricular alunos e definir permissões'
    },
    {
      name: 'Controle de Permissões',
      icon: Lock,
      status: 'active',
      link: '/admin/permissions',
      description: 'Configurar permissões de recursos por turma'
    },
    {
      name: 'Cursos e Conteúdo',
      icon: BookOpen,
      status: 'active',
      link: '/admin/courses',
      description: 'Gerenciar cursos, módulos e aulas'
    },
    {
      name: 'Flashcards',
      icon: Brain,
      status: 'active',
      link: '/admin/flashcards',
      description: 'Criar e gerenciar flashcards por matéria e tópico'
    },
    {
      name: 'Quizzes',
      icon: Target,
      status: 'active',
      link: '/admin/quizzes',
      description: 'Criar quizzes e gerenciar questões'
    },
    {
      name: 'Redações',
      icon: FileText,
      status: 'active',
      link: '/admin/essays',
      description: 'Gerenciar temas e correções de redações'
    },
    {
      name: 'Evercast',
      icon: Mic,
      status: 'active',
      link: '/admin/evercast',
      description: 'Gerenciar aulas em áudio'
    },
    {
      name: 'Relatórios',
      icon: BarChart3,
      status: 'active',
      link: '/admin/reports',
      description: 'Visualizar relatórios e estatísticas detalhadas'
    },
    {
      name: 'Calendário',
      icon: Calendar,
      status: 'active',
      link: '/admin/calendar',
      description: 'Gerenciar eventos e agenda'
    },
    {
      name: 'Gamificação',
      icon: Trophy,
      status: 'active',
      link: '/admin/gamification',
      description: 'Gerenciar conquistas, ranking e XP'
    },
    {
      name: 'Configurações',
      icon: Settings,
      status: 'active',
      link: '/admin/settings',
      description: 'Configurações globais do sistema'
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-500/10 border-green-500/20'
      case 'warning':
        return 'text-orange-600 bg-orange-500/10 border-orange-500/20'
      case 'error':
        return 'text-red-600 bg-red-500/10 border-red-500/20'
      case 'info':
      default:
        return 'text-blue-600 bg-blue-500/10 border-blue-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      case 'warning':
        return <AlertCircle className="h-4 w-4" />
      case 'error':
        return <XCircle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return <SectionLoader />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Controle Total do Sistema</h1>
        <p className="text-muted-foreground">Central de comando completa para administradores. Monitore e gerencie todos os aspectos da plataforma.</p>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header com info do Admin */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-red-500/10 border border-red-500/20">
                  <Shield className="h-8 w-8 md:h-10 md:w-10 text-red-600" />
                </div>
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Controle Total</h1>
                    <Badge variant="outline" className="bg-red-500/10 border-red-500/20 text-red-600 w-fit">
                      <Shield className="h-3 w-3 mr-1" />
                      Administrador
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
                    Acesso total ao sistema • {profile?.first_name} {profile?.last_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-600 text-xs md:text-sm">
                  <Activity className="h-3 w-3 mr-1 animate-pulse" />
                  Sistema Online
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <PageTabs
          value={activeTab}
          onChange={setActiveTab}
          layout={4}
          tabs={[
            {
              value: 'overview',
              label: 'Visão Geral',
              icon: <Eye className="h-4 w-4" />,
              content: (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {systemStats.map((stat, index) => (
                    <Card key={index} className="border-border shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className={cn(
                              'p-2 rounded-lg',
                              getStatusColor(stat.status)
                            )}>
                              <stat.icon className="h-5 w-5" />
                            </div>
                            {stat.change && (
                              <Badge variant="outline" className={getStatusColor(stat.status)}>
                                {stat.change}
                              </Badge>
                            )}
                          </div>
                          <div>
                            <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                            <div className="text-xs md:text-sm font-medium text-muted-foreground">
                              {stat.label}
                            </div>
                            <div className="text-xs text-muted-foreground/70 mt-1 hidden lg:block">
                              {stat.description}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ),
            },
            {
              value: 'modules',
              label: 'Módulos',
              icon: <Layers className="h-4 w-4" />,
              content: (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {systemModules.map((module, index) => (
                    <Card
                      key={index}
                      className="border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => navigate(module.link)}
                    >
                      <CardContent className="p-5">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="p-3 rounded-xl bg-muted/50 group-hover:bg-muted transition-all">
                              <module.icon className="h-6 w-6 text-primary" />
                            </div>
                            <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-600">
                              {getStatusIcon(module.status)}
                              Ativo
                            </Badge>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                              {module.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {module.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ),
            },
            {
              value: 'performance',
              label: 'Performance',
              icon: <Server className="h-4 w-4" />,
              content: (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {performanceStats.map((stat, index) => (
                      <Card key={index} className="border-border shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className={cn(
                                'p-2 rounded-lg',
                                getStatusColor(stat.status)
                              )}>
                                <stat.icon className="h-5 w-5" />
                              </div>
                              {getStatusIcon(stat.status)}
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                              <div className="text-sm font-medium text-muted-foreground">
                                {stat.label}
                              </div>
                              <div className="text-xs text-muted-foreground/70 mt-1">
                                {stat.description}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="border-border shadow-sm">
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Database className="h-6 w-6 text-primary" />
                          <div>
                            <h3 className="text-xl font-bold text-foreground">Status do Banco de Dados</h3>
                            <p className="text-sm text-muted-foreground">
                              Supabase — sa-east-1
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                            <div className="text-2xl font-bold text-green-600 mb-1">Conectado</div>
                            <div className="text-xs text-muted-foreground">Status da Conexão</div>
                          </div>
                          <div className="text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <div className="text-2xl font-bold text-blue-600 mb-1">{stats.totalUsers}</div>
                            <div className="text-xs text-muted-foreground">Registros de Usuários</div>
                          </div>
                          <div className="text-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <div className="text-2xl font-bold text-purple-600 mb-1">{stats.totalCourses + stats.totalFlashcards + stats.totalQuizzes}</div>
                            <div className="text-xs text-muted-foreground">Registros de Conteúdo</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ),
            },
            {
              value: 'permissions',
              label: 'Permissões',
              icon: <Key className="h-4 w-4" />,
              content: (
                <Card className="border-border shadow-sm">
                  <CardContent className="p-5">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <Lock className="h-6 w-6 text-primary" />
                        <div>
                          <h3 className="text-xl font-bold text-foreground">Gerenciamento de Permissões</h3>
                          <p className="text-sm text-muted-foreground">
                            Controle granular de acesso por turma e recurso
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="p-4 rounded-xl border border-border bg-muted/50">
                          <div className="flex items-center gap-3 mb-3">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            <h4 className="font-semibold text-foreground">Permissões por Turma</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Configure quais recursos cada turma pode acessar (flashcards, quiz, evercast, etc.)
                          </p>
                          <Button className="w-full">
                            <Settings className="h-4 w-4 mr-2" />
                            Gerenciar Permissões
                          </Button>
                        </div>

                        <div className="p-4 rounded-xl border border-border bg-muted/50">
                          <div className="flex items-center gap-3 mb-3">
                            <Users className="h-5 w-5 text-primary" />
                            <h4 className="font-semibold text-foreground">Permissões por Perfil</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Gerencie permissões baseadas em perfis (Aluno, Professor, Admin)
                          </p>
                          <Button className="w-full" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Perfis
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-blue-600 mb-1">Sobre Permissões</h4>
                            <p className="text-sm text-muted-foreground">
                              Alunos têm acesso controlado por turma via <code className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 text-xs font-mono">class_feature_permissions</code>.
                              Professores e Administradores têm acesso total a todos os recursos.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
