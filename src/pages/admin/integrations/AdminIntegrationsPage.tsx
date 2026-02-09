import { useState, useEffect } from 'react'
import { MagicLayout } from '@/components/ui/magic-layout'
import { logger } from '@/lib/logger'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { testPandaConnection } from '@/services/pandaVideo'
import { 
  Settings, 
  Bot, 
  Video, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Key,
  TestTube,
  Save,
  RefreshCw
} from 'lucide-react'

interface IntegrationConfig {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  enabled: boolean
  apiKey: string
  webhookUrl: string
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: string
  features: string[]
}

export default function AdminIntegrationsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([
    {
      id: 'dify',
      name: 'Dify AI',
      description: 'Plataforma de IA para correção automática de redações e assistente inteligente',
      icon: <Bot className="h-6 w-6" />,
      enabled: false,
      apiKey: '',
      webhookUrl: '',
      status: 'disconnected',
      features: [
        'Correção automática de redações',
        'Assistente de dúvidas',
        'Geração de questões',
        'Análise de performance'
      ]
    },
    {
      id: 'panda-video',
      name: 'Panda Video',
      description: 'Plataforma de streaming de vídeo para aulas e conteúdo educacional',
      icon: <Video className="h-6 w-6" />,
      enabled: true,
      apiKey: 'panda-7815cbc9c501c0169d429ade132363867425dfb01a258da9a6a894ea8898908e',
      webhookUrl: '',
      status: 'disconnected',
      features: [
        'Streaming de aulas ao vivo',
        'Upload de vídeos',
        'Player personalizado',
        'Analytics de visualização'
      ]
    },
    {
      id: 'memberkit',
      name: 'Memberkit',
      description: 'Plataforma de gestão de membros e pagamentos para cursos',
      icon: <Users className="h-6 w-6" />,
      enabled: false,
      apiKey: '',
      webhookUrl: '',
      status: 'disconnected',
      features: [
        'Gestão de assinaturas',
        'Controle de acesso',
        'Webhooks de pagamento',
        'Sincronização de usuários'
      ]
    }
  ])

  useEffect(() => {
    loadIntegrations()
    // Testar conexão do Panda Video automaticamente
    testPandaVideoConnection()
  }, [])

  const testPandaVideoConnection = async () => {
    try {
      const result = await testPandaConnection()
      updateIntegration('panda-video', {
        status: result.success ? 'connected' : 'error'
      })
    } catch (error) {
      updateIntegration('panda-video', { status: 'error' })
    }
  }

  const loadIntegrations = async () => {
    try {
      // Simular carregamento das configurações salvas
      const savedConfigs = localStorage.getItem('admin-integrations')
      if (savedConfigs) {
        const parsed = JSON.parse(savedConfigs)
        setIntegrations(prev => prev.map(integration => ({
          ...integration,
          ...parsed[integration.id]
        })))
      }
    } catch (error) {
      logger.error('Erro ao carregar integrações:', error)
    }
  }

  const updateIntegration = (id: string, updates: Partial<IntegrationConfig>) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === id ? { ...integration, ...updates } : integration
    ))
  }

  const testConnection = async (integration: IntegrationConfig) => {
    setIsLoading(true)
    
    try {
      let result: { success: boolean; message: string; videosCount?: number }
      
      if (integration.id === 'panda-video') {
        // Usar o serviço real do Panda Video
        result = await testPandaConnection()
      } else {
        // Simular teste para outras integrações
        await new Promise(resolve => setTimeout(resolve, 2000))
        result = {
          success: integration.apiKey.length > 10,
          message: integration.apiKey.length > 10 
            ? 'Conexão bem-sucedida!' 
            : 'Verifique suas credenciais'
        }
      }
      
      updateIntegration(integration.id, {
        status: result.success ? 'connected' : 'error'
      })
      
      toast({
        title: result.success ? 'Conexão bem-sucedida!' : 'Erro na conexão',
        description: result.success 
          ? `${integration.name} conectado com sucesso${result.videosCount ? ` (${result.videosCount} vídeos encontrados)` : ''}`
          : result.message,
        variant: result.success ? 'default' : 'destructive'
      })
    } catch (error: any) {
      updateIntegration(integration.id, { status: 'error' })
      toast({
        title: 'Erro no teste',
        description: error.message || 'Não foi possível testar a conexão',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveIntegration = async (integration: IntegrationConfig) => {
    try {
      // Salvar configuração
      const savedConfigs = localStorage.getItem('admin-integrations') || '{}'
      const parsed = JSON.parse(savedConfigs)
      parsed[integration.id] = {
        enabled: integration.enabled,
        apiKey: integration.apiKey,
        webhookUrl: integration.webhookUrl,
        status: integration.status
      }
      localStorage.setItem('admin-integrations', JSON.stringify(parsed))
      
      toast({
        title: 'Configuração salva!',
        description: `${integration.name} configurado com sucesso`
      })
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a configuração',
        variant: 'destructive'
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Conectado</Badge>
      case 'error':
        return <Badge variant="destructive">Erro</Badge>
      default:
        return <Badge variant="secondary">Desconectado</Badge>
    }
  }

  return (
    <MagicLayout
      title="Integrações"
      description="Gerencie integrações com serviços externos para expandir as funcionalidades da plataforma."
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Integrações</h1>
            <p className="text-muted-foreground mt-2">
              Conecte o Everest com serviços externos para funcionalidades avançadas
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Integrations Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <MagicCard key={integration.id} className="p-6" glow>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {integration.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{integration.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {integration.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(integration.status)}
                  {getStatusBadge(integration.status)}
                </div>
              </div>

              {/* Features */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Funcionalidades:</h4>
                <div className="flex flex-wrap gap-1">
                  {integration.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator className="my-4" />

              {/* Configuration */}
              <div className="space-y-4">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                  <Label htmlFor={`enable-${integration.id}`}>
                    Habilitar integração
                  </Label>
                  <Switch
                    id={`enable-${integration.id}`}
                    checked={integration.enabled}
                    onCheckedChange={(checked) => 
                      updateIntegration(integration.id, { enabled: checked })
                    }
                  />
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <Label htmlFor={`api-key-${integration.id}`}>
                    API Key
                  </Label>
                  <div className="relative">
                    <Input
                      id={`api-key-${integration.id}`}
                      type="password"
                      placeholder="Insira sua API Key"
                      value={integration.apiKey}
                      onChange={(e) => 
                        updateIntegration(integration.id, { apiKey: e.target.value })
                      }
                    />
                    <Key className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Webhook URL */}
                <div className="space-y-2">
                  <Label htmlFor={`webhook-${integration.id}`}>
                    Webhook URL (opcional)
                  </Label>
                  <Input
                    id={`webhook-${integration.id}`}
                    type="url"
                    placeholder="https://exemplo.com/webhook"
                    value={integration.webhookUrl}
                    onChange={(e) => 
                      updateIntegration(integration.id, { webhookUrl: e.target.value })
                    }
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => testConnection(integration)}
                    disabled={isLoading || !integration.apiKey}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Testar
                  </Button>
                  <Button
                    onClick={() => saveIntegration(integration)}
                    disabled={!integration.apiKey}
                    size="sm"
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>

                {/* Documentation Link */}
                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      const docs = {
                        'dify': 'https://docs.dify.ai',
                        'panda-video': 'https://docs.pandavideo.com',
                        'memberkit': 'https://docs.memberkit.com.br'
                      }
                      window.open(docs[integration.id as keyof typeof docs], '_blank')
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ver documentação
                  </Button>
                </div>
              </div>
            </MagicCard>
          ))}
        </div>

        {/* Usage Statistics */}
        <MagicCard className="p-6" glow>
          <div className="flex items-center gap-4 mb-6">
            <Settings className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Estatísticas de Uso</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {integrations.filter(i => i.enabled).length}
              </div>
              <div className="text-sm text-muted-foreground">
                Integrações Ativas
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {integrations.filter(i => i.status === 'connected').length}
              </div>
              <div className="text-sm text-muted-foreground">
                Conectadas
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {integrations.filter(i => i.status === 'error').length}
              </div>
              <div className="text-sm text-muted-foreground">
                Com Erro
              </div>
            </div>
          </div>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}