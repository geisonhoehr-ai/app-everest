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
  useSidebar,
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
  Tooltip,
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
      {
        href: '/admin/settings',
        label: 'Configurações',
        icon: Settings,
        badge: null
      },
    ]
  }
]

// Dark navy sidebar CSS variables — used for both admin and student in light mode
const darkNavySidebarStyle = {
  '--sidebar-background': '234 25% 18%',
  '--sidebar-foreground': '0 0% 95%',
  '--sidebar-accent': '234 25% 24%',
  '--sidebar-accent-foreground': '0 0% 100%',
  '--sidebar-border': '234 20% 26%',
  '--sidebar-primary': '25 95% 53%',
  '--sidebar-primary-foreground': '0 0% 100%',
  '--sidebar-ring': '25 95% 53%',
} as React.CSSProperties

export function UnifiedSidebar() {
  const { profile, signOut } = useAuth()
  const { hasFeature, loading: permissionsLoading } = useFeaturePermissions()
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

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
      if (item.adminOnly && !isAdministrator) return false
      return true
    })
  })).filter(group => group.items.length > 0)

  // Render a menu group (shared between admin and student)
  const renderMenuGroup = (
    group: { group: string; items: any[] },
    groupIndex: number,
    isActiveCheck: (href: string) => boolean,
  ) => (
    <SidebarGroup key={groupIndex} className="py-1">
      {group.group && (
        <SidebarGroupLabel className="text-[10px] font-semibold !text-white/60 uppercase tracking-[0.1em] px-3 mb-1">
          {group.group}
        </SidebarGroupLabel>
      )}
      <SidebarMenu>
        {group.items.map((item: any) => {
          const isActive = isActiveCheck(item.href)
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={item.label}
                className="w-full justify-start gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 text-white/80 hover:!text-white data-[active=true]:!text-white"
              >
                <Link to={item.href}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )

  return (
    <Sidebar collapsible="icon" className="border-r-0" style={darkNavySidebarStyle}>
      <SidebarHeader className={cn("p-5 pb-4", isCollapsed && "p-2 pb-2")}>
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shrink-0">
            <Mountain className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h1 className="text-base font-bold text-sidebar-foreground">
                Everest
              </h1>
              <p className="text-[11px] text-sidebar-foreground/50">
                {isAdmin ? 'Admin' : 'Plataforma de Estudos'}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={cn("px-3", isCollapsed && "px-1.5")}>
        {isAdmin ? (
          <>
            {visibleAdminMenuItems.map((group, i) =>
              renderMenuGroup(group, i, (href) =>
                href === '/admin'
                  ? location.pathname === href
                  : location.pathname.startsWith(href)
              )
            )}
          </>
        ) : (
          <>
            {visibleStudentGroups.map((group, i) =>
              renderMenuGroup(group, i, (href) => location.pathname === href)
            )}
          </>
        )}
      </SidebarContent>

      <SidebarFooter className={cn("p-3 space-y-2", isCollapsed && "p-1.5")}>
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
                    tooltip={item.label}
                    className="w-full justify-start gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 text-white/80 hover:!text-white data-[active=true]:!text-white"
                  >
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4 shrink-0" />
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
          "bg-sidebar-accent",
          isCollapsed && "p-2 justify-center"
        )}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={profile.avatar_url} alt={profile.first_name} />
            <AvatarFallback className="text-xs font-semibold bg-primary/20 text-primary">
              {profile.first_name?.[0]}{profile.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-sidebar-foreground/90">
                  {profile.first_name} {profile.last_name}
                </p>
                <p className="text-[10px] text-sidebar-foreground/40">
                  {profile.role === 'administrator' ? 'Administrador' :
                    profile.role === 'teacher' ? 'Professor' : 'Estudante'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md transition-colors shrink-0 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                title="Sair da conta"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
