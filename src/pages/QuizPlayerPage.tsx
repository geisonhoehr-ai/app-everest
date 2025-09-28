import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { quizData } from '@/lib/data'

export default function QuizPlayerPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()

  // Mock finding the quiz based on ID. In a real app, this would be a fetch.
  const topic = quizData[0].topics[0]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({})

  if (!topic) {
    return <div>Quiz não encontrado.</div>
  }

  const { questions } = topic
  const progress = ((currentIndex + 1) / questions.length) * 100
  const currentQuestion = questions[currentIndex]

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }))
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      navigate(`/quiz/${quizId}/results`, {
        state: { answers: selectedAnswers, topic },
      })
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>
            {topic.title} - Questão {currentIndex + 1}
          </CardTitle>
          <CardDescription>
            Selecione a alternativa que você considera correta.
          </CardDescription>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium mb-6">{currentQuestion.question}</p>
          <RadioGroup
            value={selectedAnswers[currentQuestion.id] || ''}
            onValueChange={handleAnswerSelect}
          >
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 border rounded-md has-[:checked]:bg-muted"
              >
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label
                  htmlFor={`option-${index}`}
                  className="cursor-pointer flex-1"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleNext}
            disabled={!selectedAnswers[currentQuestion.id]}
            className="ml-auto"
          >
            {currentIndex === questions.length - 1 ? 'Finalizar' : 'Próxima'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
