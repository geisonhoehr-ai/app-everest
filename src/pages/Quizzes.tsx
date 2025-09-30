import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useStaggeredAnimation } from '@/hooks/useAnimations'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { cn } from '@/lib/utils'
import { Play, Target, Clock, TrendingUp, ArrowRight, BookOpen, Brain, Star, Award, Users, Zap } from 'lucide-react'
import { quizService, type QuizSubject } from '@/services/quizService'
import { SectionLoader } from '@/components/SectionLoader'

export default function QuizzesPage() {
  const [subjects, setSubjects] = useState<QuizSubject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    quizService.getQuizSubjects()
      .then(setSubjects)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const totalTopicsAvailable = subjects.reduce((total, subject) => total + subject.topics.length, 0)
  const totalQuestionsAvailable = subjects.reduce((total, subject) =>
    total + subject.topics.reduce((topicTotal, topic) =>
      topicTotal + topic.questionCount, 0), 0)
  const totalQuizzesAvailable = subjects.reduce((total, subject) =>
    total + subject.topics.reduce((topicTotal, topic) =>
      topicTotal + topic.quizzes.length, 0), 0)

  const delays = useStaggeredAnimation(subjects.length, 100)

  if (isLoading) {
    return <SectionLoader />
  }

  return (
    <MagicLayout 
      title="Quizzes"
      description="Teste seus conhecimentos com nossos quizzes interativos e acompanhe seu progresso"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Stats */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Sistema de Quizzes
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Teste seus conhecimentos com nossos quizzes interativos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Sistema Inteligente</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <Target className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{totalTopicsAvailable}</div>
                <div className="text-sm text-muted-foreground">Tópicos</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <Brain className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{totalQuestionsAvailable}</div>
                <div className="text-sm text-muted-foreground">Questões</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <BookOpen className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{subjects.length}</div>
                <div className="text-sm text-muted-foreground">Matérias</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <Zap className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">{totalQuizzesAvailable}</div>
                <div className="text-sm text-muted-foreground">Quizzes</div>
              </div>
            </div>
          </div>
        </MagicCard>

        {subjects.length === 0 ? (
          <MagicCard variant="glass" size="lg" className="text-center py-24">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Target className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Nenhuma matéria de Quiz encontrada
              </h3>
              <p className="text-muted-foreground mb-8">
                Parece que não há quizzes disponíveis no momento. Que tal criar um novo?
              </p>
              <Button 
                onClick={() => console.log('Criar novo quiz')} 
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-8 py-3 rounded-2xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Criar Primeiro Quiz
              </Button>
            </div>
          </MagicCard>
        ) : (
          <div className="space-y-8">
            {/* Category Header */}
            <MagicCard variant="glass" size="lg">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Matérias de Quizzes</h2>
                  <p className="text-muted-foreground">
                    {subjects.length} matérias disponíveis
                  </p>
                </div>
              </div>
            </MagicCard>

            {/* Quizzes Grid */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {subjects.map((subject, index) => {
                const totalQuestions = subject.topics.reduce((sum, topic) => sum + topic.questionCount, 0)
                const totalQuizzes = subject.topics.reduce((sum, topic) => sum + topic.quizzes.length, 0)
                const progress = Math.min(100, (totalQuestions / 5) + Math.random() * 20)

                return (
                  <Link
                    to={`/quizzes/${subject.id}`}
                    key={subject.id}
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
                          src={
                            subject.image ||
                            `https://img.usecurling.com/p/400/200?q=${encodeURIComponent(
                              subject.name,
                            )}`
                          }
                          alt={subject.name}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Progress Badge */}
                        <div className="absolute top-4 right-4">
                          <div className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-white/20">
                            <span className="text-sm font-semibold text-gray-900">{Math.round(progress)}%</span>
                          </div>
                        </div>

                        {/* Title */}
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-white text-xl font-bold mb-1 drop-shadow-lg">
                            {subject.name}
                          </h3>
                          <p className="text-white/80 text-sm line-clamp-2">
                            {subject.description || `Quizzes sobre ${subject.name}`}
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
                                <BookOpen className="w-4 h-4 text-white" />
                              </div>
                              <div className="text-lg font-bold text-blue-600">
                                {subject.topics.length}
                              </div>
                              <div className="text-xs text-muted-foreground">Tópicos</div>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                              <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-green-500 flex items-center justify-center">
                                <Brain className="w-4 h-4 text-white" />
                              </div>
                              <div className="text-lg font-bold text-green-600">
                                {totalQuizzes}
                              </div>
                              <div className="text-xs text-muted-foreground">Quizzes</div>
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground font-medium">Progresso</span>
                              <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
                            </div>
                            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="mt-6">
                          <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white transition-all duration-300 ease-out py-3 text-sm font-semibold rounded-xl group-hover:scale-105">
                            <div className="flex items-center justify-center gap-2">
                              <Play className="w-4 h-4" />
                              Iniciar Quiz
                              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </div>
                          </Button>
                        </div>
                      </div>
                    </MagicCard>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </MagicLayout>
  )
}