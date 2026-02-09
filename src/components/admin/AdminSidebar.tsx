import { Link, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Mountain,
  Layers,
  ListChecks,
  Radio,
  Archive,
  ArrowLeft,
  UserCog,
  Settings,
  LogOut,
  BarChart3,
  Plug,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'

const menuItems = [
  { 
    href: '/admin', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    badge: null
  },
  {
    href: '/admin/management',
    label: 'Usuários',
    icon: UserCog,
    badge: null
  },
  { 
    href: '/admin/courses', 
    label: 'Cursos', 
    icon: BookOpen,
    badge: null
  },
  { 
    href: '/admin/flashcards', 
    label: 'Flashcards', 
    icon: Layers,
    badge: 'Novo'
  },
  { 
    href: '/admin/quizzes', 
    label: 'Quizzes', 
    icon: ListChecks,
    badge: null
  },
  { 
    href: '/admin/simulations', 
    label: 'Simulados', 
    icon: ClipboardCheck,
    badge: null
  },
  { 
    href: '/admin/questions', 
    label: 'Questões', 
    icon: Archive,
    badge: null
  },
  { 
    href: '/admin/calendar', 
    label: 'Calendário', 
    icon: Calendar,
    badge: null
  },
  { 
    href: '/admin/evercast', 
    label: 'Evercast', 
    icon: Radio,
    badge: null
  },
  { 
    href: '/admin/essays', 
    label: 'Redações', 
    icon: FileText,
    badge: null
  },
]

export const AdminSidebar = () => {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="border-b border-border/50">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-white shadow-sm">
            <Mountain className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-none">Everest</span>
            <span className="text-xs text-muted-foreground">Admin Panel</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Gerenciamento
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {menuItems.slice(0, 4).map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive(item.href)}
                  className="group relative h-10 rounded-lg transition-all duration-200 hover:bg-accent/50"
                >
                  <Link to={item.href} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 transition-colors group-hover:text-primary" />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto text-xs px-2 py-0.5">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Conteúdo
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {menuItems.slice(4, 8).map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive(item.href)}
                  className="group relative h-10 rounded-lg transition-all duration-200 hover:bg-accent/50"
                >
                  <Link to={item.href} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 transition-colors group-hover:text-primary" />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto text-xs px-2 py-0.5">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Ferramentas
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {menuItems.slice(8).map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive(item.href)}
                  className="group relative h-10 rounded-lg transition-all duration-200 hover:bg-accent/50"
                >
                  <Link to={item.href} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 transition-colors group-hover:text-primary" />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto text-xs px-2 py-0.5">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Sistema
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive('/admin/integrations')}
                className="group relative h-10 rounded-lg transition-all duration-200 hover:bg-accent/50"
              >
                <Link to="/admin/integrations" className="flex items-center gap-3">
                  <Plug className="h-4 w-4 transition-colors group-hover:text-primary" />
                  <span className="font-medium">Integrações</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive('/admin/reports')}
                className="group relative h-10 rounded-lg transition-all duration-200 hover:bg-accent/50"
              >
                <Link to="/admin/reports" className="flex items-center gap-3">
                  <BarChart3 className="h-4 w-4 transition-colors group-hover:text-primary" />
                  <span className="font-medium">Relatórios</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive('/admin/settings')}
                className="group relative h-10 rounded-lg transition-all duration-200 hover:bg-accent/50"
              >
                <Link to="/admin/settings" className="flex items-center gap-3">
                  <Settings className="h-4 w-4 transition-colors group-hover:text-primary" />
                  <span className="font-medium">Configurações</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarSeparator />
      
      <div className="p-2">
        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              className="group relative h-10 rounded-lg transition-all duration-200 hover:bg-accent/50 text-muted-foreground hover:text-foreground"
            >
              <Link to="/" className="flex items-center gap-3">
                <ArrowLeft className="h-4 w-4 transition-colors group-hover:text-primary" />
                <span className="font-medium">Voltar ao Site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </Sidebar>
  )
}
