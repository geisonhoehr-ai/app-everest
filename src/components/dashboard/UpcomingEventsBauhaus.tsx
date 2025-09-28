import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { BauhausCard } from '@/components/ui/bauhaus-card'
import { Bell, Book, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dashboardService, Event } from '@/services/dashboardService'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

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

const getEventAccentColor = (type: 'exam' | 'deadline' | 'live') => {
  switch (type) {
    case 'exam':
      return '#156ef6' // Blue
    case 'deadline':
      return '#e91e63' // Red
    case 'live':
      return '#24d200' // Green
    default:
      return '#156ef6'
  }
}

export const UpcomingEventsBauhaus = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEvents = async () => {
      if (!user?.id) return
      
      try {
        const upcomingEvents = await dashboardService.getUpcomingEvents(user.id)
        setEvents(upcomingEvents)
      } catch (error) {
        console.error('Erro ao carregar eventos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [user?.id])

  const handleJoinEvent = (eventTitle: string) => {
    toast({
      title: "Participando do evento!",
      description: `Você foi adicionado ao evento: ${eventTitle}`,
    })
  }

  const handleRemindMe = (eventTitle: string) => {
    toast({
      title: "Lembrete configurado!",
      description: `Você será lembrado sobre: ${eventTitle}`,
    })
  }

  const handleMoreOptions = (eventTitle: string) => {
    toast({
      title: "Opções do evento",
      description: "Menu de opções em desenvolvimento.",
    })
  }

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
          Fique por dentro dos seus compromissos com nossos cards interativos.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.length > 0 ? (
          events.map((event, index) => (
            <BauhausCard
              key={`${event.title}-${index}`}
              id={`event-${index}`}
              accentColor={getEventAccentColor(event.type)}
              backgroundColor="var(--bauhaus-card-bg)"
              separatorColor="var(--bauhaus-card-separator)"
              borderRadius="2em"
              borderWidth="2px"
              topInscription={event.date}
              mainText={event.title}
              subMainText={`Tipo: ${event.type === 'exam' ? 'Prova' : event.type === 'deadline' ? 'Prazo' : 'Ao Vivo'}`}
              progressBarInscription="Status:"
              progress={event.type === 'live' ? 90 : event.type === 'exam' ? 75 : 60}
              progressValue={event.type === 'live' ? 'Ao Vivo' : event.type === 'exam' ? 'Em Breve' : 'Pendente'}
              filledButtonInscription={event.type === 'live' ? 'Participar' : 'Ver Detalhes'}
              outlinedButtonInscription="Lembrar"
              onFilledButtonClick={() => handleJoinEvent(event.title)}
              onOutlinedButtonClick={() => handleRemindMe(event.title)}
              onMoreOptionsClick={() => handleMoreOptions(event.title)}
              mirrored={false}
              swapButtons={false}
              textColorTop="var(--bauhaus-card-inscription-top)"
              textColorMain="var(--bauhaus-card-inscription-main)"
              textColorSub="var(--bauhaus-card-inscription-sub)"
              textColorProgressLabel="var(--bauhaus-card-inscription-progress-label)"
              textColorProgressValue="var(--bauhaus-card-inscription-progress-value)"
              progressBarBackground="var(--bauhaus-card-progress-bar-bg)"
              chronicleButtonBg="var(--bauhaus-chronicle-bg)"
              chronicleButtonFg="var(--bauhaus-chronicle-fg)"
              chronicleButtonHoverFg="var(--bauhaus-chronicle-hover-fg)"
            />
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Nenhum evento próximo.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
