import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
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
import { 
  Timer, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Target, 
  Brain,
  BookOpen,
  FileText,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Trophy
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const progress = ((currentQ + 1) / mockSimulation.questions.length) * 100

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'mcq':
        return <CheckCircle className="h-5 w-5" />
      case 'reading':
        return <BookOpen className="h-5 w-5" />
      case 'essay':
        return <FileText className="h-5 w-5" />
      default:
        return <Target className="h-5 w-5" />
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq':
        return 'Múltipla Escolha'
      case 'reading':
        return 'Interpretação de Texto'
      case 'essay':
        return 'Redação'
      default:
        return 'Questão'
    }
  }

  return (
    <MagicLayout 
      title={mockSimulation.name}
      description={`Questão ${currentQ + 1} de ${mockSimulation.questions.length} • Simulado`}
      showHeader={false}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Timer */}
        <MagicCard variant="premium" size="lg" className="sticky top-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {mockSimulation.name}
                </h1>
                <p className="text-muted-foreground">
                  Questão {currentQ + 1} de {mockSimulation.questions.length}
                </p>
              </div>
            </div>
            
            <div className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-mono text-xl font-bold transition-all duration-300",
              timeLeft < 300 ? "bg-red-500/10 border-red-500/30 text-red-600" : "bg-primary/10 border-primary/30 text-primary"
            )}>
              <Timer className="h-6 w-6" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </MagicCard>

        {/* Question Card */}
        <MagicCard variant="glass" size="lg">
          <div className="space-y-8">
            {/* Question Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                  {getQuestionTypeIcon(question.type)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">Questão {currentQ + 1}</h2>
                  <p className="text-sm text-muted-foreground">
                    {getQuestionTypeLabel(question.type)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {mockSimulation.questions.length - currentQ - 1} restantes
                </span>
              </div>
            </div>

            {/* Question Content */}
            <div className="space-y-6">
              {question.type === 'mcq' && (
                <>
                  <div className="p-6 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10 border border-border/50">
                    <p className="text-lg font-medium leading-relaxed">
                      {question.question}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Selecione sua resposta:</h3>
                    <RadioGroup className="space-y-3">
                      {question.options?.map((opt, index) => (
                        <div
                          key={opt}
                          className="group flex items-center space-x-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 hover:border-primary/30 hover:scale-[1.02] hover:shadow-lg"
                        >
                          <RadioGroupItem value={opt} id={opt} className="text-primary border-2" />
                          <Label htmlFor={opt} className="cursor-pointer flex-1 text-base font-medium group-hover:text-primary transition-colors">
                            {opt}
                          </Label>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </>
              )}

              {question.type === 'reading' && (
                <>
                  <div className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-600">Texto para Interpretação</h3>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-4 rounded-lg bg-gradient-to-r from-muted/20 to-muted/10 border border-border/50">
                      <p className="text-sm leading-relaxed">{question.passage}</p>
                    </div>
                  </div>
                  <div className="p-6 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10 border border-border/50">
                    <p className="text-lg font-medium leading-relaxed mb-4">
                      {question.question}
                    </p>
                    <Textarea 
                      placeholder="Digite sua resposta aqui..." 
                      className="min-h-32 bg-card/50 backdrop-blur-sm border-border/50"
                    />
                  </div>
                </>
              )}

              {question.type === 'essay' && (
                <>
                  <div className="p-6 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10 border border-border/50">
                    <p className="text-lg font-medium leading-relaxed mb-4">
                      {question.question}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Redação</span>
                    </div>
                    <Textarea 
                      placeholder="Digite sua redação aqui..." 
                      rows={15}
                      className="bg-card/50 backdrop-blur-sm border-border/50"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </MagicCard>

        {/* Navigation */}
        <MagicCard variant="premium" size="lg">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
              disabled={currentQ === 0}
              className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> 
              Anterior
            </Button>

            <div className="flex items-center gap-2">
              {mockSimulation.questions.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-300",
                    index === currentQ 
                      ? "bg-primary scale-125" 
                      : index < currentQ 
                        ? "bg-green-500" 
                        : "bg-muted/50"
                  )}
                />
              ))}
            </div>

            {currentQ < mockSimulation.questions.length - 1 ? (
              <Button 
                variant="outline" 
                onClick={() => setCurrentQ((p) => p + 1)}
                className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300"
              >
                Próxima 
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg">
                    <Trophy className="mr-2 h-4 w-4" />
                    Finalizar Simulado
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Confirmar Envio?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Você tem certeza que deseja finalizar e enviar suas respostas?
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        navigate(`/simulados/${simulationId}/resultado`)
                      }
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      Confirmar e Enviar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
