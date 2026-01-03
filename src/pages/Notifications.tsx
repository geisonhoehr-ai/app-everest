import { useState, useMemo } from 'react'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { useNotifications } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
  CheckCircle,
  Loader2
} from 'lucide-react'

export default function NotificationsPage() {
  const {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications()

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  const filteredNotifications = useMemo(() => {
    logger.debug('🔍 Filtrando notificações:', { filter, total: notifications.length })

    const filtered = notifications.filter(notification => {
      if (filter === 'unread') return !notification.is_read
      if (filter === 'read') return notification.is_read
      return true
    })

    logger.debug('✅ Notificações filtradas:', filtered.length)
    return filtered
  }, [notifications, filter])

  const handleMarkAsRead = async (id: string) => {
    logger.debug('✅ Marcando notificação como lida:', id)
    await markAsRead(id)
  }

  const handleMarkAllAsRead = async () => {
    logger.debug('✅ Marcando todas como lidas')
    await markAllAsRead()
  }

  const handleDeleteNotification = async (id: string) => {
    logger.debug('🗑️ Deletando notificação:', id)
    await deleteNotification(id)
  }

  const handleFilterChange = (newFilter: 'all' | 'unread' | 'read') => {
    logger.debug('🔄 Mudando filtro de notificações:', { de: filter, para: newFilter })
    setFilter(newFilter)
  }

  const formatNotificationTime = (createdAt: string) => {
    try {
      return formatDistanceToNow(new Date(createdAt), {
        addSuffix: true,
        locale: ptBR
      })
    } catch {
      return 'há algum tempo'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement': return Award
      case 'course': return BookOpen
      case 'reminder': return Calendar
      case 'social': return MessageSquare
      case 'system': return Info
      case 'warning': return AlertCircle
      case 'quiz': return CheckCircle
      case 'material': return BookOpen
      default: return Bell
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'text-warning'
      case 'course': return 'text-primary'
      case 'reminder': return 'text-info'
      case 'social': return 'text-primary'
      case 'system': return 'text-muted-foreground'
      case 'warning': return 'text-warning'
      case 'quiz': return 'text-success'
      case 'material': return 'text-primary'
      default: return 'text-muted-foreground'
    }
  }

  if (isLoading) {
    return (
      <MagicLayout
        title="Notificações"
        description="Mantenha-se atualizado com as últimas novidades e atividades."
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MagicLayout>
    )
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
                onClick={handleMarkAllAsRead}
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
            <div className="flex gap-2 flex-1">
              {[
                { key: 'all' as const, label: 'Todas', count: notifications.length },
                { key: 'unread' as const, label: 'Não lidas', count: unreadCount },
                { key: 'read' as const, label: 'Lidas', count: notifications.length - unreadCount }
              ].map(({ key, label, count }) => (
                <Button
                  key={key}
                  variant={filter === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange(key)}
                  className={cn(
                    "flex items-center justify-center gap-2 min-w-[120px] transition-colors duration-300",
                    filter === key
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-primary/5"
                  )}
                >
                  <span className="whitespace-nowrap">{label}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs transition-colors duration-300 min-w-[24px] justify-center",
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
              const color = getNotificationColor(notification.type)

              return (
                <MagicCard
                  key={notification.id}
                  className={cn(
                    "p-6 transition-all duration-300",
                    !notification.is_read && "ring-2 ring-primary/20 bg-primary/5"
                  )}
                  glow
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      notification.is_read ? "bg-muted/50" : "bg-primary/10"
                    )}>
                      <IconComponent className={cn(
                        "h-5 w-5",
                        notification.is_read ? "text-muted-foreground" : color
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={cn(
                            "font-semibold mb-1",
                            !notification.is_read && "text-foreground"
                          )}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatNotificationTime(notification.created_at)}
                            </span>
                            {!notification.is_read && (
                              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                Nova
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNotification(notification.id)}
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
