import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Search, Play, Clock, Users, Star, BookOpen, Brain, ArrowRight, Award, TrendingUp, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStaggeredAnimation } from '@/hooks/useAnimations'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const allCourses = [
  {
    id: 'matematica-para-concursos',
    title: 'Matemática para Concursos',
    category: 'Exatas',
    progress: 75,
    image: 'https://img.usecurling.com/p/400/200?q=mathematics%20abstract',
    description: 'Domine a matemática essencial para concursos públicos com aulas claras e exercícios práticos.',
    lessons: 45,
    students: 1200,
  },
  {
    id: 'redacao-nota-mil',
    title: 'Redação Nota Mil',
    category: 'Linguagens',
    progress: 40,
    image: 'https://img.usecurling.com/p/400/200?q=writing%20on%20paper',
    description: 'Aprenda as técnicas para escrever redações impecáveis e alcançar a nota máxima em qualquer prova.',
    lessons: 30,
    students: 850,
  },
  {
    id: 'historia-do-brasil',
    title: 'História do Brasil',
    category: 'Humanas',
    progress: 90,
    image: 'https://img.usecurling.com/p/400/200?q=brazil%20colonial%20history',
    description: 'Uma jornada completa pela história do Brasil, desde o período colonial até os dias atuais.',
    lessons: 60,
    students: 1500,
  },
  {
    id: 'fisica-moderna',
    title: 'Física Moderna',
    category: 'Exatas',
    progress: 25,
    image: 'https://img.usecurling.com/p/400/200?q=physics%20quantum',
    description: 'Explore os conceitos fascinantes da física moderna, incluindo relatividade e mecânica quântica.',
    lessons: 35,
    students: 700,
  },
  {
    id: 'literatura-brasileira',
    title: 'Literatura Brasileira',
    category: 'Linguagens',
    progress: 60,
    image:
      'https://img.usecurling.com/p/400/200?q=brazilian%20literature%20books',
    description: 'Descubra os grandes autores e movimentos da literatura brasileira, com análises aprofundadas.',
    lessons: 50,
    students: 1100,
  },
  {
    id: 'geografia-mundial',
    title: 'Geografia Mundial',
    category: 'Humanas',
    progress: 10,
    image: 'https://img.usecurling.com/p/400/200?q=world%20map',
    description: 'Entenda a dinâmica global com um estudo aprofundado da geografia física e humana mundial.',
    lessons: 40,
    students: 950,
  },
]

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('Todos')

  const filteredCourses = allCourses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterCategory === 'Todos' || course.category === filterCategory)
  )

  const categories = ['Todos', ...Array.from(new Set(allCourses.map(course => course.category)))]

  const delays = useStaggeredAnimation(filteredCourses.length, 100)

  const totalActiveCourses = filteredCourses.length
  const totalLessonsCompleted = filteredCourses.reduce((sum, course) => sum + Math.round(course.lessons * (course.progress / 100)), 0)
  const totalStudents = filteredCourses.reduce((sum, course) => sum + course.students, 0)
  const averageProgress = filteredCourses.length > 0
    ? filteredCourses.reduce((sum, course) => sum + course.progress, 0) / filteredCourses.length
    : 0

  return (
    <MagicLayout 
      title="Cursos"
      description="Aprenda com os melhores professores e domine qualquer assunto com nossos cursos especializados"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Stats */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Plataforma de Cursos
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Aprenda com os melhores professores e domine qualquer assunto
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Ensino Inteligente</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <BookOpen className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{totalActiveCourses}</div>
                <div className="text-sm text-muted-foreground">Cursos Ativos</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <Play className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{totalLessonsCompleted}</div>
                <div className="text-sm text-muted-foreground">Aulas Concluídas</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <Users className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{totalStudents.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Estudantes</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <TrendingUp className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">{Math.round(averageProgress)}%</div>
                <div className="text-sm text-muted-foreground">Progresso Médio</div>
              </div>
            </div>
          </div>
        </MagicCard>

        {/* Search and Filter */}
        <MagicCard variant="glass" size="lg">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar cursos..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-card/50 backdrop-blur-sm border-border/50"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={filterCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterCategory(category)}
                  className={cn(
                    "transition-all duration-300",
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

        {filteredCourses.length === 0 ? (
          <MagicCard variant="glass" size="lg" className="text-center py-24">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Nenhum curso encontrado
              </h3>
              <p className="text-muted-foreground mb-8">
                Tente ajustar os filtros ou termo de busca para encontrar o que procura.
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('')
                  setFilterCategory('Todos')
                }}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-8 py-3 rounded-2xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Limpar Filtros
              </Button>
            </div>
          </MagicCard>
        ) : (
          <div className="space-y-8">
            {/* Category Header */}
            <MagicCard variant="glass" size="lg">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Cursos Disponíveis</h2>
                  <p className="text-muted-foreground">
                    {filteredCourses.length} cursos encontrados
                  </p>
                </div>
              </div>
            </MagicCard>

            {/* Courses Grid */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course, index) => (
                <Link
                  to={`/courses/${course.id}`}
                  key={course.id}
                  className="group block"
                >
                  <MagicCard
                    variant="premium"
                    size="lg"
                    className="h-[480px] flex flex-col overflow-hidden transition-all duration-500 ease-out hover:scale-105 hover:shadow-2xl"
                    style={{ animationDelay: `${delays[index]}ms` }}
                  >
                    {/* Image Header */}
                    <div className="relative h-48 overflow-hidden rounded-t-2xl">
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Progress Badge */}
                      <div className="absolute top-4 right-4">
                        <div className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-white/20">
                          <span className="text-sm font-semibold text-gray-900">{course.progress}%</span>
                        </div>
                      </div>

                      {/* Category Badge */}
                      <div className="absolute top-4 left-4">
                        <div className="px-3 py-1.5 rounded-full bg-primary/90 backdrop-blur-sm border border-primary/20">
                          <span className="text-sm font-semibold text-white">{course.category}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white text-xl font-bold mb-1 drop-shadow-lg">
                          {course.title}
                        </h3>
                        <p className="text-white/80 text-sm line-clamp-2">
                          {course.description}
                        </p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col p-6">
                      <div className="flex-1 flex flex-col space-y-4">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-blue-500 flex items-center justify-center">
                              <Play className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              {course.lessons}
                            </div>
                            <div className="text-xs text-muted-foreground">Aulas</div>
                          </div>
                          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-green-500 flex items-center justify-center">
                              <Users className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-lg font-bold text-green-600">
                              {course.students.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">Estudantes</div>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground font-medium">Progresso</span>
                            <span className="text-sm font-bold text-primary">{course.progress}%</span>
                          </div>
                          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-6">
                        <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white transition-all duration-300 ease-out py-3 text-sm font-semibold rounded-xl group-hover:scale-105">
                          <div className="flex items-center justify-center gap-2">
                            <Play className="w-4 h-4" />
                            Continuar Curso
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </Button>
                      </div>
                    </div>
                  </MagicCard>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </MagicLayout>
  )
}