import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  getUserSettings,
  saveDashboardLayout,
} from '@/services/userSettingsService'
import { courseService } from '@/services/courseService'
import { DEFAULT_LAYOUTS, AVAILABLE_WIDGETS, WIDGETS } from '@/lib/dashboard-config'
import { WidgetRenderer } from '@/components/dashboard/WidgetRenderer'
import { CustomizationPanel } from '@/components/dashboard/CustomizationPanel'
import { DashboardTutorial } from '@/components/dashboard/DashboardTutorial'
import { Button } from '@/components/ui/button'
import { Settings, Layout, GripVertical, Star, BookOpen, Brain, Clock, TrendingUp, CheckCircle, Award, Users, Zap, HelpCircle } from 'lucide-react'
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
  const [showTutorial, setShowTutorial] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)

  // Check if tutorial should be shown on first visit
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('dashboard_tutorial_seen')
    if (!hasSeenTutorial) {
      setShowTutorial(true)
    }
  }, [])

  const handleCloseTutorial = () => {
    setShowTutorial(false)
    localStorage.setItem('dashboard_tutorial_seen', 'true')
  }

  const [stats, setStats] = useState({
    activeCourses: 0,
    averageProgress: 0,
    completedLessons: 0,
    studyTime: 0
  })

  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const updateStreak = () => {
      const stored = localStorage.getItem('everest_streak')
      const today = new Date()
      const todayStr = today.toDateString()

      let currentStreak = 1
      let lastDateStr = ''

      if (stored) {
        try {
          const data = JSON.parse(stored)
          currentStreak = data.count || 0
          lastDateStr = data.lastDate || ''
        } catch (e) {
          console.error('Error parsing streak', e)
        }
      }

      if (lastDateStr === todayStr) {
        setStreak(currentStreak)
        return
      }

      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toDateString()

      if (lastDateStr === yesterdayStr) {
        currentStreak += 1
      } else {
        currentStreak = 1
      }

      setStreak(currentStreak)
      localStorage.setItem('everest_streak', JSON.stringify({ count: currentStreak, lastDate: todayStr }))
    }

    updateStreak()
  }, [])

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        console.log('🔄 Iniciando carga do dashboard...');
        const userId = user?.id;
        if (!userId) {
          console.warn('⚠️ Usuário não identificado no loadDashboard');
          return;
        }

        const [settings, trailsData] = await Promise.all([
          getUserSettings(userId),
          courseService.getUserCoursesByTrail(userId)
        ]);

        console.log('✅ Dados carregados:', { settings: !!settings, trailsCount: trailsData?.length });

        // Settings logic - Safe Fallback
        const userRole = profile?.role || 'student';
        if (settings?.dashboard_layout) {
          setWidgets(settings.dashboard_layout as string[]);
        } else {
          const defaultLayout = DEFAULT_LAYOUTS[userRole] || DEFAULT_LAYOUTS.student;
          setWidgets(defaultLayout.order || []);
        }

        // Safe array check
        const trails = Array.isArray(trailsData) ? trailsData : [];
        const allCourses = trails.flatMap(t => Array.isArray(t.courses) ? t.courses : []);
        const activeCoursesCount = allCourses.length;

        let totalProgressSum = 0;
        let totalLessonsCompleted = 0;
        let totalStudyHours = 0;

        allCourses.forEach(course => {
          if (course) {
            totalProgressSum += (course.progress || 0);
            totalLessonsCompleted += Math.round(((course.lessons_count || 0) * (course.progress || 0)) / 100);
            totalStudyHours += ((course.total_hours || 0) * ((course.progress || 0) / 100));
          }
        });

        const averageProgress = activeCoursesCount > 0 ? Math.round(totalProgressSum / activeCoursesCount) : 0;

        setStats({
          activeCourses: activeCoursesCount,
          averageProgress: isNaN(averageProgress) ? 0 : averageProgress,
          completedLessons: isNaN(totalLessonsCompleted) ? 0 : totalLessonsCompleted,
          studyTime: isNaN(totalStudyHours) ? 0 : Math.round(totalStudyHours)
        });

      } catch (error) {
        console.error('❌ Erro crítico ao carregar dashboard:', error);
        const userRole = profile?.role || 'student';
        const defaultLayout = DEFAULT_LAYOUTS[userRole] || DEFAULT_LAYOUTS.student;
        setWidgets(defaultLayout.order || []);

        toast({
          title: "Erro ao carregar dados",
          description: "Ocorreu um problema ao carregar seu progresso. Usando layout padrão.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadDashboard();
    } else {
      // Se não tem user, libera o loading com layout padrão
      console.warn('⚠️ Dashboard carregado sem usuário autenticado');
      const userRole = profile?.role || 'student';
      const defaultLayout = DEFAULT_LAYOUTS[userRole] || DEFAULT_LAYOUTS.student;
      setWidgets(defaultLayout.order || []);
      setIsLoading(false);
    }
  }, [user?.id, profile?.role])


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

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(widgets.filter(id => id !== widgetId))
  }

  const handleResetLayout = () => {
    const defaultLayout = DEFAULT_LAYOUTS[profile?.role || 'student'] || DEFAULT_LAYOUTS.student
    setWidgets(defaultLayout.order)
  }

  const handleVisibilityChange = (widgetId: string, isVisible: boolean) => {
    if (isVisible) {
      if (!widgets.includes(widgetId)) {
        setWidgets([...widgets, widgetId])
      }
    } else {
      setWidgets(widgets.filter(id => id !== widgetId))
    }
  }

  const delays = useStaggeredAnimation(widgets.length, 100)

  if (isLoading) {
    return <SectionLoader />
  }

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
              <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto mt-4 md:mt-0">
                <Button
                  variant="outline"
                  onClick={() => setShowTutorial(true)}
                  className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 text-xs md:text-sm"
                  title="Ver tutorial"
                >
                  <HelpCircle className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden md:inline ml-2">Ajuda</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCustomizing(!isCustomizing)}
                  className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 text-xs md:text-sm"
                >
                  <Layout className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Personalizar</span>
                  <span className="sm:hidden">Config</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleSaveLayout}
                  className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 text-xs md:text-sm"
                >
                  <Settings className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Salvar
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-blue-600">{stats.activeCourses}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Cursos Ativos</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-green-600">{stats.averageProgress}%</div>
                <div className="text-xs md:text-sm text-muted-foreground">Progresso Médio</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-purple-600">{stats.completedLessons}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Aulas Concluídas</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-orange-600">{stats.studyTime}h</div>
                <div className="text-xs md:text-sm text-muted-foreground">Tempo de Estudo</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20">
                <Zap className="h-5 w-5 md:h-6 md:w-6 text-yellow-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-yellow-600">{streak}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Dias em Sequência</div>
              </div>
            </div>
          </div>
        </MagicCard>

        {/* Customization Panel (Sheet) */}
        <CustomizationPanel
          isOpen={isCustomizing}
          onOpenChange={setIsCustomizing}
          visibleWidgets={widgets}
          onVisibilityChange={handleVisibilityChange}
          onSave={() => {
            handleSaveLayout()
            setIsCustomizing(false)
          }}
          onReset={handleResetLayout}
          userRole={profile?.role || 'student'}
        />

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
                        {widget.icon && <widget.icon className="h-6 w-6 text-primary" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{widget.name}</h3>
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

      {/* Tutorial */}
      {showTutorial && <DashboardTutorial onClose={handleCloseTutorial} />}
    </MagicLayout>
  )
}