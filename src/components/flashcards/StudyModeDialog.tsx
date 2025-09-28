import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Zap,
  BookOpen,
  BrainCircuit,
  TestTube,
  SlidersHorizontal,
  ChevronLeft,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface StudyModeDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  subjectId: string
  topicId: string
}

const studyModes = [
  {
    name: 'Sessão Completa',
    description: 'Estude todos os cards do tópico no seu ritmo.',
    icon: BookOpen,
    mode: 'full',
  },
  {
    name: 'Revisão de Difíceis',
    description: 'Foque nos cards que você marcou como difíceis.',
    icon: BrainCircuit,
    mode: 'difficult_review',
  },
  {
    name: 'Modo Relâmpago',
    description: 'Uma revisão rápida com cards aleatórios.',
    icon: Zap,
    mode: 'lightning',
  },
  {
    name: 'Modo Teste',
    description: 'Simule um ambiente de prova com tempo cronometrado.',
    icon: TestTube,
    mode: 'test',
  },
  {
    name: 'Estudo Livre',
    description: 'Personalize a quantidade e a ordem dos cards.',
    icon: SlidersHorizontal,
    mode: 'free',
  },
]

const cardCounts = [5, 10, 15, 20, 25, 30]

export const StudyModeDialog = ({
  isOpen,
  onOpenChange,
  subjectId,
  topicId,
}: StudyModeDialogProps) => {
  const navigate = useNavigate()
  const [step, setStep] = useState<'mode' | 'count'>('mode')
  const [selectedMode, setSelectedMode] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setStep('mode')
      setSelectedMode(null)
    }
  }, [isOpen])

  const handleModeSelect = (mode: string) => {
    if (mode === 'difficult_review') {
      onOpenChange(false)
      navigate(
        `/flashcards/${subjectId}/${topicId}/study?mode=difficult_review`,
      )
    } else {
      setSelectedMode(mode)
      setStep('count')
    }
  }

  const handleCountSelect = (count: number | 'all') => {
    onOpenChange(false)
    navigate(
      `/flashcards/${subjectId}/${topicId}/study?mode=${selectedMode}&count=${count}`,
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          {step === 'mode' ? (
            <>
              <DialogTitle>Escolha um Modo de Estudo</DialogTitle>
              <DialogDescription>
                Selecione como você quer estudar este tópico.
              </DialogDescription>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStep('mode')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle>Quantidade de Cards</DialogTitle>
                <DialogDescription>
                  Quantos cards você quer revisar nesta sessão?
                </DialogDescription>
              </div>
            </div>
          )}
        </DialogHeader>
        {step === 'mode' ? (
          <div className="grid gap-4 py-4">
            {studyModes.map((mode) => (
              <Button
                key={mode.mode}
                variant="outline"
                className="h-auto justify-start p-4 text-left"
                onClick={() => handleModeSelect(mode.mode)}
              >
                <mode.icon className="mr-4 h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold">{mode.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {mode.description}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 py-4">
            {cardCounts.map((count) => (
              <Button
                key={count}
                variant="outline"
                onClick={() => handleCountSelect(count)}
              >
                {count} Cards
              </Button>
            ))}
            <Button
              variant="outline"
              className="col-span-2"
              onClick={() => handleCountSelect('all')}
            >
              Todos os Cards
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
