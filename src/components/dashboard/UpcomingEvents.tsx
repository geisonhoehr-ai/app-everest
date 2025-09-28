import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Bell, Book, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockEvents } from '@/lib/dashboard-data'

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
          {mockEvents.map((event) => (
            <li key={event.title} className="flex items-start gap-4">
              <div className={cn('rounded-full p-2', eventColors[event.type])}>
                {eventIcons[event.type]}
              </div>
              <div>
                <p className="font-semibold">{event.title}</p>
                <p className="text-sm text-muted-foreground">{event.date}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
