import { useState } from 'react'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { X, ChevronLeft, ChevronRight, ListChecks, Target, Clock, BarChart3, Award, BookOpen } from 'lucide-react'

interface QuizzesTutorialProps {
  onClose: () => void
}

const tutorialSteps = [
  {
    title: 'Bem-vindo aos Quizzes! 📝',
    description: 'Teste seus conhecimentos com quizzes interativos. Uma forma eficaz de avaliar seu aprendizado e identificar pontos de melhoria.',
    icon: ListChecks,
    tips: [
      'Quizzes ajudam a fixar o conhecimento',
      'Identifique suas áreas fortes e fracas',
      'Pratique regularmente para melhorar'
    ]
  },
  {
    title: 'Escolha sua Matéria 📚',
    description: 'Navegue pelos tópicos disponíveis e escolha qual deseja praticar. Cada matéria tem quizzes organizados por dificuldade.',
    icon: BookOpen,
    tips: [
      'Comece pelos tópicos que você estudou recentemente',
      'Veja a quantidade de questões disponíveis',
      'Acompanhe seu progresso em cada matéria'
    ]
  },
  {
    title: 'Como Responder 🎯',
    description: 'Leia cada questão com atenção, escolha a alternativa que você considera correta e confirme sua resposta.',
    icon: Target,
    tips: [
      'Leia todas as alternativas antes de escolher',
      'Não tenha pressa - qualidade > velocidade',
      'Marque e revise questões difíceis'
    ]
  },
  {
    title: 'Tempo e Pontuação ⏱️',
    description: 'Cada quiz tem um tempo limite. Responda com calma mas sem perder tempo. Sua pontuação é baseada em acertos e tempo.',
    icon: Clock,
    tips: [
      'Gerencie seu tempo com sabedoria',
      'Não fique preso em uma questão difícil',
      'Revise suas respostas se sobrar tempo'
    ]
  },
  {
    title: 'Resultados e Análise 📊',
    description: 'Ao finalizar, veja seu desempenho detalhado: acertos, erros, tempo gasto e explicações das questões.',
    icon: BarChart3,
    tips: [
      'Revise as questões que você errou',
      'Entenda o porquê das respostas corretas',
      'Use o feedback para estudar melhor'
    ]
  },
  {
    title: 'Ganhe XP e Conquistas 🏆',
    description: 'Completar quizzes te dá XP para subir no ranking! Quanto melhor seu desempenho, mais pontos você ganha.',
    icon: Award,
    tips: [
      'Acertos consecutivos dão bônus de XP',
      'Complete quizzes diariamente',
      'Desbloqueie conquistas especiais'
    ]
  }
]

export function QuizzesTutorial({ onClose }: QuizzesTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const step = tutorialSteps[currentStep]
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100
  const Icon = step.icon

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <MagicCard variant="premium" size="lg" className="max-w-2xl w-full">
        <div className="relative p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Icon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{step.title}</h2>
                <p className="text-sm text-muted-foreground">Passo {currentStep + 1} de {tutorialSteps.length}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <Progress value={progress} className="mb-6 h-2" />

          <div className="space-y-6 mb-8">
            <p className="text-lg text-foreground leading-relaxed">{step.description}</p>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Dicas importantes:</h3>
              <ul className="space-y-2">
                {step.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="flex gap-1.5">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    index === currentStep ? 'bg-primary w-6' : index < currentStep ? 'bg-primary/50' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>

            <Button onClick={handleNext} className="gap-2 bg-gradient-to-r from-primary to-primary/80">
              {currentStep === tutorialSteps.length - 1 ? 'Finalizar' : 'Próximo'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {currentStep < tutorialSteps.length - 1 && (
            <div className="text-center mt-4">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
                Pular tutorial
              </Button>
            </div>
          )}
        </div>
      </MagicCard>
    </div>
  )
}
