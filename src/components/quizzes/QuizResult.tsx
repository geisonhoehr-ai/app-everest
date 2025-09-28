import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CheckCircle, XCircle, Repeat } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface Question {
  id: number | string
  question: string
  correctAnswer: string
  options: string[]
}

interface Topic {
  title: string
  questions: Question[]
}

interface QuizResultProps {
  answers: Record<string | number, string>
  topic: Topic
  retakeLink: string
  backLink: string
  backLinkText?: string
}

export const QuizResult = ({
  answers,
  topic,
  retakeLink,
  backLink,
  backLinkText = 'Voltar',
}: QuizResultProps) => {
  const { questions } = topic
  const score = questions.reduce((acc, question) => {
    return answers[question.id] === question.correctAnswer ? acc + 1 : acc
  }, 0)
  const percentage =
    questions.length > 0 ? Math.round((score / questions.length) * 100) : 0

  return (
    <div className="flex flex-col items-center gap-6">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Resultado do Quiz</CardTitle>
          <CardDescription>{topic.title}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-lg">Você acertou</p>
          <p className="text-6xl font-bold text-primary my-2">
            {score}/{questions.length}
          </p>
          <p className="text-2xl font-semibold">{percentage}% de acerto</p>
        </CardContent>
      </Card>

      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Revisão das Questões</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {questions.map((q, index) => {
              const userAnswer = answers[q.id]
              const isCorrect = userAnswer === q.correctAnswer
              return (
                <AccordionItem value={`item-${index}`} key={q.id}>
                  <AccordionTrigger className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2 text-left">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="flex-1">Questão {index + 1}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="font-semibold mb-2">{q.question}</p>
                    <p>
                      Sua resposta:{' '}
                      <span
                        className={
                          isCorrect ? 'text-green-500' : 'text-red-500'
                        }
                      >
                        {userAnswer}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p>
                        Resposta correta:{' '}
                        <span className="text-green-500">
                          {q.correctAnswer}
                        </span>
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button asChild>
          <Link to={retakeLink}>
            <Repeat className="mr-2 h-4 w-4" /> Refazer Quiz
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={backLink}>{backLinkText}</Link>
        </Button>
      </div>
    </div>
  )
}
