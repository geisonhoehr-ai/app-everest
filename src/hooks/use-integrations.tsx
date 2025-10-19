import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { difyService } from '@/services/difyService'
import { pandaVideoService } from '@/services/pandaVideoService'
import { memberkitService } from '@/services/memberkitService'

interface IntegrationConfig {
  id: string
  name: string
  enabled: boolean
  apiKey: string
  webhookUrl: string
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: string
}

interface IntegrationStats {
  total: number
  active: number
  connected: number
  errors: number
}

export function useIntegrations() {
  const { toast } = useToast()
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<IntegrationStats>({
    total: 0,
    active: 0,
    connected: 0,
    errors: 0
  })

  // Carregar configurações salvas
  const loadIntegrations = useCallback(async () => {
    try {
      const savedConfigs = localStorage.getItem('admin-integrations')
      if (savedConfigs) {
        const parsed = JSON.parse(savedConfigs)
        const integrationsList = Object.entries(parsed).map(([id, config]: [string, any]) => ({
          id,
          name: getIntegrationName(id),
          ...config
        }))
        setIntegrations(integrationsList)
        updateStats(integrationsList)
      }
    } catch (error) {
      console.error('Erro ao carregar integrações:', error)
    }
  }, [])

  // Salvar configuração
  const saveIntegration = useCallback(async (config: IntegrationConfig) => {
    try {
      const savedConfigs = localStorage.getItem('admin-integrations') || '{}'
      const parsed = JSON.parse(savedConfigs)
      parsed[config.id] = {
        enabled: config.enabled,
        apiKey: config.apiKey,
        webhookUrl: config.webhookUrl,
        status: config.status
      }
      localStorage.setItem('admin-integrations', JSON.stringify(parsed))
      
      // Atualizar estado local
      setIntegrations(prev => {
        const updated = prev.map(integration => 
          integration.id === config.id ? config : integration
        )
        updateStats(updated)
        return updated
      })

      toast({
        title: 'Configuração salva!',
        description: `${config.name} configurado com sucesso`
      })
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a configuração',
        variant: 'destructive'
      })
    }
  }, [toast])

  // Testar conexão
  const testConnection = useCallback(async (integrationId: string) => {
    setIsLoading(true)
    
    try {
      let result: { success: boolean; message: string }
      
      switch (integrationId) {
        case 'dify':
          difyService.configure({
            apiKey: integrations.find(i => i.id === 'dify')?.apiKey || '',
            baseUrl: 'https://api.dify.ai',
            workflowId: 'essay-correction'
          })
          result = await difyService.testConnection()
          break
          
        case 'panda-video':
          pandaVideoService.configure({
            apiKey: integrations.find(i => i.id === 'panda-video')?.apiKey || '',
            baseUrl: 'https://api.pandavideo.com',
            playerId: 'default'
          })
          result = await pandaVideoService.testConnection()
          break
          
        case 'memberkit':
          memberkitService.configure({
            apiKey: integrations.find(i => i.id === 'memberkit')?.apiKey || '',
            baseUrl: 'https://api.memberkit.com.br',
            webhookSecret: 'secret'
          })
          result = await memberkitService.testConnection()
          break
          
        default:
          result = { success: false, message: 'Integração não encontrada' }
      }

      // Atualizar status
      setIntegrations(prev => {
        const updated = prev.map(integration => 
          integration.id === integrationId 
            ? { ...integration, status: result.success ? 'connected' : 'error' }
            : integration
        )
        updateStats(updated)
        return updated
      })

      toast({
        title: result.success ? 'Conexão bem-sucedida!' : 'Erro na conexão',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      })
    } catch (error) {
      toast({
        title: 'Erro no teste',
        description: 'Não foi possível testar a conexão',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [integrations, toast])

  // Atualizar estatísticas
  const updateStats = useCallback((integrationsList: IntegrationConfig[]) => {
    setStats({
      total: integrationsList.length,
      active: integrationsList.filter(i => i.enabled).length,
      connected: integrationsList.filter(i => i.status === 'connected').length,
      errors: integrationsList.filter(i => i.status === 'error').length
    })
  }, [])

  // Obter nome da integração
  const getIntegrationName = (id: string): string => {
    const names: Record<string, string> = {
      'dify': 'Dify AI',
      'panda-video': 'Panda Video',
      'memberkit': 'Memberkit'
    }
    return names[id] || id
  }

  // Obter serviço configurado
  const getConfiguredService = (integrationId: string) => {
    const config = integrations.find(i => i.id === integrationId)
    if (!config || !config.enabled) return null

    switch (integrationId) {
      case 'dify':
        difyService.configure({
          apiKey: config.apiKey,
          baseUrl: 'https://api.dify.ai',
          workflowId: 'essay-correction'
        })
        return difyService
        
      case 'panda-video':
        pandaVideoService.configure({
          apiKey: config.apiKey,
          baseUrl: 'https://api.pandavideo.com',
          playerId: 'default'
        })
        return pandaVideoService
        
      case 'memberkit':
        memberkitService.configure({
          apiKey: config.apiKey,
          baseUrl: 'https://api.memberkit.com.br',
          webhookSecret: 'secret'
        })
        return memberkitService
        
      default:
        return null
    }
  }

  // Carregar integrações na inicialização
  useEffect(() => {
    loadIntegrations()
  }, [loadIntegrations])

  return {
    integrations,
    stats,
    isLoading,
    loadIntegrations,
    saveIntegration,
    testConnection,
    getConfiguredService
  }
}
