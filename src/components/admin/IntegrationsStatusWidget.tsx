import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useIntegrations } from '@/hooks/use-integrations'
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink
} from 'lucide-react'

export function IntegrationsStatusWidget() {
  const { integrations, stats, isLoading } = useIntegrations()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Conectado</Badge>
      case 'error':
        return <Badge variant="destructive" className="text-xs">Erro</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">Desconectado</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Integrações
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open('/admin/integrations', '_blank')}
          className="h-8 w-8 p-0"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.active}
              </div>
              <div className="text-xs text-muted-foreground">
                Ativas
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.connected}
              </div>
              <div className="text-xs text-muted-foreground">
                Conectadas
              </div>
            </div>
          </div>

          {/* Lista de integrações */}
          <div className="space-y-2">
            {integrations.slice(0, 3).map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(integration.status)}
                  <span className="text-sm font-medium">
                    {integration.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(integration.status)}
                  {integration.enabled && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Link para ver todas */}
          {integrations.length > 3 && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('/admin/integrations', '_blank')}
                className="text-xs"
              >
                Ver todas ({integrations.length})
              </Button>
            </div>
          )}

          {/* Aviso se não há integrações */}
          {integrations.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">
                Nenhuma integração configurada
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/admin/integrations', '_blank')}
              >
                Configurar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
