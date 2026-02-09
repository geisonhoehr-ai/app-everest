import { lazy } from 'react'
import type { UserProfile } from '@/services/userService'
import { Sparkles, BookOpen, TrendingUp, Calendar, Users, Activity, Trophy } from 'lucide-react'

const WelcomeWidget = lazy(
  () => import('@/components/dashboard/widgets/WelcomeWidget'),
)
const CoursesWidget = lazy(
  () => import('@/components/dashboard/widgets/CoursesWidget'),
)
const ProgressWidget = lazy(
  () => import('@/components/dashboard/widgets/ProgressWidget'),
)
const EventsWidget = lazy(
  () => import('@/components/dashboard/widgets/EventsWidget'),
)
const TeacherStatsWidget = lazy(
  () => import('@/components/dashboard/widgets/TeacherStatsWidget'),
)
const AdminStatsWidget = lazy(
  () => import('@/components/dashboard/widgets/AdminStatsWidget'),
)
const RankingWidget = lazy(
  () => import('@/components/dashboard/widgets/RankingWidget'),
)

export interface WidgetConfig {
  id: string
  name: string
  description: string
  component: React.ComponentType
  icon?: React.ComponentType<{ className?: string }>
}

export const WIDGETS: Record<string, WidgetConfig> = {
  welcome: {
    id: 'welcome',
    name: 'Boas-vindas',
    description: 'Uma mensagem de boas-vindas e motivação.',
    component: WelcomeWidget,
    icon: Sparkles
  },
  courses: {
    id: 'courses',
    name: 'Meus Cursos',
    description: 'Acesso rápido aos seus cursos em andamento.',
    component: CoursesWidget,
    icon: BookOpen
  },
  progress: {
    id: 'progress',
    name: 'Progresso Semanal',
    description: 'Gráfico com suas horas de estudo na semana.',
    component: ProgressWidget,
    icon: TrendingUp
  },
  events: {
    id: 'events',
    name: 'Próximos Eventos',
    description: 'Lista de aulas, provas e prazos futuros.',
    component: EventsWidget,
    icon: Calendar
  },
  teacherStats: {
    id: 'teacherStats',
    name: 'Estatísticas do Professor',
    description: 'Resumo de redações para corrigir e dúvidas no fórum.',
    component: TeacherStatsWidget,
    icon: Users
  },
  adminStats: {
    id: 'adminStats',
    name: 'Estatísticas da Plataforma',
    description: 'Visão geral dos dados da plataforma.',
    component: AdminStatsWidget,
    icon: Activity
  },
  ranking: {
    id: 'ranking',
    name: 'Ranking',
    description: 'Sua posição no ranking e conquistas recentes.',
    component: RankingWidget,
    icon: Trophy
  },
}
// ... rest ...

export const DEFAULT_LAYOUTS: Record<
  UserProfile['role'],
  { order: string[]; hidden: string[] }
> = {
  student: {
    order: ['welcome', 'ranking', 'progress', 'events', 'courses'],
    hidden: [],
  },
  teacher: {
    order: ['teacherStats', 'events'],
    hidden: ['welcome', 'courses', 'progress'],
  },
  administrator: {
    order: ['adminStats'],
    hidden: ['welcome', 'courses', 'progress', 'events', 'teacherStats'],
  },
}

export const AVAILABLE_WIDGETS: Record<UserProfile['role'], string[]> = {
  student: ['welcome', 'courses', 'progress', 'events', 'ranking'],
  teacher: ['teacherStats', 'events', 'ranking'],
  administrator: ['adminStats', 'ranking'],
}
