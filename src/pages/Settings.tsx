import { useState } from 'react'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Download,
  Upload,
  Trash2,
  Save,
  Camera
} from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    profile: {
      firstName: 'João',
      lastName: 'Silva',
      email: 'joao.silva@email.com',
      bio: 'Estudante apaixonado por aprender e crescer constantemente.',
      avatar: 'https://img.usecurling.com/ppl/medium?seed=user123'
    },
    notifications: {
      email: true,
      push: true,
      achievements: true,
      courses: true,
      reminders: false,
      social: true
    },
    privacy: {
      profileVisibility: 'public',
      showProgress: true,
      showAchievements: true,
      allowMessages: true
    },
    appearance: {
      theme: 'system',
      language: 'pt-BR',
      fontSize: 'medium',
      animations: true
    }
  })

  const handleSave = () => {
    // Aqui você implementaria a lógica para salvar as configurações
    console.log('Configurações salvas:', settings)
  }

  const handleAvatarChange = () => {
    // Implementar upload de avatar
    console.log('Mudar avatar')
  }

  return (
    <MagicLayout
      title="Configurações"
      description="Personalize sua experiência e gerencie suas preferências."
    >
      <div className="space-y-8">
        {/* Profile Settings */}
        <MagicCard className="p-6" glow>
          <div className="flex items-center gap-4 mb-6">
            <User className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Perfil</h2>
          </div>
          
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                <AvatarImage src={settings.profile.avatar} alt="Avatar" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-xl">
                  {settings.profile.firstName[0]}{settings.profile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={handleAvatarChange}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{settings.profile.firstName} {settings.profile.lastName}</h3>
              <p className="text-muted-foreground">{settings.profile.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                value={settings.profile.firstName}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, firstName: e.target.value }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                value={settings.profile.lastName}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, lastName: e.target.value }
                }))}
              />
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={settings.profile.email}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                profile: { ...prev.profile, email: e.target.value }
              }))}
            />
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              value={settings.profile.bio}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                profile: { ...prev.profile, bio: e.target.value }
              }))}
              placeholder="Conte um pouco sobre você..."
            />
          </div>
        </MagicCard>

        {/* Notifications */}
        <MagicCard className="p-6" glow>
          <div className="flex items-center gap-4 mb-6">
            <Bell className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Notificações</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Notificações por email</Label>
                <p className="text-sm text-muted-foreground">Receba notificações importantes por email</p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.notifications.email}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, email: checked }
                }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications">Notificações push</Label>
                <p className="text-sm text-muted-foreground">Receba notificações no navegador</p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.notifications.push}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, push: checked }
                }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="achievements">Conquistas</Label>
                <p className="text-sm text-muted-foreground">Seja notificado quando ganhar novas conquistas</p>
              </div>
              <Switch
                id="achievements"
                checked={settings.notifications.achievements}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, achievements: checked }
                }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="courses">Novos cursos</Label>
                <p className="text-sm text-muted-foreground">Seja notificado sobre novos cursos disponíveis</p>
              </div>
              <Switch
                id="courses"
                checked={settings.notifications.courses}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, courses: checked }
                }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reminders">Lembretes de estudo</Label>
                <p className="text-sm text-muted-foreground">Receba lembretes para suas sessões de estudo</p>
              </div>
              <Switch
                id="reminders"
                checked={settings.notifications.reminders}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, reminders: checked }
                }))}
              />
            </div>
          </div>
        </MagicCard>

        {/* Privacy */}
        <MagicCard className="p-6" glow>
          <div className="flex items-center gap-4 mb-6">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Privacidade</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-progress">Mostrar progresso</Label>
                <p className="text-sm text-muted-foreground">Permitir que outros vejam seu progresso</p>
              </div>
              <Switch
                id="show-progress"
                checked={settings.privacy.showProgress}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, showProgress: checked }
                }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-achievements">Mostrar conquistas</Label>
                <p className="text-sm text-muted-foreground">Permitir que outros vejam suas conquistas</p>
              </div>
              <Switch
                id="show-achievements"
                checked={settings.privacy.showAchievements}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, showAchievements: checked }
                }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allow-messages">Permitir mensagens</Label>
                <p className="text-sm text-muted-foreground">Permitir que outros usuários enviem mensagens</p>
              </div>
              <Switch
                id="allow-messages"
                checked={settings.privacy.allowMessages}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, allowMessages: checked }
                }))}
              />
            </div>
          </div>
        </MagicCard>

        {/* Appearance */}
        <MagicCard className="p-6" glow>
          <div className="flex items-center gap-4 mb-6">
            <Palette className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Aparência</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="animations">Animações</Label>
                <p className="text-sm text-muted-foreground">Habilitar animações e transições</p>
              </div>
              <Switch
                id="animations"
                checked={settings.appearance.animations}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  appearance: { ...prev.appearance, animations: checked }
                }))}
              />
            </div>
          </div>
        </MagicCard>

        {/* Data Management */}
        <MagicCard className="p-6" glow>
          <div className="flex items-center gap-4 mb-6">
            <Download className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Gerenciamento de Dados</h2>
          </div>

          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Download className="mr-2 h-4 w-4" />
              Exportar meus dados
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Upload className="mr-2 h-4 w-4" />
              Importar dados
            </Button>
            <Separator />
            <Button variant="destructive" className="w-full justify-start">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir conta
            </Button>
          </div>
        </MagicCard>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="group transition-all duration-300 hover:bg-primary/90">
            <Save className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            Salvar Configurações
          </Button>
        </div>
      </div>
    </MagicLayout>
  )
}
