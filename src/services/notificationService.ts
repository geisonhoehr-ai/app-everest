import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { logger } from '@/lib/logger'

type Notification = Database['public']['Tables']['notifications']['Row']
type NotificationInsert =
  Database['public']['Tables']['notifications']['Insert']

export interface NotificationParams {
  userId: string
  type: string
  title: string
  message: string
  relatedEntityId?: string
  relatedEntityType?: string
}

class NotificationService {
  /**
   * Cria uma nova notificação para um usuário
   */
  async createNotification(params: NotificationParams): Promise<Notification | null> {
    try {
      logger.debug('📝 Criando notificação:', params)

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          related_entity_id: params.relatedEntityId,
          related_entity_type: params.relatedEntityType,
          is_read: false
        })
        .select()
        .single()

      if (error) throw error

      logger.debug('✅ Notificação criada:', data.id)
      return data
    } catch (error) {
      logger.error('❌ Erro ao criar notificação:', error)
      return null
    }
  }

  /**
   * Cria notificações em massa para múltiplos usuários
   */
  async createBulkNotifications(
    userIds: string[],
    notification: Omit<NotificationParams, 'userId'>
  ): Promise<boolean> {
    try {
      logger.debug('📝 Criando notificações em massa para:', userIds.length, 'usuários')

      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        related_entity_id: notification.relatedEntityId,
        related_entity_type: notification.relatedEntityType,
        is_read: false
      }))

      const { error } = await supabase
        .from('notifications')
        .insert(notifications)

      if (error) throw error

      logger.debug('✅ Notificações criadas em massa')
      return true
    } catch (error) {
      logger.error('❌ Erro ao criar notificações em massa:', error)
      return false
    }
  }

  /**
   * Busca notificações de um usuário
   */
  async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('❌ Erro ao buscar notificações:', error)
      return []
    }
  }

  /**
   * Marca uma notificação como lida
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      logger.error('❌ Erro ao marcar notificação como lida:', error)
      return false
    }
  }

  /**
   * Marca todas as notificações de um usuário como lidas
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
      return true
    } catch (error) {
      logger.error('❌ Erro ao marcar todas como lidas:', error)
      return false
    }
  }

  /**
   * Deleta uma notificação
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      logger.error('❌ Erro ao deletar notificação:', error)
      return false
    }
  }

  /**
   * Conta notificações não lidas de um usuário
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      logger.error('❌ Erro ao contar notificações não lidas:', error)
      return 0
    }
  }

  // Métodos auxiliares para criar tipos específicos de notificações

  /**
   * Notificação de nova aula disponível
   */
  async notifyNewLesson(userId: string, lessonTitle: string, lessonId: string) {
    return this.createNotification({
      userId,
      type: 'course',
      title: 'Nova Aula Disponível',
      message: `Uma nova aula foi adicionada: "${lessonTitle}". Confira agora!`,
      relatedEntityId: lessonId,
      relatedEntityType: 'lesson'
    })
  }

  /**
   * Notificação de conquista desbloqueada
   */
  async notifyAchievement(userId: string, achievementTitle: string, achievementId: string) {
    return this.createNotification({
      userId,
      type: 'achievement',
      title: 'Nova Conquista Desbloqueada!',
      message: `Parabéns! Você desbloqueou a conquista "${achievementTitle}".`,
      relatedEntityId: achievementId,
      relatedEntityType: 'achievement'
    })
  }

  /**
   * Notificação de quiz disponível
   */
  async notifyQuizAvailable(userId: string, quizTitle: string, quizId: string) {
    return this.createNotification({
      userId,
      type: 'quiz',
      title: 'Quiz Disponível',
      message: `Um novo quiz está disponível: "${quizTitle}". Teste seus conhecimentos!`,
      relatedEntityId: quizId,
      relatedEntityType: 'quiz'
    })
  }

  /**
   * Notificação de material novo
   */
  async notifyNewMaterial(userId: string, materialTitle: string, materialId: string) {
    return this.createNotification({
      userId,
      type: 'material',
      title: 'Novo Material Disponível',
      message: `Um novo material foi adicionado: "${materialTitle}".`,
      relatedEntityId: materialId,
      relatedEntityType: 'material'
    })
  }

  /**
   * Notificação de lembrete
   */
  async notifyReminder(userId: string, title: string, message: string) {
    return this.createNotification({
      userId,
      type: 'reminder',
      title,
      message
    })
  }
}

// Exportar instância singleton
export const notificationService = new NotificationService()

// Exportar função legacy para compatibilidade
export const createNotification = async (notification: NotificationInsert) => {
  const { error } = await supabase.from('notifications').insert(notification)
  if (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}
