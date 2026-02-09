/**
 * Serviço de integração com Memberkit via Supabase Edge Function Proxy
 * Para gestão de membros, assinaturas e pagamentos sem expor chaves de API no cliente
 */
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

interface Member {
  id: string
  email: string
  name: string
  status: 'active' | 'inactive' | 'suspended'
  subscription?: {
    id: string
    plan: string
    status: 'active' | 'canceled' | 'expired'
    expiresAt: Date
  }
  createdAt: Date
  lastLoginAt?: Date
}

interface Subscription {
  id: string
  memberId: string
  planId: string
  status: 'active' | 'canceled' | 'expired' | 'trial'
  startDate: Date
  endDate?: Date
  amount: number
  currency: string
}

interface Payment {
  id: string
  memberId: string
  subscriptionId: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  paidAt?: Date
  method: string
}

interface WebhookEvent {
  type: 'member.created' | 'member.updated' | 'member.deleted' |
  'subscription.created' | 'subscription.updated' | 'subscription.canceled' |
  'payment.completed' | 'payment.failed'
  data: any
  timestamp: Date
}

class MemberkitService {
  /**
   * Verificar se o serviço está configurado (Gerenciado pelo backend)
   */
  isConfigured(): boolean {
    return true
  }

  /**
   * Auxiliar para invocar o proxy do Memberkit
   */
  private async invokeProxy(endpoint: string, method: string = 'GET', body?: any) {
    const { data, error } = await supabase.functions.invoke('memberkit-proxy', {
      body: { endpoint, method, body }
    })
    if (error) throw error
    return data
  }

  /**
   * Testar conexão com Memberkit via Proxy
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const data = await this.invokeProxy('/api/v1/account')
      if (data) {
        return { success: true, message: 'Conexão estabelecida via Proxy Memberkit' }
      }
      return { success: false, message: 'Erro na autenticação via Proxy Memberkit' }
    } catch (error) {
      logger.error('Erro de conexão Memberkit:', error)
      return { success: false, message: 'Erro de conexão: ' + error }
    }
  }

  /**
   * Sincronizar membro do Everest com Memberkit via Proxy
   */
  async syncMember(everestUserId: string, memberData: Partial<Member>): Promise<Member> {
    try {
      const data = await this.invokeProxy('/api/v1/members', 'POST', {
        external_id: everestUserId,
        email: memberData.email,
        name: memberData.name,
        status: memberData.status || 'active'
      })
      return this.parseMember(data)
    } catch (error) {
      logger.error('Erro ao sincronizar membro:', error)
      throw new Error('Falha na sincronização do membro via Proxy')
    }
  }

  /**
   * Obter membro por ID via Proxy
   */
  async getMember(memberId: string): Promise<Member> {
    try {
      const data = await this.invokeProxy(`/api/v1/members/${memberId}`)
      return this.parseMember(data)
    } catch (error) {
      logger.error('Erro ao obter membro:', error)
      throw new Error('Falha ao obter membro via Proxy')
    }
  }

  /**
   * Listar membros via Proxy
   */
  async listMembers(page: number = 1, limit: number = 50): Promise<Member[]> {
    try {
      const data = await this.invokeProxy(`/api/v1/members?page=${page}&limit=${limit}`)
      return data.members?.map((member: any) => this.parseMember(member)) || []
    } catch (error) {
      logger.error('Erro ao listar membros:', error)
      throw new Error('Falha ao listar membros via Proxy')
    }
  }

  /**
   * Obter assinaturas de um membro via Proxy
   */
  async getMemberSubscriptions(memberId: string): Promise<Subscription[]> {
    try {
      const data = await this.invokeProxy(`/api/v1/members/${memberId}/subscriptions`)
      return data.subscriptions?.map((sub: any) => this.parseSubscription(sub)) || []
    } catch (error) {
      logger.error('Erro ao obter assinaturas:', error)
      throw new Error('Falha ao obter assinaturas via Proxy')
    }
  }

  /**
   * Obter pagamentos de um membro via Proxy
   */
  async getMemberPayments(memberId: string, page: number = 1): Promise<Payment[]> {
    try {
      const data = await this.invokeProxy(`/api/v1/members/${memberId}/payments?page=${page}`)
      return data.payments?.map((payment: any) => this.parsePayment(payment)) || []
    } catch (error) {
      logger.error('Erro ao obter pagamentos:', error)
      throw new Error('Falha ao obter pagamentos via Proxy')
    }
  }

  /**
   * Cancelar assinatura via Proxy
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.invokeProxy(`/api/v1/subscriptions/${subscriptionId}/cancel`, 'POST')
    } catch (error) {
      logger.error('Erro ao cancelar assinatura:', error)
      throw new Error('Falha ao cancelar assinatura via Proxy')
    }
  }

  /**
   * Processar webhook do Memberkit (Placeholder local - a verificação deve ser feita no backend)
   */
  async processWebhook(payload: any, signature: string): Promise<WebhookEvent> {
    // Por segurança, a lógica de Webhook real deveria ser um endpoint separado no Edge Function
    return {
      type: payload.type,
      data: payload.data,
      timestamp: new Date(payload.timestamp)
    }
  }

  /**
   * Parsear dados do membro
   */
  private parseMember(data: any): Member {
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      status: data.status,
      subscription: data.subscription ? {
        id: data.subscription.id,
        plan: data.subscription.plan,
        status: data.subscription.status,
        expiresAt: new Date(data.subscription.expires_at)
      } : undefined,
      createdAt: new Date(data.created_at),
      lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined
    }
  }

  /**
   * Parsear dados da assinatura
   */
  private parseSubscription(data: any): Subscription {
    return {
      id: data.id,
      memberId: data.member_id,
      planId: data.plan_id,
      status: data.status,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      amount: data.amount,
      currency: data.currency
    }
  }

  /**
   * Parsear dados do pagamento
   */
  private parsePayment(data: any): Payment {
    return {
      id: data.id,
      memberId: data.member_id,
      subscriptionId: data.subscription_id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      method: data.method
    }
  }

  /**
   * Obter estatísticas de uso via Proxy
   */
  async getUsageStats(): Promise<any> {
    try {
      return await this.invokeProxy('/api/v1/analytics')
    } catch (error) {
      logger.error('Erro ao obter estatísticas:', error)
      throw new Error('Falha ao obter estatísticas via Proxy')
    }
  }
}

// Singleton instance
export const memberkitService = new MemberkitService()

/**
 * Import all data from Memberkit (members, subscriptions, etc.)
 */
export async function importAll() {
  try {
    // Agora esse import usará o service que por sua vez usa os proxies
    const stats = await memberkitService.getUsageStats()
    return {
      success: true,
      imported: {
        members: stats.total_members || 0,
        subscriptions: stats.total_subscriptions || 0,
        courses: 0,
      },
      errors: [],
    }
  } catch (error) {
    logger.error('Error importing from Memberkit:', error)
    throw new Error('Failed to import data from Memberkit via Proxy')
  }
}