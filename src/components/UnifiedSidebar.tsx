import { Link, useLocation, useNavigate } from 'react-router-dom'
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
  Users,
  Radio,
  FileText,
  ClipboardCheck,
  Settings,
  LogOut,
  Mountain,
  Archive,
  Brain,
  Target,
  Mic,
  MessageSquare,
  BarChart3,
  Shield,
  GraduationCap,
  Award,
  TrendingUp,
  Trophy,
  Lock,
  Plug,
  Search,
  Bell,
} from 'lucide-react'

// Student menu: grouped structure
// featureKey null = always visible, otherwise controlled by class permissions
type StudentMenuItem = {
  label: string
  href: string
  icon: any
  featureKey: string | null
}

type StudentMenuGroup = {
  group: string
  items: StudentMenuItem[]
}

const studentMenuGroups: StudentMenuGroup[] = [
  {
    group: '',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, featureKey: null },
    ],
  },
  {
    group: 'Estudos',
    items: [
      { label: 'Meus Cursos', href: '/courses', icon: BookOpen, featureKey: FEATURE_KEYS.VIDEO_LESSONS },
      { label: 'Flashcards', href: '/flashcards', icon: Brain, featureKey: FEATURE_KEYS.FLASHCARDS },
      { label: 'Banco de Questões', href: '/banco-de-questoes', icon: Search, featureKey: FEATURE_KEYS.QUIZ },
    ],
  },
  {
    group: 'Avaliações',
    items: [
      { label: 'Simulados', href: '/simulados', icon: ClipboardCheck, featureKey: FEATURE_KEYS.QUIZ },
      { label: 'Redações', href: '/redacoes', icon: FileText, featureKey: FEATURE_KEYS.ESSAYS },
    ],
  },
  {
    group: 'Conteúdo',
    items: [
      { label: 'Acervo Digital', href: '/acervo', icon: Archive, featureKey: null },
      { label: 'Evercast', href: '/evercast', icon: Mic, featureKey: FEATURE_KEYS.EVERCAST },
    ],
  },
  {
    group: 'Agenda',
    items: [
      { label: 'Calendário', href: '/calendario', icon: Calendar, featureKey: null },
      { label: 'Plano de Estudos', href: '/study-planner', icon: Target, featureKey: null },
    ],
  },
  {
    group: 'Desempenho',
    items: [
      { label: 'Progresso', href: '/progresso', icon: TrendingUp, featureKey: null },
      { label: 'Ranking', href: '/ranking', icon: Trophy, featureKey: null },
      { label: 'Conquistas', href: '/achievements', icon: Award, featureKey: null },
    ],
  },
]

// Footer items shown below the main menu
const studentFooterItems: StudentMenuItem[] = [
  { label: 'Comunidade', href: '/forum', icon: MessageSquare, featureKey: null },
  { label: 'Notificações', href: '/notificacoes', icon: Bell, featureKey: null },
  { label: 'Configurações', href: '/configuracoes', icon: Settings, featureKey: null },
]

// Menu items for teachers and administrators
const adminMenuItems = [
  {
    group: '',
    items: [
      {
        href: '/admin',
        label: 'Dashboard',
        icon: LayoutDashboard,
        badge: null
      },
    ]
  },
  {
    group: 'Pessoas',
    items: [
      {
        href: '/admin/management',
        label: 'Usuários',
        icon: Users,
        badge: null
      },
      {
        href: '/admin/classes',
        label: 'Turmas',
        icon: GraduationCap,
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
    group: 'Agenda',
    items: [
      {
        href: '/admin/calendar',
        label: 'Calendário',
        icon: Calendar,
        badge: null
      },
    ]
  },
  {
    group: 'Análise',
    items: [
      {
        href: '/admin/reports',
        label: 'Relatórios',
        icon: BarChart3,
        badge: null
      },
      {
        href: '/admin/gamification',
        label: 'Gamificação',
        icon: Trophy,
        badge: null,
        adminOnly: true
      },
    ]
  },
  {
    group: 'Sistema',
    items: [
      {
        href: '/admin/system-control',
        label: 'Controle Total',
        icon: Shield,
        badge: null,
        adminOnly: true
      },
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
  const navigate = useNavigate()

  if (!profile) return null

  const isAdministrator = profile.role === 'administrator'
  const isTeacher = profile.role === 'teacher'
  const isAdmin = isAdministrator || isTeacher
  const isStudent = profile.role === 'student'

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  // Filter student menu groups based on permissions
  const filterStudentItems = (items: StudentMenuItem[]) =>
    items.filter(item => {
      if (!item.featureKey) return true
      if (isStudent && permissionsLoading) return false
      if (isStudent) return hasFeature(item.featureKey)
      return true
    })

  const visibleStudentGroups = studentMenuGroups
    .map(group => ({ ...group, items: filterStudentItems(group.items) }))
    .filter(group => group.items.length > 0)

  const visibleStudentFooter = filterStudentItems(studentFooterItems)

  // Filtra itens admin-only do menu (professores não veem)
  const visibleAdminMenuItems = adminMenuItems.map(group => ({
    ...group,
    items: group.items.filter(item => {
      // Se tem adminOnly e o usuário é professor (não admin), não mostra
      if (item.adminOnly && !isAdministrator) return false
      return true
    })
  })).filter(group => group.items.length > 0) // Remove grupos vazios

  // Admin uses dark sidebar — override CSS variables so Shadcn's built-in
  // bg-sidebar / text-sidebar-foreground / accent classes all resolve to dark theme values
  const adminSidebarStyle = isAdmin
    ? {
        '--sidebar-background': '234 25% 18%',         // slightly lighter navy
        '--sidebar-foreground': '0 0% 95%',             // near-white
        '--sidebar-accent': '234 25% 24%',              // lighter navy for hover/active
        '--sidebar-accent-foreground': '0 0% 100%',     // pure white
        '--sidebar-border': '234 20% 26%',              // subtle border
        '--sidebar-primary': '25 95% 53%',              // brand orange
        '--sidebar-primary-foreground': '0 0% 100%',
        '--sidebar-ring': '25 95% 53%',
      } as React.CSSProperties
    : undefined

  const adminSidebarClasses = isAdmin
    ? "border-r-0"
    : "border-r border-border/50 bg-card/50 backdrop-blur-sm"

  return (
    <Sidebar className={adminSidebarClasses} style={adminSidebarStyle}>
      <SidebarHeader className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            isAdmin ? "bg-primary" : "bg-gradient-to-br from-primary to-primary/80"
          )}>
            <Mountain className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className={cn(
              "text-base font-bold",
              isAdmin ? "text-sidebar-foreground" : "text-foreground"
            )}>
              Everest
            </h1>
            <p className={cn(
              "text-[11px]",
              isAdmin ? "text-sidebar-foreground/50" : "text-muted-foreground"
            )}>
              {isAdmin ? 'Admin' : 'Plataforma de Estudos'}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        {isAdmin ? (
          // Admin/Teacher Menu - Professional dark sidebar
          <>
            {visibleAdminMenuItems.map((group, groupIndex) => (
              <SidebarGroup key={groupIndex} className="py-1">
                {group.group && (
                  <SidebarGroupLabel className="text-[10px] font-semibold !text-white/60 uppercase tracking-[0.1em] px-3 mb-1">
                    {group.group}
                  </SidebarGroupLabel>
                )}
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href ||
                      (item.href !== '/admin' && location.pathname.startsWith(item.href))
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="w-full justify-start gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 text-white/80 hover:!text-white data-[active=true]:!text-white"
                        >
                          <Link to={item.href}>
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-auto text-[10px] bg-sidebar-accent text-sidebar-foreground/70 border-0">
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
          // Student Menu - Grouped structure
          <>
            {visibleStudentGroups.map((group, groupIndex) => (
              <SidebarGroup key={groupIndex} className="py-1">
                {group.group && (
                  <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.1em] px-3 mb-1">
                    {group.group}
                  </SidebarGroupLabel>
                )}
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
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        {/* Student footer nav items */}
        {!isAdmin && visibleStudentFooter.length > 0 && (
          <SidebarMenu>
            {visibleStudentFooter.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={cn(
                      "w-full justify-start gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200",
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
        <div className={cn(
          "flex items-center gap-3 rounded-lg p-3",
          isAdmin ? "bg-sidebar-accent" : "bg-muted/50"
        )}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.avatar_url} alt={profile.first_name} />
            <AvatarFallback className="text-xs font-semibold bg-primary/20 text-primary">
              {profile.first_name?.[0]}{profile.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-xs font-medium truncate",
              isAdmin ? "text-sidebar-foreground/90" : "text-foreground"
            )}>
              {profile.first_name} {profile.last_name}
            </p>
            <p className={cn(
              "text-[10px]",
              isAdmin ? "text-sidebar-foreground/40" : "text-muted-foreground"
            )}>
              {profile.role === 'administrator' ? 'Administrador' :
                profile.role === 'teacher' ? 'Professor' : 'Estudante'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              "p-1.5 rounded-md transition-colors shrink-0",
              isAdmin
                ? "text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                : "text-muted-foreground hover:text-red-600 hover:bg-red-500/10"
            )}
            title="Sair da conta"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
