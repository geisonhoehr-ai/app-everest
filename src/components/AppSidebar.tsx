import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useFeaturePermissions } from '@/hooks/use-feature-permissions'
import { FEATURE_KEYS, type FeatureKey } from '@/services/classPermissionsService'
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
  TrendingUp,
  Trophy,
  Award,
  CalendarDays,
  MessageSquare,
} from 'lucide-react'

type MenuItem = {
  label: string
  href: string
  icon: any
  featureKey?: FeatureKey
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Meus Cursos',
    href: '/meus-cursos',
    icon: BookOpen,
    featureKey: FEATURE_KEYS.VIDEO_LESSONS,
  },
  {
    label: 'Calendário',
    href: '/calendario',
    icon: Calendar,
    featureKey: FEATURE_KEYS.CALENDAR,
  },
  {
    label: 'Flashcards',
    href: '/flashcards',
    icon: Layers,
    featureKey: FEATURE_KEYS.FLASHCARDS,
  },
  {
    label: 'Quizzes',
    href: '/quizzes',
    icon: ListChecks,
    featureKey: FEATURE_KEYS.QUIZ,
  },
  {
    label: 'Evercast',
    href: '/evercast',
    icon: Radio,
    featureKey: FEATURE_KEYS.EVERCAST,
  },
  {
    label: 'Redações',
    href: '/redacoes',
    icon: FileText,
    featureKey: FEATURE_KEYS.ESSAYS,
  },
  {
    label: 'Simulados',
    href: '/simulados',
    icon: ClipboardCheck,
    featureKey: FEATURE_KEYS.QUIZ,
  },
  {
    label: 'Meu Progresso',
    href: '/progresso',
    icon: TrendingUp,
  },
  {
    label: 'Ranking',
    href: '/ranking',
    icon: Trophy,
    featureKey: FEATURE_KEYS.RANKING,
  },
  {
    label: 'Conquistas',
    href: '/conquistas',
    icon: Award,
  },
  {
    label: 'Planejamento',
    href: '/planejamento',
    icon: CalendarDays,
    featureKey: FEATURE_KEYS.CALENDAR,
  },
  {
    label: 'Fórum',
    href: '/forum',
    icon: MessageSquare,
  },
]

const bottomMenuItems = [
  {
    label: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
  },
  {
    label: 'Ajuda',
    href: '/faq',
    icon: HelpCircle,
  },
]

export function AppSidebar() {
  const location = useLocation()
  const { profile, signOut, isAdmin, isTeacher, isStudent } = useAuth()
  const { hasFeature } = useFeaturePermissions()

  const isActive = (href: string) => {
    return location.pathname === href
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getInitials = () => {
    if (!profile) return 'U'
    const firstName = profile.first_name || ''
    const lastName = profile.last_name || ''
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U'
  }

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black"
    >
      <SidebarHeader className="border-b border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-black">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-gray-900 dark:bg-white">
            <Mountain className="h-6 w-6 text-white dark:text-gray-900" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Everest
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
              Education Platform
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-grow p-4">
        <SidebarMenu className="space-y-2">
          {menuItems
            .filter((item) => {
              // Se não tem featureKey, sempre mostra
              if (!item.featureKey) return true

              // Se for admin ou teacher, mostra tudo
              if (isAdmin || isTeacher) return true

              // Se for aluno, verifica permissão
              if (isStudent) {
                return hasFeature(item.featureKey)
              }

              return true
            })
            .map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                className={cn(
                  "group relative transition-all duration-300 ease-out",
                  "hover:bg-gray-50 dark:hover:bg-gray-900",
                  "rounded-2xl p-4 h-auto border border-transparent",
                  "hover:border-gray-200 dark:hover:border-gray-800",
                  isActive(item.href) && [
                    "bg-gray-50 dark:bg-gray-900",
                    "text-gray-900 dark:text-white",
                    "border-gray-200 dark:border-gray-800",
                    "shadow-sm"
                  ]
                )}
              >
                <Link to={item.href} className="flex items-center gap-4 w-full">
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-300 ease-out",
                    "group-hover:bg-gray-100 dark:group-hover:bg-gray-800",
                    isActive(item.href) && "bg-gray-100 dark:bg-gray-800"
                  )}>
                    <item.icon className={cn(
                      "h-5 w-5 transition-colors duration-300 ease-out",
                      isActive(item.href) && "text-gray-900 dark:text-white"
                    )} />
                  </div>
                  <span className={cn(
                    "transition-colors duration-300 ease-out font-medium text-sm flex-1",
                    isActive(item.href) && "text-gray-900 dark:text-white"
                  )}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <Badge
                      variant="default"
                      className={cn(
                        "text-xs border-0 px-2 py-1 rounded-full",
                        "bg-blue-500 text-white"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-4 bg-white dark:bg-black">
        <SidebarMenu className="space-y-2">
          {bottomMenuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                className={cn(
                  "group relative transition-all duration-300 ease-out",
                  "hover:bg-gray-50 dark:hover:bg-gray-900",
                  "rounded-2xl p-4 h-auto border border-transparent",
                  "hover:border-gray-200 dark:hover:border-gray-800",
                  isActive(item.href) && [
                    "bg-gray-50 dark:bg-gray-900",
                    "text-gray-900 dark:text-white",
                    "shadow-sm"
                  ]
                )}
              >
                <Link to={item.href} className="flex items-center gap-4 w-full">
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-300 ease-out",
                    "group-hover:bg-gray-100 dark:group-hover:bg-gray-800",
                    isActive(item.href) && "bg-gray-100 dark:bg-gray-800"
                  )}>
                    <item.icon className={cn(
                      "h-5 w-5 transition-colors duration-300 ease-out",
                      isActive(item.href) && "text-gray-900 dark:text-white"
                    )} />
                  </div>
                  <span className={cn(
                    "transition-colors duration-300 ease-out font-medium text-sm",
                    isActive(item.href) && "text-gray-900 dark:text-white"
                  )}>
                    {item.label}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          <SidebarSeparator className="my-4" />

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className={cn(
                "group relative transition-all duration-300 ease-out",
                "hover:bg-red-50 dark:hover:bg-red-900/20",
                "rounded-2xl p-4 h-auto text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300",
                "border border-transparent hover:border-red-200 dark:hover:border-red-800"
              )}
            >
              <div className="p-2 rounded-xl transition-all duration-300 ease-out group-hover:bg-red-100 dark:group-hover:bg-red-900/30">
                <LogOut className="h-5 w-5" />
              </div>
              <span className="transition-colors duration-300 ease-out font-medium text-sm">
                Sair
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User Profile - Apple Style */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={`https://img.usecurling.com/ppl/medium?seed=${profile?.id}`}
              alt="Avatar"
              className="object-cover"
            />
            <AvatarFallback className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {profile?.email}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}