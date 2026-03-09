import { useState, useEffect, useMemo } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { format, isSameDay, isAfter, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  getCalendarEvents,
  type CalendarEvent,
} from '@/services/calendarService'
import { SectionLoader } from '@/components/SectionLoader'
import { useAuth } from '@/hooks/use-auth'
import { useFeaturePermissions } from '@/hooks/use-feature-permissions'
import { FEATURE_KEYS } from '@/services/classPermissionsService'
import {
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  FileText,
  Play,
  Users,
  Lock,
  ChevronRight,
  Filter,
  Video,
  PenTool,
  Target,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const eventConfig = {
  LIVE_CLASS: {
    label: 'Mentoria',
    icon: Video,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
  },
  SIMULATION: {
    label: 'Simulado',
    icon: Target,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    dot: 'bg-blue-500',
    badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
  },
  ESSAY_DEADLINE: {
    label: 'Redação',
    icon: PenTool,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    dot: 'bg-rose-500',
    badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400',
  },
  GENERAL: {
    label: 'Geral',
    icon: Info,
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-500/10 border-slate-500/20',
    dot: 'bg-slate-400',
    badge: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400',
  },
}

type EventType = keyof typeof eventConfig

export default function CalendarPage() {
  const { isStudent } = useAuth()
  const { hasFeature, loading: permissionsLoading } = useFeaturePermissions()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<EventType | 'ALL'>('ALL')

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true)
      try {
        const fetchedEvents = await getCalendarEvents(currentMonth)
        setEvents(fetchedEvents)
      } catch {
        // silently fail
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvents()
  }, [currentMonth])

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'ALL') return events
    return events.filter(e => e.event_type === activeFilter)
  }, [events, activeFilter])

  const selectedDayEvents = useMemo(() => {
    if (!date) return []
    return filteredEvents.filter((event) => isSameDay(new Date(event.start_time), date))
  }, [date, filteredEvents])

  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date())
    return events
      .filter(e => isAfter(new Date(e.start_time), today))
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 5)
  }, [events])

  const eventCountByType = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of events) {
      counts[e.event_type] = (counts[e.event_type] || 0) + 1
    }
    return counts
  }, [events])

  if (permissionsLoading || isLoading) {
    return <SectionLoader />
  }

  if (isStudent && !hasFeature(FEATURE_KEYS.CALENDAR)) {
    return (
      <MagicLayout title="Calendário" description="Recurso bloqueado">
        <MagicCard variant="glass" size="lg" className="text-center py-24">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Recurso Bloqueado</h3>
            <p className="text-muted-foreground mb-8">
              Este recurso não está disponível para sua turma. Entre em contato com seu professor ou administrador.
            </p>
          </div>
        </MagicCard>
      </MagicLayout>
    )
  }

  const getEventConfig = (type: string) => eventConfig[type as EventType] || eventConfig.GENERAL

  return (
    <MagicLayout
      title="Calendário"
      description="Acompanhe seus eventos, prazos e atividades"
      showHeader={false}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Calendário</h1>
            <p className="text-muted-foreground mt-1">Seus eventos, mentorias e simulados</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>{format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeFilter === 'ALL' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full h-8 text-xs"
            onClick={() => setActiveFilter('ALL')}
          >
            <Filter className="h-3 w-3 mr-1" />
            Todos ({events.length})
          </Button>
          {(Object.keys(eventConfig) as EventType[]).map(type => {
            const config = eventConfig[type]
            const count = eventCountByType[type] || 0
            if (count === 0) return null
            const Icon = config.icon
            return (
              <Button
                key={type}
                variant={activeFilter === type ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  "rounded-full h-8 text-xs",
                  activeFilter !== type && config.color
                )}
                onClick={() => setActiveFilter(type)}
              >
                <Icon className="h-3 w-3 mr-1" />
                {config.label} ({count})
              </Button>
            )
          })}
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <MagicCard variant="glass" size="lg">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-xl mx-auto"
                locale={ptBR}
                modifiers={{
                  event: filteredEvents.map((event) => new Date(event.start_time)),
                }}
                modifiersStyles={{
                  event: {
                    fontWeight: 'bold',
                    color: 'hsl(var(--primary))',
                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                    borderRadius: '8px',
                  },
                }}
              />
            </MagicCard>
          </div>

          {/* Selected Day Events */}
          <div className="lg:col-span-2 space-y-6">
            <MagicCard variant="glass" size="lg">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedDayEvents.length > 0
                      ? `${selectedDayEvents.length} evento${selectedDayEvents.length > 1 ? 's' : ''}`
                      : 'Nenhum evento'}
                  </p>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto">
                  {selectedDayEvents.length > 0 ? (
                    selectedDayEvents.map((event) => {
                      const config = getEventConfig(event.event_type)
                      const Icon = config.icon
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "p-3 rounded-lg border transition-colors",
                            config.bg
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn("mt-0.5", config.color)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm leading-tight">{event.title}</p>
                              {event.description && (
                                <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(event.start_time), 'HH:mm')}
                                  {event.end_time && ` - ${format(new Date(event.end_time), 'HH:mm')}`}
                                </span>
                                <Badge variant="outline" className={cn("text-[10px] h-5", config.badge)}>
                                  {config.label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Nenhum evento neste dia</p>
                    </div>
                  )}
                </div>
              </div>
            </MagicCard>
          </div>
        </div>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <MagicCard variant="glass" size="lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Próximos Eventos</h2>
                <span className="text-xs text-muted-foreground">Próximos 5 eventos</span>
              </div>
              <div className="space-y-2">
                {upcomingEvents.map((event) => {
                  const config = getEventConfig(event.event_type)
                  const Icon = config.icon
                  const eventDate = new Date(event.start_time)
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setDate(eventDate)
                        setCurrentMonth(eventDate)
                      }}
                    >
                      {/* Date block */}
                      <div className="text-center w-12 shrink-0">
                        <div className="text-2xl font-bold leading-none">
                          {format(eventDate, 'dd')}
                        </div>
                        <div className="text-[10px] uppercase text-muted-foreground font-medium">
                          {format(eventDate, 'MMM', { locale: ptBR })}
                        </div>
                      </div>

                      {/* Colored bar */}
                      <div className={cn("w-1 h-10 rounded-full shrink-0", config.dot)} />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {format(eventDate, "EEEE", { locale: ptBR })} · {format(eventDate, 'HH:mm')}
                            {event.end_time && ` - ${format(new Date(event.end_time), 'HH:mm')}`}
                          </span>
                        </div>
                      </div>

                      {/* Badge */}
                      <Badge variant="outline" className={cn("text-[10px] h-5 shrink-0", config.badge)}>
                        {config.label}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    </div>
                  )
                })}
              </div>
            </div>
          </MagicCard>
        )}
      </div>
    </MagicLayout>
  )
}
