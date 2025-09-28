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
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar'

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/admin/management',
    label: 'Usuários e Turmas',
    icon: UserCog,
  },
  { href: '/admin/courses', label: 'Cursos', icon: BookOpen },
  { href: '/admin/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/admin/quizzes', label: 'Quizzes', icon: ListChecks },
  { href: '/admin/simulations', label: 'Simulados', icon: ClipboardCheck },
  { href: '/admin/questions', label: 'Questões', icon: Archive },
  { href: '/admin/calendar', label: 'Calendário', icon: Calendar },
  { href: '/admin/evercast', label: 'Evercast', icon: Radio },
  { href: '/admin/essays', label: 'Redações', icon: FileText },
]

export const AdminSidebar = () => {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Mountain className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Everest Admin</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-grow">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton asChild isActive={isActive(item.href)}>
                <Link to={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
              <span>Voltar ao Site</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </Sidebar>
  )
}
