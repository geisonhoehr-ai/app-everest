import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Timer, ChevronLeft, ChevronRight } from 'lucide-react'

const mockSimulation = {
  id: 1,
  name: 'Simulado Nacional - Humanas',
  duration: 180, // in minutes
  questions: [
    {
      id: 1,
      type: 'mcq',
      question: 'Qual filósofo é conhecido pela frase "Penso, logo existo"?',
      options: ['Platão', 'Aristóteles', 'Descartes', 'Sócrates'],
      answer: 'Descartes',
    },
    {
      id: 2,
      type: 'reading',
      passage: 'Texto longo sobre a Revolução Industrial...',
      question:
        'Com base no texto, qual foi o principal impacto social da Revolução Industrial?',
    },
    {
      id: 3,
      type: 'essay',
      question:
        'Discorra sobre as consequências da globalização para os países em desenvolvimento.',
    },
  ],
}

export default function SimulationExamPage() {
  const { simulationId } = useParams()
  const navigate = useNavigate()
  const [currentQ, setCurrentQ] = useState(0)
  const [timeLeft, setTimeLeft] = useState(mockSimulation.duration * 60)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0')
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  const question = mockSimulation.questions[currentQ]

  return (
    <div className="flex flex-col gap-6">
      <Card className="sticky top-0 z-10">
        <CardContent className="p-4 flex justify-between items-center">
          <h2 className="font-semibold">{mockSimulation.name}</h2>
          <div className="flex items-center gap-2 font-mono text-lg">
            <Timer className="h-5 w-5" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questão {currentQ + 1}</CardTitle>
        </CardHeader>
        <CardContent>
          {question.type === 'mcq' && (
            <>
              <p className="mb-4">{question.question}</p>
              <RadioGroup>
                {question.options?.map((opt) => (
                  <div key={opt} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt} id={opt} />
                    <Label htmlFor={opt}>{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </>
          )}
          {question.type === 'reading' && (
            <>
              <Card className="mb-4 bg-muted/50 p-4 max-h-48 overflow-y-auto">
                <p className="text-sm">{question.passage}</p>
              </Card>
              <p className="mb-4">{question.question}</p>
              <Textarea placeholder="Sua resposta..." />
            </>
          )}
          {question.type === 'essay' && (
            <>
              <p className="mb-4">{question.question}</p>
              <Textarea placeholder="Sua redação..." rows={15} />
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
          disabled={currentQ === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
        </Button>
        <span>
          {currentQ + 1} / {mockSimulation.questions.length}
        </span>
        {currentQ < mockSimulation.questions.length - 1 ? (
          <Button variant="outline" onClick={() => setCurrentQ((p) => p + 1)}>
            Próxima <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>Finalizar Simulado</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Envio?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você tem certeza que deseja finalizar e enviar suas respostas?
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    navigate(`/simulados/${simulationId}/resultado`)
                  }
                >
                  Confirmar e Enviar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}
