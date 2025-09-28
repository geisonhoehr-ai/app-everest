import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Search, Play, Clock, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStaggeredAnimation } from '@/hooks/useAnimations'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { cn } from '@/lib/utils'

const allCourses = [
  {
    id: 'matematica-para-concursos',
    title: 'Matemática para Concursos',
    category: 'Exatas',
    progress: 75,
    image: 'https://img.usecurling.com/p/400/200?q=mathematics%20abstract',
  },
  {
    id: 'redacao-nota-mil',
    title: 'Redação Nota Mil',
    category: 'Linguagens',
    progress: 40,
    image: 'https://img.usecurling.com/p/400/200?q=writing%20on%20paper',
  },
  {
    id: 'historia-do-brasil',
    title: 'História do Brasil',
    category: 'Humanas',
    progress: 90,
    image: 'https://img.usecurling.com/p/400/200?q=brazil%20colonial%20history',
  },
  {
    id: 'fisica-moderna',
    title: 'Física Moderna',
    category: 'Exatas',
    progress: 25,
    image: 'https://img.usecurling.com/p/400/200?q=physics%20quantum',
  },
  {
    id: 'literatura-brasileira',
    title: 'Literatura Brasileira',
    category: 'Linguagens',
    progress: 60,
    image:
      'https://img.usecurling.com/p/400/200?q=brazilian%20literature%20books',
  },
  {
    id: 'geografia-mundial',
    title: 'Geografia Mundial',
    category: 'Humanas',
    progress: 10,
    image: 'https://img.usecurling.com/p/400/200?q=world%20map',
  },
]

export default function CoursesPage() {
  const delays = useStaggeredAnimation(allCourses.length, 100)

  return (
    <MagicLayout
      title="Meus Cursos"
      description="Todos os seus cursos em um só lugar. Continue sua jornada de aprendizado!"
    >
      <div className="space-y-8">
        {/* Search Bar */}
        <MagicCard className="p-6" glow>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar em meus cursos..."
                className="pl-10 bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-300"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                Recentes
              </Button>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Populares
              </Button>
            </div>
          </div>
        </MagicCard>

        {/* Courses Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allCourses.map((course, index) => (
            <Link
              key={course.title}
              to={`/meus-cursos/${course.id}`}
              className="group block"
            >
              <MagicCard
                className="h-full min-h-[400px] flex flex-col"
                glow
                gradient
                style={{ animationDelay: `${delays[index].delay}ms` }}
              >
                <div className="relative overflow-hidden rounded-xl mb-6">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-48 object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary/90 backdrop-blur-sm text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                      {course.category}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <Button size="sm" className="bg-white/90 backdrop-blur-sm text-foreground hover:bg-white">
                      <Play className="h-4 w-4 mr-2" />
                      Assistir
                    </Button>
                  </div>
                </div>
                
                <div className="flex-grow flex flex-col">
                  <h3 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors duration-300">
                    {course.title}
                  </h3>
                  
                  <div className="space-y-4 flex-grow">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-semibold text-primary">{course.progress}%</span>
                      </div>
                      <div className="relative">
                        <Progress 
                          value={course.progress} 
                          className="h-2 bg-muted/50"
                          indicatorClassName="bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border/50">
                    <Button
                      className="w-full group-hover:bg-primary/90 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300"
                    >
                      Continuar Curso
                    </Button>
                  </div>
                </div>
              </MagicCard>
            </Link>
          ))}
        </div>
      </div>
    </MagicLayout>
  )
}
