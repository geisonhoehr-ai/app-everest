import { useState, useEffect } from 'react'
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
import { format, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PlusCircle, Edit, Trash2, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import {
  getCalendarEvents,
  createEvent,
  deleteEvent,
  type CalendarEvent
} from '@/services/calendarService'
import { getClasses, type Class } from '@/services/classService'
import { useToast } from '@/components/ui/use-toast'

const eventColors = {
  SIMULATION: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  ESSAY_DEADLINE: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
  LIVE_CLASS: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
  GENERAL: 'bg-gray-100 text-gray-600 dark:bg-gray-900/50 dark:text-gray-400',
}

const eventTypeLabels = {
  SIMULATION: 'Simulado',
  ESSAY_DEADLINE: 'Prazo',
  LIVE_CLASS: 'Aula ao Vivo',
  GENERAL: 'Geral',
}

export default function AdminCalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '08:00',
    type: 'GENERAL',
    classId: 'global' // 'global' or class UUID
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [eventsData, classesData] = await Promise.all([
        getCalendarEvents(currentMonth),
        getClasses()
      ])
      setEvents(eventsData)
      setClasses(classesData)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentMonth])

  const handleCreateEvent = async () => {
    try {
      setIsSubmitting(true)

      // Combine date and time
      const startDateTime = new Date(`${formData.date}T${formData.time}:00`)

      await createEvent({
        title: formData.title,
        start_time: startDateTime.toISOString(),
        event_type: formData.type as any,
        class_id: formData.classId === 'global' ? null : formData.classId
      })

      toast({
        title: 'Evento criado',
        description: 'O evento foi adicionado ao calendário.'
      })

      setIsDialogOpen(false)
      setFormData({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '08:00',
        type: 'GENERAL',
        classId: 'global'
      })
      loadData() // Refresh events

    } catch (error) {
      toast({
        title: 'Erro ao criar',
        description: 'Não foi possível criar o evento.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return

    try {
      await deleteEvent(id)
      toast({
        title: 'Evento excluído',
        description: 'O evento foi removido.'
      })
      loadData()
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o evento.',
        variant: 'destructive'
      })
    }
  }

  const selectedDayEvents = date
    ? events.filter((event) => isSameDay(parseISO(event.start_time), date))
    : []

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Calendário de Eventos</CardTitle>
              <CardDescription>
                Gerencie os eventos globais e por turma.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                    <Label htmlFor="title" className="text-right">Título</Label>
                    <Input
                      id="title"
                      className="col-span-3"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      className="col-span-3"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="time" className="text-right">Hora</Label>
                    <Input
                      id="time"
                      type="time"
                      className="col-span-3"
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={v => setFormData({ ...formData, type: v })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LIVE_CLASS">Aula ao Vivo</SelectItem>
                        <SelectItem value="ESSAY_DEADLINE">Prazo de Redação</SelectItem>
                        <SelectItem value="SIMULATION">Simulado</SelectItem>
                        <SelectItem value="GENERAL">Geral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="class" className="text-right">Turma</Label>
                    <Select
                      value={formData.classId}
                      onValueChange={v => setFormData({ ...formData, classId: v })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione a turma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Todas as Turmas (Global)</SelectItem>
                        {classes.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateEvent} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Salvar Evento
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
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
                event: events.map((event) => parseISO(event.start_time)),
              }}
              modifiersStyles={{
                event: {
                  fontWeight: 'bold',
                  color: 'hsl(var(--primary))',
                  backgroundColor: 'hsl(var(--primary) / 0.1)',
                  borderRadius: '4px',
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
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Carregando...</div>
            ) : selectedDayEvents.length > 0 ? (
              <ul className="space-y-3">
                {selectedDayEvents.map((event) => (
                  <li
                    key={event.id}
                    className="p-3 rounded-lg border bg-card flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium block">{event.title}</span>
                      <div className="flex gap-2 mt-1">
                        <Badge
                          className={
                            eventColors[event.event_type as keyof typeof eventColors] || eventColors.GENERAL
                          }
                        >
                          {eventTypeLabels[event.event_type as keyof typeof eventTypeLabels] || event.event_type}
                        </Badge>
                        {event.class_id ? (
                          <Badge variant="outline" className="text-xs">
                            {classes.find(c => c.id === event.class_id)?.name || 'Turma'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Global</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum evento para este dia.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
