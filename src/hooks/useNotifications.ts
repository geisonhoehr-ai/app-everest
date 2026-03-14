import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-provider'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { logger } from '@/lib/logger'

type Notification = Database['public']['Tables']['notifications']['Row']
type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Carregar notificações do usuário
  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      logger.debug('📬 Carregando notificações do usuário:', user.id)

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      logger.debug('✅ Notificações carregadas:', data?.length || 0)
      setNotifications(data || [])
    } catch (err) {
      logger.error('❌ Erro ao carregar notificações:', err)
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return false

    try {
      logger.debug('✅ Marcando notificação como lida:', notificationId)

      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // Atualizar estado local
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      )

      return true
    } catch (err) {
      logger.error('❌ Erro ao marcar notificação como lida:', err)
      return false
    }
  }, [user?.id])

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return false

    try {
      logger.debug('✅ Marcando todas as notificações como lidas')

      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (updateError) throw updateError

      // Atualizar estado local
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      )

      return true
    } catch (err) {
      logger.error('❌ Erro ao marcar todas como lidas:', err)
      return false
    }
  }, [user?.id])

  // Deletar notificação
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user?.id) return false

    try {
      logger.debug('🗑️ Deletando notificação:', notificationId)

      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      // Atualizar estado local
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      )

      return true
    } catch (err) {
      logger.error('❌ Erro ao deletar notificação:', err)
      return false
    }
  }, [user?.id])

  // Criar nova notificação
  const createNotification = useCallback(async (notification: Omit<NotificationInsert, 'user_id'>) => {
    if (!user?.id) return null

    try {
      logger.debug('📝 Criando nova notificação')

      const { data, error: insertError } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          user_id: user.id
        })
        .select()
        .single()

      if (insertError) throw insertError

      logger.debug('✅ Notificação criada:', data)

      // Adicionar ao estado local
      setNotifications(prev => [data, ...prev])

      return data
    } catch (err) {
      logger.error('❌ Erro ao criar notificação:', err)
      return null
    }
  }, [user?.id])

  // Contar notificações não lidas (memoizado)
  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications])

  // Polling para atualizações de notificações (30s interval)
  // Substituiu Realtime WebSocket para reduzir conexões simultâneas em escala
  useEffect(() => {
    if (!user?.id) return

    const POLL_INTERVAL = 30_000 // 30 segundos

    const poll = () => {
      loadNotifications()
    }

    const intervalId = setInterval(poll, POLL_INTERVAL)

    return () => {
      clearInterval(intervalId)
    }
  }, [user?.id, loadNotifications])

  // Carregar notificações na inicialização
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification
  }
}
