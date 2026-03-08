import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useFeaturePermissions } from '@/hooks/use-feature-permissions'
import { FEATURE_KEYS } from '@/services/classPermissionsService'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Layers,
  Users,
  ListChecks,
  Radio,
  FileText,
  ClipboardCheck,
  Settings,
  HelpCircle,
  LogOut,
  Mountain,
  UserCog,
  Archive,
  ArrowLeft,
  Brain,
  Target,
  Mic,
  MessageSquare,
  BarChart3,
  Shield,
  GraduationCap,
  UserCheck,
  PlayCircle,
  Award,
  TrendingUp,
  Zap,
  Trophy,
  Lock,
  Plug,
  Search
} from 'lucide-react'

// Menu items for students (com feature_key para controle de permissões)
// null = 🟢 PADRÃO - SEMPRE VISÍVEL para todos os alunos
// feature_key = 🔒 CONTROLADO POR TURMA (via class_feature_permissions)
const studentMenuItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    featureKey: null, // 🟢 PADRÃO - Sempre visível
  },
  {
    label: 'Calendário',
    href: '/calendario',
    icon: Calendar,
    featureKey: null, // 🟢 PADRÃO - Sempre visível
  },
  {
    label: 'Meus Cursos',
    href: '/courses',
    icon: BookOpen,
    featureKey: FEATURE_KEYS.VIDEO_LESSONS, // 🔒 Controlado por turma
  },
  {
    label: 'Flashcards',
    href: '/flashcards',
    icon: Brain,
    featureKey: FEATURE_KEYS.FLASHCARDS, // 🔒 Controlado por turma
  },
  {
    label: 'Banco de Questões',
    href: '/banco-de-questoes',
    icon: Search,
    featureKey: FEATURE_KEYS.QUIZ, // 🔒 Controlado por turma (usando mesma key de quiz por enquanto)
  },
  {
    label: 'Simulados',
    href: '/simulados',
    icon: ClipboardCheck,
    featureKey: FEATURE_KEYS.QUIZ, // 🔒 Controlado por turma
  },
  {
    label: 'Redações',
    href: '/redacoes',
    icon: FileText,
    featureKey: FEATURE_KEYS.ESSAYS, // 🔒 Controlado por turma
  },
  {
    label: 'Acervo Digital',
    href: '/acervo',
    icon: Archive,
    featureKey: null, // 🟢 PADRÃO - Sempre visível
  },
  {
    label: 'Evercast',
    href: '/evercast',
    icon: Mic,
    featureKey: FEATURE_KEYS.EVERCAST, // 🔒 Controlado por turma
  },
  {
    label: 'Comunidade',
    href: '/forum',
    icon: MessageSquare,
    featureKey: null, // 🟢 PADRÃO - Sempre visível
  },
  {
    label: 'Conquistas',
    href: '/achievements',
    icon: Award,
    featureKey: null, // 🟢 PADRÃO - Sempre visível
  },
  {
    label: 'Ranking',
    href: '/ranking',
    icon: Trophy,
    featureKey: null, // 🟢 PADRÃO - Sempre visível
  },
  {
    label: 'Plano de Estudos',
    href: '/study-planner',
    icon: Calendar,
    featureKey: null, // 🟢 PADRÃO - Sempre visível
  },
  {
    label: 'Progresso',
    href: '/progresso',
    icon: TrendingUp,
    featureKey: null, // 🟢 PADRÃO - Sempre visível
  },
  {
    label: 'Notificações',
    href: '/notificacoes',
    icon: Radio,
    featureKey: null, // 🟢 PADRÃO - Sempre visível
  },
  {
    label: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
    featureKey: null, // 🟢 PADRÃO - Sempre visível
  },
]

// Menu items for teachers and administrators
const adminMenuItems = [
  {
    group: 'Principal',
    items: [
      {
        href: '/admin',
        label: 'Dashboard',
        icon: LayoutDashboard,
        badge: null
      },
      {
        href: '/admin/system-control',
        label: 'Controle Total',
        icon: Shield,
        badge: null,
        adminOnly: true
      },
      {
        href: '/admin/management',
        label: 'Usuários',
        icon: UserCog,
        badge: null
      },
      {
        href: '/admin/permissions',
        label: 'Permissões',
        icon: Lock,
        badge: null,
        adminOnly: true
      },
    ]
  },
  {
    group: 'Conteúdo',
    items: [
      {
        href: '/admin/courses',
        label: 'Cursos',
        icon: BookOpen,
        badge: null
      },
      {
        href: '/admin/flashcards',
        label: 'Flashcards',
        icon: Brain,
        badge: null
      },
      {
        href: '/admin/quizzes',
        label: 'Quizzes',
        icon: Target,
        badge: null
      },
      {
        href: '/admin/essays',
        label: 'Redações',
        icon: FileText,
        badge: null
      },
      {
        href: '/admin/simulations',
        label: 'Simulados',
        icon: ClipboardCheck,
        badge: null
      },
      {
        href: '/admin/evercast',
        label: 'Evercast',
        icon: Mic,
        badge: null
      },
    ]
  },
  {
    group: 'Relatórios',
    items: [
      {
        href: '/admin/reports',
        label: 'Relatórios',
        icon: BarChart3,
        badge: null
      },
    ]
  },
  {
    group: 'Sistema',
    items: [
      {
        href: '/admin/integrations',
        label: 'Integrações',
        icon: Plug,
        badge: null,
        adminOnly: true
      },
      {
        href: '/admin/settings',
        label: 'Configurações',
        icon: Settings,
        badge: null
      },
    ]
  }
]

export function UnifiedSidebar() {
  const { profile, signOut } = useAuth()
  const { hasFeature, loading: permissionsLoading } = useFeaturePermissions()
  const location = useLocation()

  if (!profile) return null

  const isAdministrator = profile.role === 'administrator'
  const isTeacher = profile.role === 'teacher'
  const isAdmin = isAdministrator || isTeacher
  const isStudent = profile.role === 'student'

  const handleLogout = () => {
    signOut()
  }

  // Filtra os itens do menu de alunos baseado nas permissões
  const visibleStudentMenuItems = isStudent
    ? studentMenuItems.filter(item => {
      // Se não tem featureKey, sempre mostra
      if (!item.featureKey) return true
      // Se ainda está carregando permissões, não mostra itens com permissão
      if (permissionsLoading) return false
      // Verifica se tem permissão
      return hasFeature(item.featureKey)
    })
    : studentMenuItems

  // Filtra itens admin-only do menu (professores não veem)
  const visibleAdminMenuItems = adminMenuItems.map(group => ({
    ...group,
    items: group.items.filter(item => {
      // Se tem adminOnly e o usuário é professor (não admin), não mostra
      if (item.adminOnly && !isAdministrator) return false
      return true
    })
  })).filter(group => group.items.length > 0) // Remove grupos vazios

  return (
    <Sidebar className="border-r border-border/50 bg-card/50 backdrop-blur-sm">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
            <Mountain className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Everest
            </h1>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? 'Painel Administrativo' : 'Plataforma de Estudos'}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        {isAdmin ? (
          // Admin/Teacher Menu Structure
          <>
            {visibleAdminMenuItems.map((group, groupIndex) => (
              <SidebarGroup key={groupIndex}>
                <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.group}
                </SidebarGroupLabel>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={cn(
                            "w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          )}
                        >
                          <Link to={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-auto">
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </>
        ) : (
          // Student Menu Structure (com filtro de permissões)
          <SidebarMenu>
            {visibleStudentMenuItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={cn(
                      "w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="space-y-4">
          {/* User Profile Section */}
          <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 p-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile.avatar_url} alt={profile.first_name} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {profile.first_name} {profile.last_name}
              </p>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs font-medium",
                    profile.role === 'administrator'
                      ? "bg-gradient-to-r from-red-500/10 to-red-600/5 border-red-500/20 text-red-600"
                      : profile.role === 'teacher'
                        ? "bg-gradient-to-r from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-600"
                        : "bg-gradient-to-r from-green-500/10 to-green-600/5 border-green-500/20 text-green-600"
                  )}
                >
                  {profile.role === 'administrator' && <Shield className="h-3 w-3 mr-1" />}
                  {profile.role === 'teacher' && <GraduationCap className="h-3 w-3 mr-1" />}
                  {profile.role === 'student' && <UserCheck className="h-3 w-3 mr-1" />}
                  {profile.role === 'administrator' ? 'Admin' :
                    profile.role === 'teacher' ? 'Professor' : 'Estudante'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
