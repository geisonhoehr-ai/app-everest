import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useFeaturePermissions } from '@/hooks/use-feature-permissions'
import { FEATURE_KEYS, type FeatureKey } from '@/services/classPermissionsService'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { SheetClose } from '@/components/ui/sheet'
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
  Shield,
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
    // Dashboard sempre visível
  },
  // {
  //   label: 'Meus Cursos',
  //   href: '/meus-cursos',
  //   icon: BookOpen,
  //   featureKey: FEATURE_KEYS.VIDEO_LESSONS,
  // },
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
    // Progresso sempre visível
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
    // Conquistas sempre visível
  },
  {
    label: 'Planejamento',
    href: '/planejamento',
    icon: CalendarDays,
    featureKey: FEATURE_KEYS.CALENDAR,
  },
  // {
  //   label: 'Fórum',
  //   href: '/forum',
  //   icon: MessageSquare,
  //   // Fórum sempre visível
  // },
]

const adminMenuItems = [
  {
    label: 'Dashboard Admin',
    href: '/admin',
    icon: Shield,
  },
  {
    label: 'Controle Total',
    href: '/admin/system-control',
    icon: Settings,
    adminOnly: true,
  },
  {
    label: 'Gestão de Usuários',
    href: '/admin/management',
    icon: Users,
    adminOnly: true,
  },
]

const contentMenuItems = [
  {
    label: 'Gerenciar Flashcards',
    href: '/admin/flashcards',
    icon: Layers,
  },
  {
    label: 'Gerenciar Quizzes',
    href: '/admin/quizzes',
    icon: ListChecks,
  },
  {
    label: 'Gerenciar Cursos',
    href: '/admin/courses',
    icon: BookOpen,
  },
  {
    label: 'Gerenciar Simulados',
    href: '/admin/simulations',
    icon: ClipboardCheck,
  },
  {
    label: 'Gerenciar Redações',
    href: '/admin/essays',
    icon: FileText,
  },
  {
    label: 'Gerenciar Evercast',
    href: '/admin/evercast',
    icon: Radio,
  },
]

export const MobileSidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut, isAdmin, isTeacher, isStudent } = useAuth()
  const { hasFeature, loading: permissionsLoading } = useFeaturePermissions()

  const handleNavigate = (href: string) => {
    navigate(href)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const getInitials = () => {
    if (!profile) return 'U'
    const first = profile.first_name?.charAt(0) || ''
    const last = profile.last_name?.charAt(0) || ''
    return `${first}${last}`.toUpperCase()
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Accessibility: Hidden title for screen readers */}
      <h2 className="sr-only">Menu de Navegação</h2>

      {/* Header */}
      <div className="p-6 border-b">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg group">
          <Mountain className="h-6 w-6 text-primary" />
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Everest
          </span>
        </Link>
      </div>

      {/* User Info */}
      {profile && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage
                src={`https://img.usecurling.com/ppl/medium?seed=${profile.id}`}
                alt="Avatar"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile.first_name} {profile.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {menuItems
            .filter((item) => {
              // Se não tem featureKey, sempre mostra (páginas públicas)
              if (!item.featureKey) return true

              // Se for admin ou teacher, mostra tudo
              if (isAdmin || isTeacher) return true

              // Se for aluno, verifica permissão
              if (isStudent) {
                return hasFeature(item.featureKey)
              }

              // Default: mostra
              return true
            })
            .map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href

              return (
                <SheetClose asChild key={item.href}>
                  <button
                    onClick={() => handleNavigate(item.href)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </SheetClose>
              )
            })}

          {(isAdmin || isTeacher) && (
            <>
              <div className="my-4 border-t" />
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase mb-2">
                {isAdmin ? 'Administração' : 'Gestão'}
              </p>
              <div className="space-y-1">
                {adminMenuItems.map((item: any) => {
                  // Pular itens adminOnly se for teacher
                  if (item.adminOnly && !isAdmin) return null

                  const Icon = item.icon
                  const isActive = location.pathname === item.href

                  return (
                    <SheetClose asChild key={item.href}>
                      <button
                        onClick={() => handleNavigate(item.href)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    </SheetClose>
                  )
                })}
              </div>

              <div className="my-4 border-t" />
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase mb-2">
                Gerenciar Conteúdo
              </p>
              <div className="space-y-1">
                {contentMenuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname.startsWith(item.href)

                  return (
                    <SheetClose asChild key={item.href}>
                      <button
                        onClick={() => handleNavigate(item.href)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    </SheetClose>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t space-y-1">
        <SheetClose asChild>
          <button
            onClick={() => handleNavigate('/configuracoes')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span className="font-medium">Configurações</span>
          </button>
        </SheetClose>
        <SheetClose asChild>
          <button
            onClick={() => handleNavigate('/faq')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
          >
            <HelpCircle className="h-5 w-5 shrink-0" />
            <span className="font-medium">Ajuda</span>
          </button>
        </SheetClose>
        <SheetClose asChild>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all duration-200 text-left"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="font-medium">Sair</span>
          </button>
        </SheetClose>
      </div>
    </div>
  )
}
