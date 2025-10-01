import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
} from 'lucide-react'

const menuItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Meus Cursos',
    href: '/meus-cursos',
    icon: BookOpen,
  },
  {
    label: 'Calendário',
    href: '/calendario',
    icon: Calendar,
  },
  {
    label: 'Flashcards',
    href: '/flashcards',
    icon: Layers,
  },
  {
    label: 'Quizzes',
    href: '/quizzes',
    icon: ListChecks,
  },
  {
    label: 'Evercast',
    href: '/evercast',
    icon: Radio,
  },
  {
    label: 'Redações',
    href: '/redacoes',
    icon: FileText,
  },
  {
    label: 'Simulados',
    href: '/simulados',
    icon: ClipboardCheck,
  },
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
  },
  {
    label: 'Gestão',
    href: '/admin/management',
    icon: Users,
  },
]

interface MobileSidebarProps {
  onClose?: () => void
}

export const MobileSidebar = ({ onClose }: MobileSidebarProps = {}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut, isAdmin } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
    onClose?.()
  }

  const handleNavigation = (href: string) => {
    navigate(href)
    // Pequeno delay para animação antes de fechar
    setTimeout(() => onClose?.(), 100)
  }

  const getInitials = () => {
    if (!profile) return 'U'
    const first = profile.first_name?.charAt(0) || ''
    const last = profile.last_name?.charAt(0) || ''
    return `${first}${last}`.toUpperCase()
  }

  return (
    <div className="flex flex-col h-full bg-background">
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
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href

            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}

          {isAdmin && (
            <>
              <div className="my-4 border-t" />
              <div className="space-y-1">
                {adminMenuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href

                  return (
                    <button
                      key={item.href}
                      onClick={() => handleNavigation(item.href)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t space-y-1">
        <button
          onClick={() => handleNavigation('/configuracoes')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 text-left"
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span className="font-medium">Configurações</span>
        </button>
        <button
          onClick={() => handleNavigation('/faq')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 text-left"
        >
          <HelpCircle className="h-5 w-5 shrink-0" />
          <span className="font-medium">Ajuda</span>
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all duration-200 text-left"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  )
}
