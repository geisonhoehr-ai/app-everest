import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Target, BookOpen, Clock, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { quizService, type Quiz } from '@/services/quizService'
import { SectionLoader } from '@/components/SectionLoader'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useContentAccess } from '@/hooks/useContentAccess'
import { logger } from '@/lib/logger'

interface QuizTopic {
  id: string
  name: string
  description: string
  quizzes: Quiz[]
}

export default function QuizTopicsPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isStudent } = useAuth()
  const { isAllowed } = useContentAccess('quiz_topic')
  const [subjectName, setSubjectName] = useState('')
  const [topics, setTopics] = useState<QuizTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!subjectId) return

    const loadTopics = async () => {
      try {
        setIsLoading(true)

        // Buscar todas as matérias e encontrar a atual
        const subjects = await quizService.getQuizSubjects()
        const subject = subjects.find(s => s.id === subjectId)

        if (!subject) {
          toast({
            title: 'Matéria não encontrada',
            description: 'A matéria que você está procurando não existe.',
            variant: 'destructive',
          })
          navigate('/quizzes')
          return
        }

        setSubjectName(subject.name)

        logger.debug(`Subject found: ${subject.name}`)
        logger.debug(`Topics in subject: ${subject.topics.length}`)
        subject.topics.forEach((topic, idx) => {
          logger.debug(`  Topic ${idx + 1}: ${topic.name} - ${topic.quizzes.length} quizzes`)
        })

        setTopics(subject.topics)
      } catch (error) {
        logger.error('Erro ao carregar tópicos:', error)
        toast({
          title: 'Erro ao carregar tópicos',
          description: 'Não foi possível carregar os tópicos desta matéria.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadTopics()
  }, [subjectId, navigate, toast])

  if (isLoading) {
    return <SectionLoader />
  }

  // Verificar se há quizzes em algum tópico
  const hasQuizzes = topics.some(topic => topic.quizzes && topic.quizzes.length > 0)

  if (topics.length === 0 || !hasQuizzes) {
    logger.warn(`No quizzes found for subject: ${subjectName}`)
    logger.debug(`Topics: ${topics.length}, HasQuizzes: ${hasQuizzes}`)

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{subjectName || 'Matéria'}</h1>
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Nenhum quiz disponível</h2>
          <p className="text-muted-foreground mb-6">
            Esta matéria ainda não possui quizzes publicados.
          </p>
          <Button onClick={() => navigate('/quizzes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Matérias
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{subjectName}</h1>
      <p className="text-muted-foreground">Selecione um tópico para ver os quizzes disponíveis</p>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/quizzes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Matérias
            </Link>
          </Button>
        </div>

        {/* Topics Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic, index) => {
            const totalQuestions = topic.quizzes.reduce(
              (sum, quiz) => sum + (quiz.questions?.length || 0),
              0
            )
            const totalQuizzes = topic.quizzes.length
            const topicLocked = isStudent && !isAllowed(topic.id)

            return (
              <Card
                key={topic.id}
                className={cn("border-border shadow-sm flex flex-col overflow-hidden transition-colors duration-300 hover:shadow-md h-full", topicLocked && "opacity-50")}
              >
                {/* Image Header */}
                <div className="relative h-32 sm:h-36 overflow-hidden">
                  <img
                    src="/quiz-cover.png"
                    alt={topic.name}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute inset-x-3 bottom-3">
                    <h3 className="text-white text-lg font-bold mb-0.5 drop-shadow-lg line-clamp-1">
                      {topic.name}
                    </h3>
                  </div>
                </div>

                <div className="flex-1 flex flex-col p-4 space-y-4">
                  <div className="space-y-2">
                    {/* Badge moved here for consistency */}
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] h-5">
                        {totalQuizzes} {totalQuizzes === 1 ? 'Quiz' : 'Quizzes'}
                      </Badge>
                    </div>
                    {topic.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 min-h-[3rem]">
                        {topic.description}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs py-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-muted-foreground font-medium">
                        {totalQuestions} questões
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-muted-foreground font-medium">Disponível</span>
                    </div>
                  </div>

                  {/* Quizzes Preview List */}
                  {totalQuizzes > 0 ? (
                    <div className="space-y-1.5 flex-1">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                        Disponíveis
                      </p>
                      <div className="space-y-1">
                        {topic.quizzes.slice(0, 2).map((quiz) => (
                          <div key={quiz.id} className="flex items-center gap-2 text-xs text-foreground/80">
                            <div className="w-1 h-1 rounded-full bg-primary/50" />
                            <span className="line-clamp-1">{quiz.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-2 rounded-lg bg-muted/20 border border-dashed text-xs text-muted-foreground">
                      Em breve
                    </div>
                  )}

                  {/* Action Button */}
                  {topicLocked ? (
                    <Button
                      variant="outline"
                      className="w-full opacity-50 cursor-not-allowed gap-2"
                      onClick={() => toast({ title: 'Conteúdo bloqueado', description: 'Adquira o acesso completo para desbloquear este conteúdo' })}
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Bloqueado
                    </Button>
                  ) : totalQuizzes > 0 ? (
                    <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md">
                      <Link to={`/quiz/${topic.quizzes[0].id}`}>
                        <Play className="h-3.5 w-3.5 mr-2" />
                        Iniciar Agora
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled variant="outline" className="w-full opacity-50">
                      Indisponível
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
