import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { MagicCard } from '@/components/ui/magic-card'
import { MagicLayout } from '@/components/ui/magic-layout'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Target, BookOpen, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { quizService, type Quiz } from '@/services/quizService'
import { SectionLoader } from '@/components/SectionLoader'
import { useToast } from '@/hooks/use-toast'

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
        setTopics(subject.topics)
      } catch (error) {
        console.error('Erro ao carregar tópicos:', error)
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

  if (topics.length === 0) {
    return (
      <MagicLayout title={subjectName || 'Matéria'}>
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Nenhum tópico disponível</h2>
          <p className="text-muted-foreground mb-6">
            Esta matéria ainda não possui tópicos com quizzes.
          </p>
          <Button onClick={() => navigate('/quizzes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Matérias
          </Button>
        </div>
      </MagicLayout>
    )
  }

  return (
    <MagicLayout
      title={subjectName}
      description="Selecione um tópico para ver os quizzes disponíveis"
    >
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

            return (
              <MagicCard
                key={topic.id}
                className="h-full flex flex-col hover:shadow-lg transition-shadow"
                variant="glass"
                led
                ledColor={
                  index % 4 === 0 ? 'cyan' :
                  index % 4 === 1 ? 'purple' :
                  index % 4 === 2 ? 'orange' :
                  'green'
                }
              >
                <div className="flex-grow flex flex-col p-6 space-y-4">
                  {/* Header */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold text-foreground line-clamp-2">
                        {topic.name}
                      </h3>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs shrink-0">
                        {totalQuizzes} {totalQuizzes === 1 ? 'quiz' : 'quizzes'}
                      </Badge>
                    </div>

                    {topic.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {topic.description}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-muted-foreground">
                        {totalQuestions} questões
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-muted-foreground">Disponível</span>
                    </div>
                  </div>

                  {/* Quizzes List */}
                  {totalQuizzes > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Quizzes neste tópico:
                      </p>
                      <div className="space-y-1.5">
                        {topic.quizzes.slice(0, 3).map((quiz) => (
                          <Link
                            key={quiz.id}
                            to={`/quiz/${quiz.id}`}
                            className="block"
                          >
                            <div className="text-xs p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                              <div className="flex items-center justify-between gap-2">
                                <span className="line-clamp-1 font-medium">
                                  {quiz.title}
                                </span>
                                <Play className="h-3 w-3 text-primary shrink-0" />
                              </div>
                            </div>
                          </Link>
                        ))}
                        {totalQuizzes > 3 && (
                          <p className="text-xs text-muted-foreground text-center pt-1">
                            +{totalQuizzes - 3} mais {totalQuizzes - 3 === 1 ? 'quiz' : 'quizzes'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  {totalQuizzes === 1 ? (
                    <Button asChild className="w-full mt-auto">
                      <Link to={`/quiz/${topic.quizzes[0].id}`}>
                        <Play className="h-4 w-4 mr-2" />
                        Iniciar Quiz
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" className="w-full mt-auto">
                      <div className="text-center text-sm text-muted-foreground">
                        Escolha um quiz acima
                      </div>
                    </Button>
                  )}
                </div>
              </MagicCard>
            )
          })}
        </div>
      </div>
    </MagicLayout>
  )
}
