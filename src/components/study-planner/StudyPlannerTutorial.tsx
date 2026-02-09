import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@/components/ui/responsive-dialog'
import {
  BookOpen,
  Clock,
  Trophy,
  Target,
  Zap,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar,
  Play,
  Coffee
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TutorialStep {
  title: string
  description: string
  icon: React.ReactNode
  tips: string[]
  color: string
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Bem-vindo ao Planejamento de Estudos!',
    description: 'Uma ferramenta completa para organizar seus estudos de forma eficiente usando a Técnica Pomodoro.',
    icon: <BookOpen className="w-16 h-16" />,
    tips: [
      'Organize seus estudos por matérias e tópicos',
      'Acompanhe seu progresso em tempo real',
      'Use o cronômetro Pomodoro para focar melhor',
      'Visualize estatísticas e histórico de estudos'
    ],
    color: 'blue'
  },
  {
    title: 'O que é a Técnica Pomodoro?',
    description: 'Um método comprovado de gestão de tempo que alterna períodos de foco intenso com pausas programadas.',
    icon: <Clock className="w-16 h-16" />,
    tips: [
      '🍅 25 minutos de estudo focado (1 Pomodoro)',
      '☕ 5 minutos de pausa curta',
      '😌 15 minutos de pausa longa (a cada 4 Pomodoros)',
      '🎯 Melhora foco, concentração e produtividade'
    ],
    color: 'orange'
  },
  {
    title: 'Como Adicionar Conteúdos?',
    description: 'Organize todos os tópicos que você precisa estudar de forma clara e estruturada.',
    icon: <Target className="w-16 h-16" />,
    tips: [
      'Clique no botão "Adicionar Conteúdo" no topo',
      'Digite o título do tópico (ex: "Crase", "Funções")',
      'Escolha a matéria correspondente',
      'Selecione o tipo: Teoria, Exercícios, Prática ou Revisão',
      'Os conteúdos serão organizados automaticamente por categoria'
    ],
    color: 'green'
  },
  {
    title: 'Usando o Cronômetro Pomodoro',
    description: 'Use o timer para manter o foco durante seus estudos e fazer pausas adequadas.',
    icon: <Play className="w-16 h-16" />,
    tips: [
      'Vá para a aba "Cronômetro Pomodoro"',
      'Digite o que você está estudando no momento',
      'Clique em "Iniciar" para começar os 25 minutos',
      'Concentre-se totalmente no estudo (sem distrações!)',
      'Quando o timer acabar, faça a pausa indicada',
      'Repita o processo para maximizar seu aprendizado'
    ],
    color: 'purple'
  },
  {
    title: 'Gerenciando Seus Conteúdos',
    description: 'Mantenha seu plano de estudos atualizado conforme você progride.',
    icon: <Calendar className="w-16 h-16" />,
    tips: [
      '▶️ Clique no botão Play para iniciar um conteúdo',
      '✅ Marque como completo quando terminar',
      '✏️ Edite o conteúdo a qualquer momento',
      '🗑️ Delete conteúdos que não são mais necessários',
      '🔍 Use a busca para encontrar conteúdos específicos',
      '🎯 Filtre por status (Pendente, Em Progresso, Completo)'
    ],
    color: 'cyan'
  },
  {
    title: 'Acompanhe Seu Progresso!',
    description: 'Visualize estatísticas detalhadas sobre seus estudos e evolução.',
    icon: <Trophy className="w-16 h-16" />,
    tips: [
      'Veja quantos conteúdos você já completou',
      'Acompanhe o total de Pomodoros realizados',
      'Confira seu progresso geral em porcentagem',
      'Acesse a aba "Histórico" para ver gráficos dos últimos 7 dias',
      'Revise suas sessões de estudo recentes',
      'Use os dados para ajustar sua rotina de estudos'
    ],
    color: 'yellow'
  }
]

interface StudyPlannerTutorialProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

export function StudyPlannerTutorial({ open, onOpenChange, onComplete }: StudyPlannerTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const step = tutorialSteps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === tutorialSteps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
      onOpenChange(false)
      setCurrentStep(0)
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    onComplete()
    onOpenChange(false)
    setCurrentStep(0)
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-600',
        border: 'border-blue-500/20'
      },
      orange: {
        bg: 'bg-orange-500/10',
        text: 'text-orange-600',
        border: 'border-orange-500/20'
      },
      green: {
        bg: 'bg-green-500/10',
        text: 'text-green-600',
        border: 'border-green-500/20'
      },
      purple: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-600',
        border: 'border-purple-500/20'
      },
      cyan: {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-600',
        border: 'border-cyan-500/20'
      },
      yellow: {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-600',
        border: 'border-yellow-500/20'
      }
    }
    return colors[color] || colors.blue
  }

  const colorClasses = getColorClasses(step.color)

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <ResponsiveDialogHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs">
              Passo {currentStep + 1} de {tutorialSteps.length}
            </Badge>
            {!isLastStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Pular Tutorial
              </Button>
            )}
          </div>
          <ResponsiveDialogTitle className="text-2xl">
            {step.title}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="text-base">
            {step.description}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-6 py-4">
          {/* Icon */}
          <div
            className={cn(
              'w-20 h-20 mx-auto rounded-2xl flex items-center justify-center border-2',
              colorClasses.bg,
              colorClasses.text,
              colorClasses.border
            )}
          >
            {step.icon}
          </div>

          {/* Tips List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {isFirstStep ? 'Funcionalidades:' : 'Como Funciona:'}
            </h4>
            <div className="space-y-2">
              {step.tips.map((tip, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border',
                    colorClasses.bg,
                    colorClasses.border
                  )}
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                      colorClasses.bg,
                      colorClasses.text
                    )}
                  >
                    {isFirstStep ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : 'bg-muted hover:bg-muted-foreground/50'
                )}
                aria-label={`Ir para passo ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex-1"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          <Button
            onClick={handleNext}
            className={cn(
              'flex-1',
              isLastStep &&
                'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70'
            )}
          >
            {isLastStep ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Começar a Usar!
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
