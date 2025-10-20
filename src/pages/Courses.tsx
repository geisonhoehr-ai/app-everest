import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Search, Play, Clock, Users, Star, BookOpen, Brain, ArrowRight, Award, TrendingUp, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStaggeredAnimation } from '@/hooks/useAnimations'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { courseService, CourseTrail } from '@/services/courseService'
import { useAuth } from '@/hooks/use-auth'
import { SectionLoader } from '@/components/SectionLoader'
import { CourseTrailCard } from '@/components/courses/CourseTrailCard'

export default function CoursesPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('Todos')
  const [courseTrails, setCourseTrails] = useState<CourseTrail[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        if (!user?.id) return

        const trails = await courseService.getUserCoursesByTrail(user.id)
        setCourseTrails(trails)
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [user?.id])

  // Filter trails by search term and category
  const filteredTrails = courseTrails.map(trail => ({
    ...trail,
    courses: trail.courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterCategory === 'Todos' || course.category === filterCategory)
    )
  })).filter(trail => trail.courses.length > 0)

  const categories = ['Todos', ...Array.from(new Set(courseTrails.flatMap(t => t.courses.map(c => c.category || 'Geral'))))]

  const delays = useStaggeredAnimation(filteredTrails.length, 100)

  // Calculate overall stats from all trails
  const totalActiveCourses = filteredTrails.reduce((sum, trail) => sum + trail.courses.length, 0)
  const totalLessonsCompleted = filteredTrails.reduce((sum, trail) => sum + trail.completedLessons, 0)
  const totalLessons = filteredTrails.reduce((sum, trail) => sum + trail.totalLessons, 0)
  const averageProgress = filteredTrails.length > 0
    ? filteredTrails.reduce((sum, trail) => sum + trail.averageProgress, 0) / filteredTrails.length
    : 0


  if (isLoading) {
    return <SectionLoader />
  }

  return (
    <MagicLayout 
      title="Meus Cursos"
      description="Aprenda com os melhores professores e domine qualquer assunto com nossos cursos especializados"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Stats */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Plataforma de Cursos
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
                    Aprenda com os melhores professores e domine qualquer assunto
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <Star className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                <span className="text-xs md:text-sm font-medium">Ensino Inteligente</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-blue-600">{totalActiveCourses}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Cursos Ativos</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <Play className="h-5 w-5 md:h-6 md:w-6 text-green-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-green-600">{totalLessonsCompleted}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Aulas Concluídas</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-purple-600">{totalLessons}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Total Aulas</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-orange-600">{Math.round(averageProgress)}%</div>
                <div className="text-xs md:text-sm text-muted-foreground">Progresso Médio</div>
              </div>
            </div>
          </div>
        </MagicCard>

        {/* Search and Filter */}
        <MagicCard variant="glass" size="lg">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar cursos..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-card/50 backdrop-blur-sm border-border/50"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={filterCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterCategory(category)}
                  className={cn(
                    "transition-all duration-300 whitespace-nowrap flex-shrink-0",
                    filterCategory === category 
                      ? "bg-gradient-to-r from-primary to-primary/80 text-white" 
                      : "bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80"
                  )}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </MagicCard>

        {/* Course Trails */}
        {filteredTrails.length === 0 ? (
          <MagicCard variant="glass" size="lg" className="text-center py-24">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Nenhum curso encontrado
              </h3>
              <p className="text-muted-foreground mb-8">
                {searchTerm || filterCategory !== 'Todos' 
                  ? 'Tente ajustar seus filtros de busca' 
                  : 'Você ainda não tem acesso a nenhum curso. Entre em contato com seu professor.'
                }
              </p>
              {(searchTerm || filterCategory !== 'Todos') && (
                <Button 
                  onClick={() => {
                    setSearchTerm('')
                    setFilterCategory('Todos')
                  }}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-8 py-3 rounded-2xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          </MagicCard>
        ) : (
          <div className="space-y-8">
            {/* Header */}
            <MagicCard variant="glass" size="lg">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Cursos por Trilha</h2>
                  <p className="text-muted-foreground">
                    {filteredTrails.length} trilha{filteredTrails.length !== 1 ? 's' : ''} disponível{filteredTrails.length !== 1 ? 'eis' : ''}
                  </p>
                </div>
              </div>
            </MagicCard>

            {/* Course Trails */}
            <div className="space-y-6">
              {filteredTrails.map((trail, index) => (
                <div
                  key={trail.trailName}
                  style={{ animationDelay: `${delays[index]}ms` }}
                  className="animate-fade-in"
                >
                  <CourseTrailCard
                    trailName={trail.trailName}
                    totalCourses={trail.totalCourses}
                    totalLessons={trail.totalLessons}
                    completedLessons={trail.completedLessons}
                    averageProgress={trail.averageProgress}
                    completedCourses={trail.completedCourses}
                    courses={trail.courses.map(course => ({
                      id: course.id,
                      title: course.title,
                      progress: course.progress,
                      modules_count: course.modules_count,
                      lessons_count: course.lessons_count,
                      total_hours: course.total_hours
                    }))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MagicLayout>
  )
}