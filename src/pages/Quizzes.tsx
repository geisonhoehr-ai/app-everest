import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { quizData } from '@/lib/data'
import { useStaggeredAnimation } from '@/hooks/useAnimations'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { cn } from '@/lib/utils'
import { Play, Target, Clock, TrendingUp } from 'lucide-react'

export default function QuizzesPage() {
  const delays = useStaggeredAnimation(quizData.length, 100)

  return (
    <MagicLayout
      title="Quizzes"
      description="Teste seus conhecimentos com nossos quizzes interativos e acompanhe seu progresso."
    >
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          <MagicCard className="p-4 text-center" glow={false} gradient={false}>
            <div className="space-y-2">
              <div className="mx-auto w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">24</div>
              <div className="text-xs text-muted-foreground">Quizzes Disponíveis</div>
            </div>
          </MagicCard>
          
          <MagicCard className="p-4 text-center" glow={false} gradient={false}>
            <div className="space-y-2">
              <div className="mx-auto w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div className="text-2xl font-bold text-foreground">87%</div>
              <div className="text-xs text-muted-foreground">Taxa de Acerto</div>
            </div>
          </MagicCard>
          
          <MagicCard className="p-4 text-center" glow={false} gradient={false}>
            <div className="space-y-2">
              <div className="mx-auto w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div className="text-2xl font-bold text-foreground">12</div>
              <div className="text-xs text-muted-foreground">Minutos Médio</div>
            </div>
          </MagicCard>
          
          <MagicCard className="p-4 text-center" glow={false} gradient={false}>
            <div className="space-y-2">
              <div className="mx-auto w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Play className="h-5 w-5 text-warning" />
              </div>
              <div className="text-2xl font-bold text-foreground">156</div>
              <div className="text-xs text-muted-foreground">Quizzes Realizados</div>
            </div>
          </MagicCard>
        </div>

        {/* Quizzes Grid */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary-600 to-primary-700 bg-clip-text text-transparent cyber-glow">
              Quizzes Disponíveis
            </h2>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {quizData.length} quizzes
            </Badge>
          </div>
          
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quizData.map((subject, index) => {
              const difficulty = ['Fácil', 'Médio', 'Difícil'][Math.floor(Math.random() * 3)]
              const questions = Math.floor(Math.random() * 20) + 10
              const timeLimit = Math.floor(Math.random() * 15) + 5
              
              return (
                <Link 
                  to={`/quizzes/${subject.id}`} 
                  key={subject.id}
                  className="group block"
                >
                  <MagicCard
                    className="h-full flex flex-col overflow-hidden"
                    glow={false}
                    gradient={false}
                    led
                    ledColor={index % 4 === 0 ? 'cyan' : index % 4 === 1 ? 'purple' : index % 4 === 2 ? 'orange' : 'green'}
                    style={{ animationDelay: `${delays[index].delay}ms` }}
                  >
                    {/* Header compacto */}
                    <div className="relative h-40 sm:h-44 overflow-hidden">
                <img
                  src={subject.image}
                  alt={subject.name}
                        className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                      />
                      
                      {/* Overlay simples */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      {/* Badge de Dificuldade */}
                      <div className="absolute top-3 left-3">
                        <div className={cn(
                          "text-white px-2 py-1 rounded-md text-xs font-medium shadow-sm",
                          difficulty === 'Fácil' && "bg-success",
                          difficulty === 'Médio' && "bg-warning",
                          difficulty === 'Difícil' && "bg-destructive"
                        )}>
                          {difficulty}
                        </div>
                      </div>
                      
                      {/* Badge Quiz */}
                      <div className="absolute top-3 right-3">
                        <div className="bg-primary text-white px-2 py-1 rounded-md text-xs font-medium shadow-sm">
                          Quiz
                        </div>
                      </div>
                      
                      {/* Título */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white text-lg font-bold drop-shadow-sm">
                    {subject.name}
                  </h3>
                        <p className="text-white/80 text-xs line-clamp-1">
                    {subject.description}
                  </p>
                </div>
                    </div>
                    
                    {/* Conteúdo compacto */}
                    <div className="flex-grow flex flex-col p-4">
                      <div className="space-y-3">
                        {/* Stats simples */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-info" />
                              <span className="text-muted-foreground">{questions} questões</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-warning" />
                              <span className="text-muted-foreground">{timeLimit} min</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Dificuldade simples */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Dificuldade</span>
                            <span className={cn(
                              "font-medium",
                              difficulty === 'Fácil' && "text-success",
                              difficulty === 'Médio' && "text-warning",
                              difficulty === 'Difícil' && "text-destructive"
                            )}>
                              {difficulty}
                            </span>
                          </div>
                          <div className="w-full bg-muted/30 rounded-full h-1.5">
                            <div 
                              className={cn(
                                "h-1.5 rounded-full transition-all duration-300",
                                difficulty === 'Fácil' && "bg-success w-1/3",
                                difficulty === 'Médio' && "bg-warning w-2/3",
                                difficulty === 'Difícil' && "bg-destructive w-full"
                              )}
                            />
                          </div>
                        </div>
                        
                        {/* Botão simples */}
                        <button className="w-full bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg hover:bg-primary/90 transition-colors duration-200 text-sm">
                          <div className="flex items-center justify-center gap-2">
                            <Play className="h-4 w-4" />
                            Iniciar Quiz
                          </div>
                        </button>
                      </div>
                    </div>
                  </MagicCard>
            </Link>
              )
            })}
          </div>
        </div>
    </div>
    </MagicLayout>
  )
}
