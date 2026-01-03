import { useState } from 'react'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { X, ChevronLeft, ChevronRight, Layers, Brain, RotateCw, Check, X as XIcon, BookOpen } from 'lucide-react'

interface FlashcardsTutorialProps {
  onClose: () => void
}

const tutorialSteps = [
  {
    title: 'Bem-vindo aos Flashcards! 🎴',
    description: 'Flashcards são uma das formas mais eficazes de estudar. Use a repetição espaçada para memorizar conceitos importantes.',
    icon: Layers,
    tips: [
      'Estude um pouco todos os dias',
      'Revise os cards que você errou',
      'Use o sistema de cores para organizar'
    ]
  },
  {
    title: 'Escolha sua Matéria 📚',
    description: 'Navegue pelos cards de matérias e escolha qual deseja estudar. Cada matéria tem tópicos específicos organizados.',
    icon: BookOpen,
    tips: [
      'Veja quantos flashcards cada matéria tem',
      'Acompanhe seu progresso em cada uma',
      'Foque nas matérias mais desafiadoras'
    ]
  },
  {
    title: 'Como Estudar 🧠',
    description: 'Leia a pergunta, tente responder mentalmente, depois vire o card para ver a resposta. Seja honesto ao avaliar!',
    icon: Brain,
    tips: [
      'Clique no card ou use a barra de espaço',
      'Pense antes de virar',
      'Repita os que você errou'
    ]
  },
  {
    title: 'Sistema de Avaliação ✅',
    description: 'Após ver a resposta, marque se você acertou ou errou. Cards errados voltam no final da sessão.',
    icon: Check,
    tips: [
      'Verde (✓): Você sabia',
      'Vermelho (✗): Não sabia ou errou',
      'Cards errados aparecem novamente'
    ]
  },
  {
    title: 'Dicas de Estudo 💡',
    description: 'Use flashcards em sessões curtas (15-20 min). Revise regularmente para fixar o conhecimento na memória de longo prazo.',
    icon: RotateCw,
    tips: [
      'Faça pausas entre sessões',
      'Estude antes de dormir',
      'Revise os cards antigos periodicamente'
    ]
  }
]

export function FlashcardsTutorial({ onClose }: FlashcardsTutorialProps) {
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
