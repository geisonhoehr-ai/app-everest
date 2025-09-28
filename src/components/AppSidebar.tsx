import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Mountain,
  Settings,
  TrendingUp,
  Layers,
  ListChecks,
  Radio,
  Archive,
  Users,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-provider'
import { useStaggeredAnimation } from '@/hooks/useAnimations'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/meus-cursos', label: 'Meus Cursos', icon: BookOpen },
  { href: '/calendario', label: 'Calendário', icon: Calendar },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/meus-conjuntos', label: 'Meus Conjuntos', icon: Users },
  { href: '/quizzes', label: 'Quizzes', icon: ListChecks },
  { href: '/evercast', label: 'Evercast', icon: Radio },
  { href: '/redacoes', label: 'Redações', icon: FileText },
  { href: '/simulados', label: 'Simulados', icon: ClipboardCheck },
  { href: '/banco-de-questoes', label: 'Questões', icon: Archive },
  { href: '/progresso', label: 'Progresso', icon: TrendingUp },
  { href: '/forum', label: 'Fórum', icon: MessageSquare },
]

const bottomMenuItems = [
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
  { href: '/faq', label: 'Ajuda', icon: HelpCircle },
]

export const AppSidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  const getInitials = () => {
    if (!profile) return 'U'
    const first = profile.first_name?.charAt(0) || ''
    const last = profile.last_name?.charAt(0) || ''
    return `${first}${last}`.toUpperCase()
  }

  const menuDelays = useStaggeredAnimation(menuItems.length, 50)
  const bottomDelays = useStaggeredAnimation(bottomMenuItems.length + 1, 50)

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-border/20 bg-gradient-to-b from-card/80 via-card/60 to-card/80 backdrop-blur-xl"
    >
      <SidebarHeader className="border-b border-border/20 p-6 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-4 animate-fade-in-up">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 blur-sm" />
            <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-3 rounded-xl shadow-lg shadow-primary/30">
              <Mountain className="h-6 w-6 text-primary-foreground animate-float" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-2xl text-gradient">
              Everest
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Education Platform
            </span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex-grow p-4 space-y-2">
        <SidebarMenu className="space-y-1">
          {menuItems.map((item, index) => (
            <SidebarMenuItem 
              key={item.label}
              className="animate-fade-in-up"
              style={{ animationDelay: `${menuDelays[index].delay}ms` }}
            >
              <SidebarMenuButton 
                asChild 
                isActive={isActive(item.href)}
                className={cn(
                  "group relative overflow-hidden transition-all duration-300",
                  "hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 hover:shadow-lg hover:shadow-muted/10",
                  "rounded-xl p-3 h-auto min-h-[44px]",
                  "border border-transparent hover:border-muted/30",
                  isActive(item.href) && [
                    "bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5",
                    "border-primary/40 shadow-lg shadow-primary/25",
                    "text-primary"
                  ]
                )}
              >
                <Link to={item.href} className="flex items-center gap-3 w-full">
                  <div className="relative">
                    <div className={cn(
                      "p-2.5 rounded-xl transition-all duration-300",
                      "group-hover:bg-muted/30 group-hover:scale-105",
                      isActive(item.href) && "bg-gradient-to-br from-primary/25 via-primary/15 to-primary/10 shadow-lg shadow-primary/25"
                    )}>
                      <item.icon className={cn(
                        "h-5 w-5 transition-all duration-300",
                        "group-hover:scale-110",
                        isActive(item.href) && "text-primary"
                      )} />
                    </div>
                    {isActive(item.href) && (
                      <div className="absolute inset-0 rounded-xl bg-primary/10 animate-pulse" />
                    )}
                  </div>
                  <span className={cn(
                    "transition-all duration-300 font-semibold text-sm flex-1",
                    "group-hover:text-foreground group-hover:translate-x-1"
                  )}>
                    {item.label}
                  </span>
                  {isActive(item.href) && (
                    <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-primary-600 animate-glow shadow-lg shadow-primary/50" />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-border/20 p-4 space-y-4 bg-gradient-to-t from-muted/20 to-transparent">
        <SidebarMenu className="space-y-1">
          {bottomMenuItems.map((item, index) => (
            <SidebarMenuItem 
              key={item.label}
              className="animate-fade-in-up"
              style={{ animationDelay: `${bottomDelays[index].delay}ms` }}
            >
              <SidebarMenuButton 
                asChild 
                isActive={isActive(item.href)}
                className={cn(
                  "group relative overflow-hidden transition-all duration-300",
                  "hover:bg-muted/40 hover:shadow-md hover:shadow-muted/10",
                  "rounded-xl p-3 h-auto min-h-[44px]",
                  "border border-transparent hover:border-muted/30",
                  isActive(item.href) && [
                    "bg-gradient-to-r from-primary/10 to-primary/5",
                    "border-primary/30 shadow-md shadow-primary/20"
                  ]
                )}
              >
                <Link to={item.href} className="flex items-center gap-3 w-full">
                  <div className={cn(
                    "p-1.5 rounded-lg transition-all duration-300",
                    "group-hover:bg-muted/30 group-hover:scale-110",
                    isActive(item.href) && "bg-primary/20"
                  )}>
                    <item.icon className={cn(
                      "h-4 w-4 transition-all duration-300",
                      "group-hover:rotate-3",
                      isActive(item.href) && "text-primary"
                    )} />
                  </div>
                  <span className={cn(
                    "transition-all duration-300 font-medium text-sm",
                    "group-hover:text-foreground group-hover:translate-x-1"
                  )}>
                    {item.label}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          
          <SidebarSeparator className="animate-fade-in-up my-3 bg-gradient-to-r from-transparent via-border to-transparent" style={{ animationDelay: '800ms' }} />
          
          <SidebarMenuItem 
            className="animate-fade-in-up"
            style={{ animationDelay: `${bottomDelays[bottomDelays.length - 1].delay}ms` }}
          >
            <SidebarMenuButton 
              onClick={handleSignOut}
              className={cn(
                "group relative overflow-hidden transition-all duration-300",
                "hover:bg-destructive/10 hover:shadow-md hover:shadow-destructive/10",
                "rounded-xl p-3 h-auto min-h-[44px] text-destructive/70 hover:text-destructive",
                "border border-transparent hover:border-destructive/20"
              )}
            >
              <div className="p-1.5 rounded-lg transition-all duration-300 group-hover:bg-destructive/10 group-hover:scale-110">
                <LogOut className="h-4 w-4 transition-all duration-300 group-hover:rotate-3" />
              </div>
              <span className="transition-all duration-300 font-medium text-sm group-hover:translate-x-1">
                Sair
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <div
          className={cn(
            'flex items-center gap-4 rounded-2xl p-4 transition-all duration-300',
            'bg-gradient-to-r from-muted/30 to-muted/20 backdrop-blur-sm',
            'border border-border/30 hover:border-primary/30',
            'hover:bg-primary/5 hover:shadow-xl hover:shadow-primary/10',
            'animate-fade-in-up cursor-pointer group',
          )}
          style={{ animationDelay: '900ms' }}
        >
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all duration-300 group-hover:ring-primary group-hover:scale-105 shadow-lg">
              <AvatarImage
                src={`https://img.usecurling.com/ppl/medium?seed=${profile?.id}`}
                alt="Avatar"
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-bold text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-success border-2 border-background animate-pulse shadow-lg" />
          </div>
          <div className="flex flex-col overflow-hidden flex-1">
            <span className="text-sm font-bold text-foreground truncate transition-colors duration-300 group-hover:text-primary">
              {profile?.first_name} {profile?.last_name}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {profile?.email}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-success font-medium">Online</span>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
