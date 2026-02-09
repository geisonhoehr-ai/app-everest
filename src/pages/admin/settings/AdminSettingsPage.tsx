import { useState } from 'react'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  Settings, 
  Save, 
  Globe, 
  Mail, 
  Bell, 
  Shield,
  Palette,
  Database,
  Zap,
  Lock
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
    toast({
      title: 'Configurações salvas',
      description: 'As configurações foram atualizadas com sucesso.',
    })
  }

  return (
    <MagicLayout 
      title="Configurações do Sistema"
      description="Gerencie as configurações globais da plataforma"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Painel de Configurações</h2>
              <p className="text-sm text-muted-foreground">
                Configure o comportamento e aparência do sistema
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="email">E-mail</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <MagicCard variant="premium" size="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Configurações Gerais
                </CardTitle>
                <CardDescription>
                  Configure as informações básicas da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="platform-name">Nome da Plataforma</Label>
                    <Input 
                      id="platform-name" 
                      placeholder="Everest" 
                      defaultValue="Everest"
                      className="bg-card/50 backdrop-blur-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform-url">URL da Plataforma</Label>
                    <Input 
                      id="platform-url" 
                      placeholder="https://everest.com" 
                      defaultValue="https://everest.com"
                      className="bg-card/50 backdrop-blur-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform-description">Descrição</Label>
                  <Textarea 
                    id="platform-description" 
                    placeholder="Descrição da plataforma"
                    defaultValue="Plataforma de ensino preparatória para concursos"
                    className="bg-card/50 backdrop-blur-sm min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select defaultValue="america-sao_paulo">
                    <SelectTrigger className="bg-card/50 backdrop-blur-sm">
                      <SelectValue placeholder="Selecione o fuso horário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="america-sao_paulo">América/São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="america-new_york">América/Nova York (GMT-5)</SelectItem>
                      <SelectItem value="europe-london">Europa/Londres (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
                  <div className="space-y-0.5">
                    <Label>Modo de Manutenção</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativar para realizar manutenção no sistema
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
                  <div className="space-y-0.5">
                    <Label>Permitir Novos Cadastros</Label>
                    <p className="text-sm text-muted-foreground">
                      Usuários podem criar novas contas
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </MagicCard>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email" className="space-y-6">
            <MagicCard variant="premium" size="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Configurações de E-mail
                </CardTitle>
                <CardDescription>
                  Configure o servidor SMTP e templates de e-mail
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">Servidor SMTP</Label>
                    <Input 
                      id="smtp-host" 
                      placeholder="smtp.gmail.com"
                      className="bg-card/50 backdrop-blur-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">Porta SMTP</Label>
                    <Input 
                      id="smtp-port" 
                      placeholder="587"
                      type="number"
                      className="bg-card/50 backdrop-blur-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-user">Usuário SMTP</Label>
                    <Input 
                      id="smtp-user" 
                      placeholder="noreply@everest.com"
                      type="email"
                      className="bg-card/50 backdrop-blur-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">Senha SMTP</Label>
                    <Input 
                      id="smtp-password" 
                      placeholder="••••••••"
                      type="password"
                      className="bg-card/50 backdrop-blur-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
                  <div className="space-y-0.5">
                    <Label>Usar SSL/TLS</Label>
                    <p className="text-sm text-muted-foreground">
                      Conexão segura com o servidor SMTP
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Button variant="outline" className="w-full">
                  Testar Configuração de E-mail
                </Button>
              </CardContent>
            </MagicCard>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <MagicCard variant="premium" size="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Configurações de Notificações
                </CardTitle>
                <CardDescription>
                  Gerencie quais notificações serão enviadas aos usuários
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: 'Nova Mensagem', description: 'Notificar sobre novas mensagens no fórum' },
                  { title: 'Redação Corrigida', description: 'Notificar quando uma redação for corrigida' },
                  { title: 'Novo Curso', description: 'Notificar sobre novos cursos disponíveis' },
                  { title: 'Lembrete de Estudo', description: 'Enviar lembretes diários de estudo' },
                  { title: 'Conquista Desbloqueada', description: 'Notificar sobre novas conquistas' },
                  { title: 'Ranking Atualizado', description: 'Notificar sobre mudanças no ranking' }
                ].map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50"
                  >
                    <div className="space-y-0.5">
                      <Label>{item.title}</Label>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <Switch defaultChecked={index < 4} />
                  </div>
                ))}
              </CardContent>
            </MagicCard>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <MagicCard variant="premium" size="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Configurações de Segurança
                </CardTitle>
                <CardDescription>
                  Configure políticas de segurança e autenticação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Tempo de Sessão (minutos)</Label>
                  <Input 
                    id="session-timeout" 
                    placeholder="60"
                    type="number"
                    defaultValue="60"
                    className="bg-card/50 backdrop-blur-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-attempts">Máximo de Tentativas de Login</Label>
                  <Input 
                    id="max-attempts" 
                    placeholder="5"
                    type="number"
                    defaultValue="5"
                    className="bg-card/50 backdrop-blur-sm"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
                  <div className="space-y-0.5">
                    <Label>Autenticação de Dois Fatores</Label>
                    <p className="text-sm text-muted-foreground">
                      Exigir 2FA para todos os administradores
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
                  <div className="space-y-0.5">
                    <Label>Exigir Senha Forte</Label>
                    <p className="text-sm text-muted-foreground">
                      Senhas devem ter no mínimo 8 caracteres
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
                  <div className="space-y-0.5">
                    <Label>Log de Auditoria</Label>
                    <p className="text-sm text-muted-foreground">
                      Registrar todas as ações administrativas
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </MagicCard>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <MagicCard variant="premium" size="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Configurações de Aparência
                </CardTitle>
                <CardDescription>
                  Personalize cores, logos e temas da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Cor Primária</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="primary-color" 
                        type="color"
                        defaultValue="#FF6B35"
                        className="w-16 h-10 p-1"
                      />
                      <Input 
                        placeholder="#FF6B35"
                        defaultValue="#FF6B35"
                        className="bg-card/50 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Cor Secundária</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="secondary-color" 
                        type="color"
                        defaultValue="#004E89"
                        className="w-16 h-10 p-1"
                      />
                      <Input 
                        placeholder="#004E89"
                        defaultValue="#004E89"
                        className="bg-card/50 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Logo da Plataforma</Label>
                  <Input 
                    id="logo" 
                    type="file"
                    accept="image/*"
                    className="bg-card/50 backdrop-blur-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recomendado: PNG ou SVG, 200x200px
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favicon">Favicon</Label>
                  <Input 
                    id="favicon" 
                    type="file"
                    accept="image/*"
                    className="bg-card/50 backdrop-blur-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recomendado: ICO ou PNG, 32x32px
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
                  <div className="space-y-0.5">
                    <Label>Modo Escuro por Padrão</Label>
                    <p className="text-sm text-muted-foreground">
                      Iniciar sistema em modo escuro
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
                  <div className="space-y-0.5">
                    <Label>Animações</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativar animações e transições suaves
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </MagicCard>
          </TabsContent>
        </Tabs>

        {/* System Info */}
        <MagicCard variant="glass" glow>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10">
                <Database className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold">Sistema Operacional</h3>
                <p className="text-sm text-muted-foreground">
                  Versão 2.0.0 • Última atualização: 30/09/2025
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">Online</span>
            </div>
          </div>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
