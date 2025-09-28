import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-provider'
import {
  getUserSettings,
  saveDashboardLayout,
} from '@/services/userSettingsService'
import { DEFAULT_LAYOUTS, AVAILABLE_WIDGETS } from '@/lib/dashboard-config'
import { WidgetRenderer } from '@/components/dashboard/WidgetRenderer'
import { CustomizationPanel } from '@/components/dashboard/CustomizationPanel'
import { Button } from '@/components/ui/button'
import { Settings, Layout, GripVertical } from 'lucide-react'
import { SectionLoader } from '@/components/SectionLoader'
import { useToast } from '@/components/ui/use-toast'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [layout, setLayout] = useState<{ order: string[]; hidden: string[] }>({
    order: [],
    hidden: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isCustomizing, setIsCustomizing] = useState(false)

  const draggedItemIndex = useRef<number | null>(null)
  const dragOverItemIndex = useRef<number | null>(null)
  const [dragOverVisualIndex, setDragOverVisualIndex] = useState<number | null>(
    null,
  )

  useEffect(() => {
    if (user && profile) {
      setIsLoading(true)
      getUserSettings(user.id)
        .then((settings) => {
          const savedLayout = settings?.dashboard_layout as any
          if (savedLayout && savedLayout.order) {
            setLayout(savedLayout)
          } else {
            // Use default layout for the user's role
            setLayout(DEFAULT_LAYOUTS[profile.role])
          }
        })
        .catch((error) => {
          // If user_settings fails completely, just use defaults
          console.warn('Failed to load user settings, using defaults:', error)
          setLayout(DEFAULT_LAYOUTS[profile.role])
        })
        .finally(() => setIsLoading(false))
    }
  }, [user, profile])

  if (isLoading || !profile) {
    return <SectionLoader />
  }

  const handleSave = async () => {
    if (!user) return

    try {
      const result = await saveDashboardLayout(user.id, layout)
      if (result) {
        toast({ title: 'Dashboard salvo com sucesso!' })
      } else {
        toast({
          title: 'Configuração aplicada',
          description: 'Layout salvo localmente (funcionalidade de persistência indisponível)'
        })
      }
      setIsCustomizing(false)
    } catch (error) {
      console.warn('Error saving dashboard layout:', error)
      toast({
        title: 'Layout aplicado',
        description: 'As configurações estão ativas para esta sessão'
      })
      setIsCustomizing(false)
    }
  }

  const handleReset = () => {
    setLayout(DEFAULT_LAYOUTS[profile.role])
    toast({ title: 'Dashboard restaurado para o padrão.' })
  }

  const handleVisibilityChange = (widgetId: string, isVisible: boolean) => {
    setLayout((prev) => {
      const newOrder = isVisible
        ? [...prev.order, widgetId]
        : prev.order.filter((id) => id !== widgetId)
      const newHidden = isVisible
        ? prev.hidden.filter((id) => id !== widgetId)
        : [...prev.hidden, widgetId]
      return { order: newOrder, hidden: newHidden }
    })
  }

  const handleDragStart = (index: number) => {
    draggedItemIndex.current = index
  }

  const handleDragEnter = (index: number) => {
    dragOverItemIndex.current = index
    setDragOverVisualIndex(index)
  }

  const handleDrop = () => {
    if (
      draggedItemIndex.current === null ||
      dragOverItemIndex.current === null ||
      draggedItemIndex.current === dragOverItemIndex.current
    ) {
      return
    }
    const newOrder = [...layout.order]
    const [draggedItem] = newOrder.splice(draggedItemIndex.current, 1)
    newOrder.splice(dragOverItemIndex.current, 0, draggedItem)
    setLayout({ ...layout, order: newOrder })
  }

  const handleDragEnd = () => {
    draggedItemIndex.current = null
    dragOverItemIndex.current = null
    setDragOverVisualIndex(null)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const getRoleDisplay = () => {
    switch (profile.role) {
      case 'student': return 'Estudante'
      case 'teacher': return 'Professor'
      case 'admin': return 'Administrador'
      default: return 'Usuário'
    }
  }

  return (
    <>
      <CustomizationPanel
        isOpen={isCustomizing}
        onOpenChange={setIsCustomizing}
        visibleWidgets={layout.order}
        onVisibilityChange={handleVisibilityChange}
        onSave={handleSave}
        onReset={handleReset}
        userRole={profile.role}
      />
      
      <MagicLayout
        title={`${getGreeting()}, ${profile.first_name}!`}
        description={`Bem-vindo ao seu dashboard como ${getRoleDisplay().toLowerCase()}. Gerencie seu aprendizado e acompanhe seu progresso.`}
      >
        <div className="space-y-8">
          {/* Welcome Section */}
          <MagicCard className="p-6" glow>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gradient">
                  {getGreeting()}, {profile.first_name}!
                </h2>
                <p className="text-muted-foreground">
                  Aqui está um resumo da sua jornada de aprendizado hoje.
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCustomizing(true)}
                  className="group transition-all duration-300 hover:bg-primary/5"
                >
                  <Layout className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-3" />
                  Personalizar
                </Button>
              </div>
            </div>
          </MagicCard>

          {/* Dashboard Widgets */}
          <div className="space-y-6">
            {layout.order
              .filter((id) => AVAILABLE_WIDGETS[profile.role].includes(id))
              .map((widgetId, index) => (
                <div
                  key={widgetId}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className={cn(
                    'group cursor-move transition-all duration-300 rounded-2xl',
                    'hover:shadow-lg hover:shadow-primary/10',
                    dragOverVisualIndex === index && 'bg-primary/5 border-2 border-dashed border-primary/30',
                    'relative'
                  )}
                >
                  {/* Drag Handle */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-2 shadow-lg">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <WidgetRenderer widgetId={widgetId} />
                </div>
              ))}
          </div>
        </div>
      </MagicLayout>
    </>
  )
}
