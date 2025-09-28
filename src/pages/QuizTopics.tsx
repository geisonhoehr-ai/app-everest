import { Link, useParams, useNavigate } from 'react-router-dom'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ListChecks, Play } from 'lucide-react'
import { quizData } from '@/lib/data'
import { Badge } from '@/components/ui/badge'

export default function QuizTopicsPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const subject = quizData.find((s) => s.id === subjectId)

  if (!subject) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Matéria não encontrada</h2>
        <Button onClick={() => navigate('/quizzes')} className="mt-4">
          Voltar para Matérias
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/quizzes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{subject.name}</h1>
          <p className="text-muted-foreground">
            Selecione um quiz para testar seus conhecimentos.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {subject.topics.map((topic, index) => (
          <MagicCard
            key={topic.id}
            className="h-full flex flex-col"
            led
            ledColor={index % 4 === 0 ? 'cyan' : index % 4 === 1 ? 'purple' : index % 4 === 2 ? 'orange' : 'green'}
          >
            <div className="flex-grow flex flex-col p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">{topic.title}</h3>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                    {topic.questionCount} questões
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Teste seus conhecimentos em {topic.title.toLowerCase()}
                </p>
                
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-info" />
                    <span className="text-muted-foreground">{topic.questionCount} questões</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-muted-foreground">Disponível</span>
                  </div>
                </div>
              </div>
              
              <Button asChild className="w-full mt-4 text-sm py-2.5">
                <Link to={`/quizzes/${subjectId}/${topic.id}`}>
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Quiz
                </Link>
              </Button>
            </div>
          </MagicCard>
        ))}
      </div>
    </div>
  )
}
