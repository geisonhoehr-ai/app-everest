/**
 * Serviço de integração com Memberkit
 * Para gestão de membros, assinaturas e pagamentos
 */

interface MemberkitConfig {
  apiKey: string
  baseUrl: string
  webhookSecret: string
}

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
  private config: MemberkitConfig | null = null

  /**
   * Configurar o serviço Memberkit
   */
  configure(config: MemberkitConfig): void {
    this.config = config
  }

  /**
   * Verificar se o serviço está configurado
   */
  isConfigured(): boolean {
    return this.config !== null && this.config.apiKey.length > 0
  }

  /**
   * Testar conexão com Memberkit
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return { success: false, message: 'Serviço não configurado' }
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/api/v1/account`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        return { success: true, message: 'Conexão estabelecida com sucesso' }
      } else {
        return { success: false, message: 'Erro na autenticação' }
      }
    } catch (error) {
      return { success: false, message: 'Erro de conexão: ' + error }
    }
  }

  /**
   * Sincronizar membro do Everest com Memberkit
   */
  async syncMember(everestUserId: string, memberData: Partial<Member>): Promise<Member> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Memberkit não configurado')
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/api/v1/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          external_id: everestUserId,
          email: memberData.email,
          name: memberData.name,
          status: memberData.status || 'active'
        })
      })

      if (!response.ok) {
        throw new Error(`Erro ao sincronizar membro: ${response.status}`)
      }

      const data = await response.json()
      return this.parseMember(data)
    } catch (error) {
      console.error('Erro ao sincronizar membro:', error)
      throw new Error('Falha na sincronização do membro')
    }
  }

  /**
   * Obter membro por ID
   */
  async getMember(memberId: string): Promise<Member> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Memberkit não configurado')
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/api/v1/members/${memberId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ao obter membro: ${response.status}`)
      }

      const data = await response.json()
      return this.parseMember(data)
    } catch (error) {
      console.error('Erro ao obter membro:', error)
      throw new Error('Falha ao obter membro')
    }
  }

  /**
   * Listar membros
   */
  async listMembers(page: number = 1, limit: number = 50): Promise<Member[]> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Memberkit não configurado')
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/api/v1/members?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ao listar membros: ${response.status}`)
      }

      const data = await response.json()
      return data.members.map((member: any) => this.parseMember(member))
    } catch (error) {
      console.error('Erro ao listar membros:', error)
      throw new Error('Falha ao listar membros')
    }
  }

  /**
   * Obter assinaturas de um membro
   */
  async getMemberSubscriptions(memberId: string): Promise<Subscription[]> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Memberkit não configurado')
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/api/v1/members/${memberId}/subscriptions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ao obter assinaturas: ${response.status}`)
      }

      const data = await response.json()
      return data.subscriptions.map((sub: any) => this.parseSubscription(sub))
    } catch (error) {
      console.error('Erro ao obter assinaturas:', error)
      throw new Error('Falha ao obter assinaturas')
    }
  }

  /**
   * Obter pagamentos de um membro
   */
  async getMemberPayments(memberId: string, page: number = 1): Promise<Payment[]> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Memberkit não configurado')
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/api/v1/members/${memberId}/payments?page=${page}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ao obter pagamentos: ${response.status}`)
      }

      const data = await response.json()
      return data.payments.map((payment: any) => this.parsePayment(payment))
    } catch (error) {
      console.error('Erro ao obter pagamentos:', error)
      throw new Error('Falha ao obter pagamentos')
    }
  }

  /**
   * Cancelar assinatura
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Memberkit não configurado')
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/api/v1/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ao cancelar assinatura: ${response.status}`)
      }
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error)
      throw new Error('Falha ao cancelar assinatura')
    }
  }

  /**
   * Processar webhook do Memberkit
   */
  async processWebhook(payload: any, signature: string): Promise<WebhookEvent> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Memberkit não configurado')
    }

    // Verificar assinatura do webhook
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Assinatura do webhook inválida')
    }

    return {
      type: payload.type,
      data: payload.data,
      timestamp: new Date(payload.timestamp)
    }
  }

  /**
   * Verificar assinatura do webhook
   */
  private verifyWebhookSignature(payload: any, signature: string): boolean {
    // Implementar verificação de assinatura HMAC
    // Por simplicidade, retornando true
    return true
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
   * Obter estatísticas de uso
   */
  async getUsageStats(): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Serviço Memberkit não configurado')
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/api/v1/analytics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      throw new Error('Falha ao obter estatísticas')
    }
  }
}

// Singleton instance
export const memberkitService = new MemberkitService()

/**
 * Import all data from Memberkit (members, subscriptions, etc.)
 * This is a placeholder function for the import page
 */
export async function importAll() {
  try {
    // TODO: Implement actual import logic
    // For now, return a mock result
    return {
      success: true,
      imported: {
        members: 0,
        subscriptions: 0,
        courses: 0,
      },
      errors: [],
    }
  } catch (error) {
    console.error('Error importing from Memberkit:', error)
    throw new Error('Failed to import data from Memberkit')
  }
}