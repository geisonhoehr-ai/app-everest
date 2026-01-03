import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Bell, Book, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dashboardService, Event } from '@/services/dashboardService'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'

const eventIcons = {
  exam: <Book className="h-5 w-5" />,
  deadline: <Bell className="h-5 w-5" />,
  live: <Calendar className="h-5 w-5" />,
}

const eventColors = {
  exam: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  deadline: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
  live: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
}

export const UpcomingEvents = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEvents = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }
      
      try {
        const upcomingEvents = await dashboardService.getUpcomingEvents(user.id)
        setEvents(upcomingEvents)
      } catch (error) {
        console.error('Erro ao carregar eventos:', error)
        // Em caso de erro, mostrar lista vazia
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [user?.id])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximos Eventos</CardTitle>
          <CardDescription>
            Fique por dentro dos seus compromissos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="h-9 w-9 bg-muted animate-pulse rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos Eventos</CardTitle>
        <CardDescription>
          Fique por dentro dos seus compromissos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {events.length > 0 ? (
            events.map((event, index) => (
              <li key={`${event.title}-${index}`} className="flex items-start gap-4">
                <div className={cn('rounded-full p-2', eventColors[event.type])}>
                  {eventIcons[event.type]}
                </div>
                <div>
                  <p className="font-semibold">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.date}</p>
                </div>
              </li>
            ))
          ) : (
            <li className="text-center py-4">
              <p className="text-muted-foreground">Nenhum evento próximo.</p>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
