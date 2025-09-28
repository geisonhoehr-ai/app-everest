import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  getCalendarEvents,
  type CalendarEvent,
} from '@/services/calendarService'
import { SectionLoader } from '@/components/SectionLoader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

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

  if (isLoading) {
    return <SectionLoader />
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-2 md:p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md"
              locale={ptBR}
              modifiers={{
                event: events.map((event) => new Date(event.start_time)),
              }}
              modifiersStyles={{
                event: {
                  fontWeight: 'bold',
                  color: 'hsl(var(--primary))',
                },
              }}
            />
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Eventos do Dia</CardTitle>
            <CardDescription>
              {date
                ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                : 'Selecione uma data'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDayEvents.length > 0 ? (
              <ul className="space-y-3">
                {selectedDayEvents.map((event) => (
                  <li
                    key={event.id}
                    className="p-3 rounded-lg border bg-card flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.start_time), 'HH:mm')}
                      </p>
                    </div>
                    <Badge
                      className={
                        eventColors[
                          event.event_type as keyof typeof eventColors
                        ]
                      }
                    >
                      {
                        eventTypeLabels[
                          event.event_type as keyof typeof eventTypeLabels
                        ]
                      }
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum evento para este dia.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
