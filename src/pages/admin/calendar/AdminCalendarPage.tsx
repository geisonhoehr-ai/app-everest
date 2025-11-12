import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { addDays, format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PlusCircle, Edit, Trash2 } from 'lucide-react'

const mockEvents = [
  {
    id: 1,
    date: new Date(),
    title: 'Aula ao vivo: Biologia',
    type: 'live',
  },
  {
    id: 2,
    date: addDays(new Date(), 2),
    title: 'Entrega da Redação',
    type: 'deadline',
  },
  {
    id: 3,
    date: addDays(new Date(), 5),
    title: 'Simulado de Humanas',
    type: 'exam',
  },
  {
    id: 4,
    date: addDays(new Date(), 5),
    title: 'Aula de Reforço: Física',
    type: 'live',
  },
]

const eventColors = {
  exam: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  deadline: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
  live: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
}

export default function AdminCalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [events, setEvents] = useState(mockEvents)

  const selectedDayEvents = date
    ? events.filter((event) => isSameDay(event.date, date))
    : []

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Calendário de Eventos</CardTitle>
              <CardDescription>
                Gerencie os eventos da plataforma.
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Evento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Evento</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      Título
                    </Label>
                    <Input id="title" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">
                      Data
                    </Label>
                    <Input id="date" type="date" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">
                      Tipo
                    </Label>
                    <Select>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="live">Aula ao Vivo</SelectItem>
                        <SelectItem value="deadline">Prazo</SelectItem>
                        <SelectItem value="exam">Simulado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Salvar Evento</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-2 md:p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
              locale={ptBR}
              modifiers={{
                event: events.map((event) => event.date),
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
                      <span className="font-medium">{event.title}</span>
                      <Badge
                        className={`ml-2 ${
                          eventColors[event.type as keyof typeof eventColors]
                        }`}
                      >
                        {event.type}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
