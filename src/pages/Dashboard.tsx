import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  getUserSettings,
  saveDashboardLayout,
} from '@/services/userSettingsService'
import { DEFAULT_LAYOUTS, AVAILABLE_WIDGETS, WIDGETS } from '@/lib/dashboard-config'
import { WidgetRenderer } from '@/components/dashboard/WidgetRenderer'
import { CustomizationPanel } from '@/components/dashboard/CustomizationPanel'
import { Button } from '@/components/ui/button'
import { Settings, Layout, GripVertical, Star, BookOpen, Brain, Clock, TrendingUp, CheckCircle, Award, Users, Zap } from 'lucide-react'
import { SectionLoader } from '@/components/SectionLoader'
import { useToast } from '@/components/ui/use-toast'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { cn } from '@/lib/utils'
import { useStaggeredAnimation } from '@/hooks/useAnimations'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [widgets, setWidgets] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const [dragOverWidget, setDragOverWidget] = useState<string | null>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const settings = await getUserSettings(user?.id || '')
        if (settings?.dashboard_layout) {
          setWidgets(settings.dashboard_layout as string[])
        } else {
          // Use default layout based on user role
          const defaultLayout = DEFAULT_LAYOUTS[profile?.role || 'student'] || DEFAULT_LAYOUTS.student
          setWidgets(defaultLayout.order)
        }
      } catch (error) {
        console.error('Error loading dashboard:', error)
        // Fallback to default layout
        const defaultLayout = DEFAULT_LAYOUTS[profile?.role || 'student'] || DEFAULT_LAYOUTS.student
        setWidgets(defaultLayout.order)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadDashboard()
    }
  }, [user, profile?.role])

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setIsDragging(true)
    setDraggedWidget(widgetId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, widgetId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverWidget(widgetId)
  }

  const handleDragLeave = () => {
    setDragOverWidget(null)
  }

  const handleDrop = (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault()
    
    if (!draggedWidget || draggedWidget === targetWidgetId) {
      setIsDragging(false)
      setDraggedWidget(null)
      setDragOverWidget(null)
      return
    }

    const draggedIndex = widgets.indexOf(draggedWidget)
    const targetIndex = widgets.indexOf(targetWidgetId)
    
    if (draggedIndex === -1 || targetIndex === -1) return

    const newWidgets = [...widgets]
    newWidgets.splice(draggedIndex, 1)
    newWidgets.splice(targetIndex, 0, draggedWidget)
    
    setWidgets(newWidgets)
    setIsDragging(false)
    setDraggedWidget(null)
    setDragOverWidget(null)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setDraggedWidget(null)
    setDragOverWidget(null)
  }

  const handleSaveLayout = async () => {
    try {
      await saveDashboardLayout(user?.id || '', widgets)
      toast({
        title: "Layout salvo",
        description: "Suas preferências de dashboard foram salvas com sucesso.",
      })
    } catch (error) {
      console.error('Error saving layout:', error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o layout. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleResetLayout = () => {
    const defaultLayout = DEFAULT_LAYOUTS[profile?.role || 'student'] || DEFAULT_LAYOUTS.student
    setWidgets(defaultLayout.order)
  }

  const handleAddWidget = (widgetId: string) => {
    if (!widgets.includes(widgetId)) {
      setWidgets([...widgets, widgetId])
    }
  }

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(widgets.filter(id => id !== widgetId))
  }

  if (isLoading) {
    return <SectionLoader />
  }

  const delays = useStaggeredAnimation(widgets.length, 100)

  return (
    <MagicLayout 
      title={`Olá, ${profile?.first_name || 'Usuário'}!`}
      description="Bem-vindo ao seu dashboard personalizado. Acompanhe seu progresso e continue aprendendo."
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Stats */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Star className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Dashboard Inteligente
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
                    Acompanhe seu progresso e continue aprendendo
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setIsCustomizing(!isCustomizing)}
                  className="flex-1 md:flex-none bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 text-xs md:text-sm"
                >
                  <Layout className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Personalizar</span>
                  <span className="sm:hidden">Config</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleSaveLayout}
                  className="flex-1 md:flex-none bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 text-xs md:text-sm"
                >
                  <Settings className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Salvar
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-blue-600">12</div>
                <div className="text-xs md:text-sm text-muted-foreground">Cursos Ativos</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-green-600">78%</div>
                <div className="text-xs md:text-sm text-muted-foreground">Progresso Médio</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-purple-600">24</div>
                <div className="text-xs md:text-sm text-muted-foreground">Aulas Concluídas</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-orange-600">48h</div>
                <div className="text-xs md:text-sm text-muted-foreground">Tempo de Estudo</div>
              </div>
            </div>
          </div>
        </MagicCard>

        {/* Customization Panel */}
        {isCustomizing && (
          <MagicCard variant="glass" size="lg">
            <CustomizationPanel
              availableWidgets={AVAILABLE_WIDGETS}
              currentWidgets={widgets}
              onAddWidget={handleAddWidget}
              onRemoveWidget={handleRemoveWidget}
              onResetLayout={handleResetLayout}
              onClose={() => setIsCustomizing(false)}
            />
          </MagicCard>
        )}

        {/* Widgets Grid */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {widgets.map((widgetId, index) => {
            const widget = WIDGETS[widgetId]
            if (!widget) return null

            return (
              <MagicCard
                key={widgetId}
                variant="glass"
                size="lg"
                className={cn(
                  "transition-all duration-300",
                  isDragging && draggedWidget === widgetId && "opacity-50 scale-95",
                  isDragging && dragOverWidget === widgetId && "ring-2 ring-primary/50",
                  "hover:scale-105"
                )}
                style={{ animationDelay: `${delays[index]}ms` }}
                draggable={isCustomizing}
                onDragStart={(e) => handleDragStart(e, widgetId)}
                onDragOver={(e) => handleDragOver(e, widgetId)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, widgetId)}
                onDragEnd={handleDragEnd}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                        {widget.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{widget.title}</h3>
                        <p className="text-sm text-muted-foreground">{widget.description}</p>
                      </div>
                    </div>
                    {isCustomizing && (
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveWidget(widgetId)}
                          className="text-destructive hover:text-destructive"
                        >
                          ×
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="min-h-[200px]">
                    <WidgetRenderer widgetId={widgetId} />
                  </div>
                </div>
              </MagicCard>
            )
          })}
        </div>

        {/* Empty State */}
        {widgets.length === 0 && (
          <MagicCard variant="glass" size="lg" className="text-center py-24">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Layout className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Dashboard vazio
              </h3>
              <p className="text-muted-foreground mb-8">
                Personalize seu dashboard adicionando widgets úteis para acompanhar seu progresso.
              </p>
              <Button 
                onClick={() => setIsCustomizing(true)}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-8 py-3 rounded-2xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <Layout className="mr-2 h-4 w-4" />
                Personalizar Dashboard
              </Button>
            </div>
          </MagicCard>
        )}
      </div>
    </MagicLayout>
  )
}