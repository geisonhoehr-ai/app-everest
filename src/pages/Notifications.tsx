import { useState } from 'react'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Bell, 
  Check, 
  X, 
  BookOpen, 
  Award, 
  Calendar,
  MessageSquare,
  AlertCircle,
  Info,
  CheckCircle
} from 'lucide-react'

const mockNotifications = [
  {
    id: 1,
    type: 'achievement',
    title: 'Nova Conquista Desbloqueada!',
    message: 'Você completou o curso de Matemática Básica e desbloqueou a conquista "Matemático Iniciante".',
    time: '2 minutos atrás',
    read: false,
    icon: Award,
    color: 'text-warning'
  },
  {
    id: 2,
    type: 'course',
    title: 'Nova Aula Disponível',
    message: 'Uma nova aula foi adicionada ao curso de Português Avançado: "Interpretação de Textos".',
    time: '1 hora atrás',
    read: false,
    icon: BookOpen,
    color: 'text-primary'
  },
  {
    id: 3,
    type: 'reminder',
    title: 'Lembrete de Estudo',
    message: 'Você tem uma sessão de estudo agendada para hoje às 14:00. Não esqueça!',
    time: '3 horas atrás',
    read: true,
    icon: Calendar,
    color: 'text-info'
  },
  {
    id: 4,
    type: 'social',
    title: 'Novo Comentário',
    message: 'João Silva comentou na sua redação sobre "Inteligência Artificial".',
    time: '5 horas atrás',
    read: true,
    icon: MessageSquare,
    color: 'text-primary'
  },
  {
    id: 5,
    type: 'system',
    title: 'Atualização do Sistema',
    message: 'Novas funcionalidades foram adicionadas ao Everest. Confira as novidades!',
    time: '1 dia atrás',
    read: true,
    icon: Info,
    color: 'text-muted-foreground'
  },
  {
    id: 6,
    type: 'warning',
    title: 'Prazo Próximo',
    message: 'O prazo para entrega da redação sobre "Sustentabilidade" é amanhã.',
    time: '2 dias atrás',
    read: true,
    icon: AlertCircle,
    color: 'text-warning'
  }
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  const unreadCount = notifications.filter(n => !n.read).length
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read
    if (filter === 'read') return notification.read
    return true
  })

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement': return Award
      case 'course': return BookOpen
      case 'reminder': return Calendar
      case 'social': return MessageSquare
      case 'system': return Info
      case 'warning': return AlertCircle
      default: return Bell
    }
  }

  return (
    <MagicLayout
      title="Notificações"
      description="Mantenha-se atualizado com as últimas novidades e atividades."
    >
      <div className="space-y-6">
        {/* Header */}
        <MagicCard className="p-6" glow>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Central de Notificações</h2>
                <p className="text-muted-foreground">
                  {unreadCount > 0 
                    ? `${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}`
                    : 'Todas as notificações foram lidas'
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="group transition-all duration-300 hover:bg-primary/5"
              >
                <Check className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                Marcar todas como lidas
              </Button>
            </div>
          </div>
        </MagicCard>

        {/* Filters */}
        <MagicCard className="p-4" glow>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Filtrar:</span>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'Todas', count: notifications.length },
                { key: 'unread', label: 'Não lidas', count: unreadCount },
                { key: 'read', label: 'Lidas', count: notifications.length - unreadCount }
              ].map(({ key, label, count }) => (
                <Button
                  key={key}
                  variant={filter === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(key as any)}
                  className={cn(
                    "transition-all duration-300",
                    filter === key 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-primary/5"
                  )}
                >
                  {label}
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "ml-2 text-xs",
                      filter === key 
                        ? "bg-primary-foreground/20 text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </MagicCard>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <MagicCard className="p-12 text-center" glow>
              <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma notificação</h3>
              <p className="text-muted-foreground">
                {filter === 'unread' 
                  ? 'Você está em dia! Todas as notificações foram lidas.'
                  : 'Não há notificações para mostrar no momento.'
                }
              </p>
            </MagicCard>
          ) : (
            filteredNotifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.type)
              
              return (
                <MagicCard 
                  key={notification.id}
                  className={cn(
                    "p-6 transition-all duration-300",
                    !notification.read && "ring-2 ring-primary/20 bg-primary/5"
                  )}
                  glow
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      notification.read ? "bg-muted/50" : "bg-primary/10"
                    )}>
                      <IconComponent className={cn(
                        "h-5 w-5",
                        notification.read ? "text-muted-foreground" : notification.color
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={cn(
                            "font-semibold mb-1",
                            !notification.read && "text-foreground"
                          )}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {notification.time}
                            </span>
                            {!notification.read && (
                              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                Nova
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </MagicCard>
              )
            })
          )}
        </div>
      </div>
    </MagicLayout>
  )
}