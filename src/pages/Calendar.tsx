import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  getCalendarEvents,
  type CalendarEvent,
} from '@/services/calendarService'
import { SectionLoader } from '@/components/SectionLoader'
import { logger } from '@/lib/logger'
import { useAuth } from '@/hooks/use-auth'
import { useFeaturePermissions } from '@/hooks/use-feature-permissions'
import { FEATURE_KEYS } from '@/services/classPermissionsService'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  AlertCircle, 
  Calendar as CalendarIcon, 
  Clock, 
  BookOpen, 
  FileText, 
  Play, 
  Users,
  TrendingUp,
  Award
, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

const eventColors = {
  SIMULATION:
    'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  ESSAY_DEADLINE:
    'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
  LIVE_CLASS:
    'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
  GENERAL: 'bg-gray-100 text-gray-600 dark:bg-gray-900/50 dark:text-gray-400',
}

const eventTypeLabels = {
  SIMULATION: 'Simulado',
  ESSAY_DEADLINE: 'Prazo',
  LIVE_CLASS: 'Aula ao Vivo',
  GENERAL: 'Geral',
}

export default function CalendarPage() {
  const { isStudent } = useAuth()
  const { hasFeature, loading: permissionsLoading } = useFeaturePermissions()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const fetchedEvents = await getCalendarEvents(currentMonth)
        setEvents(fetchedEvents)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [currentMonth])

  const selectedDayEvents = date
    ? events.filter((event) => isSameDay(new Date(event.start_time), date))
    : []

  if (permissionsLoading || isLoading) {
    return <SectionLoader />
  }

  // Se for aluno e não tiver permissão, mostra página bloqueada
  if (isStudent && !hasFeature(FEATURE_KEYS.CALENDAR)) {
    return (
      <MagicLayout
        title="Calendário"
        description="Recurso bloqueado"
      >
        <MagicCard variant="glass" size="lg" className="text-center py-24">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Recurso Bloqueado
            </h3>
            <p className="text-muted-foreground mb-8">
              Este recurso não está disponível para sua turma. Entre em contato com seu professor ou administrador para mais informações.
            </p>
          </div>
        </MagicCard>
      </MagicLayout>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao Carregar Calendário</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <MagicLayout 
      title="Calendário"
      description="Acompanhe seus eventos, prazos e atividades importantes"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Stats */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <CalendarIcon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Calendário de Estudos
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-lg">
                    Acompanhe seus eventos e prazos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <Clock className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                <span className="text-xs md:text-sm font-medium">Agenda Inteligente</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <CalendarIcon className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-blue-600">{events.length}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Eventos</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-green-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-green-600">
                  {events.filter(e => e.event_type === 'LIVE_CLASS').length}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Aulas</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <FileText className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-purple-600">
                  {events.filter(e => e.event_type === 'ESSAY_DEADLINE').length}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Prazos</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <Play className="h-5 w-5 md:h-6 md:w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-orange-600">
                  {events.filter(e => e.event_type === 'SIMULATION').length}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Simulados</div>
              </div>
            </div>
          </div>
        </MagicCard>

        {/* Calendar and Events */}
        <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
          {/* Calendar */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <MagicCard variant="glass" size="lg">
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold">Calendário</h2>
                </div>
                
                <div className="p-3 md:p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    className="rounded-xl mx-auto"
                    locale={ptBR}
                    modifiers={{
                      event: events.map((event) => new Date(event.start_time)),
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
                </div>
              </div>
            </MagicCard>
          </div>

          {/* Events List */}
          <div className="order-1 lg:order-2">
            <MagicCard variant="glass" size="lg">
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg md:text-xl font-semibold">Eventos do Dia</h2>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      {date
                        ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        : 'Selecione uma data'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4 max-h-[400px] md:max-h-[600px] overflow-y-auto pr-2">
                  {selectedDayEvents.length > 0 ? (
                    selectedDayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2 md:gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {event.event_type === 'LIVE_CLASS' && <Users className="h-3 w-3 md:h-4 md:w-4 text-green-500" />}
                              {event.event_type === 'ESSAY_DEADLINE' && <FileText className="h-3 w-3 md:h-4 md:w-4 text-red-500" />}
                              {event.event_type === 'SIMULATION' && <Play className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />}
                              {event.event_type === 'GENERAL' && <CalendarIcon className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />}
                              <h3 className="font-semibold text-xs md:text-sm truncate">{event.title}</h3>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{format(new Date(event.start_time), 'HH:mm')}</span>
                            </div>
                          </div>
                          <Badge
                            className={cn(
                              "text-[10px] md:text-xs font-medium shrink-0",
                              event.event_type === 'LIVE_CLASS' && "bg-gradient-to-r from-green-500/10 to-green-600/5 border-green-500/20 text-green-600",
                              event.event_type === 'ESSAY_DEADLINE' && "bg-gradient-to-r from-red-500/10 to-red-600/5 border-red-500/20 text-red-600",
                              event.event_type === 'SIMULATION' && "bg-gradient-to-r from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-600",
                              event.event_type === 'GENERAL' && "bg-gradient-to-r from-gray-500/10 to-gray-600/5 border-gray-500/20 text-gray-600"
                            )}
                          >
                            {eventTypeLabels[event.event_type as keyof typeof eventTypeLabels]}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 md:py-12">
                      <CalendarIcon className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum evento para este dia
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </MagicCard>
          </div>
        </div>
      </div>
    </MagicLayout>
  )
}
