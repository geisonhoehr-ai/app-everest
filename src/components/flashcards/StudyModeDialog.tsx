import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  BookOpen,
  BrainCircuit,
  TestTube,
  SlidersHorizontal,
  ChevronLeft,
  Clock,
  Target,
  Star,
  Trophy,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

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
    color: 'blue',
    time: '15-30 min',
    difficulty: 'Médio',
  },
  {
    name: 'Revisão de Difíceis',
    description: 'Foque nos cards que você marcou como difíceis.',
    icon: BrainCircuit,
    mode: 'difficult_review',
    color: 'red',
    time: '10-20 min',
    difficulty: 'Difícil',
  },
  {
    name: 'Modo Relâmpago',
    description: 'Uma revisão rápida com cards aleatórios.',
    icon: Zap,
    mode: 'lightning',
    color: 'yellow',
    time: '5-10 min',
    difficulty: 'Fácil',
  },
  {
    name: 'Modo Teste',
    description: 'Simule um ambiente de prova com tempo cronometrado.',
    icon: TestTube,
    mode: 'test',
    color: 'purple',
    time: '20-40 min',
    difficulty: 'Difícil',
  },
  {
    name: 'Estudo Livre',
    description: 'Personalize a quantidade e a ordem dos cards.',
    icon: SlidersHorizontal,
    mode: 'free',
    color: 'green',
    time: 'Flexível',
    difficulty: 'Personalizado',
  },
]

const cardCounts = [
  { count: 5, label: '5 Cards', time: '2-5 min', icon: Clock },
  { count: 10, label: '10 Cards', time: '5-10 min', icon: Target },
  { count: 15, label: '15 Cards', time: '8-15 min', icon: Star },
  { count: 20, label: '20 Cards', time: '10-20 min', icon: Trophy },
  { count: 25, label: '25 Cards', time: '12-25 min', icon: BookOpen },
  { count: 30, label: '30 Cards', time: '15-30 min', icon: BrainCircuit },
]

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700">
        <DialogHeader className="pb-6">
          {step === 'mode' ? (
            <>
              <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                🎯 Escolha seu Modo de Estudo
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400 text-lg">
                Selecione a melhor forma de estudar este tópico baseado no seu tempo e objetivos.
              </DialogDescription>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setStep('mode')}
                className="hover:bg-slate-100 dark:hover:bg-gray-800 border-slate-200 dark:border-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  📊 Quantidade de Cards
                </DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400 text-lg">
                  Quantos cards você quer revisar nesta sessão?
                </DialogDescription>
              </div>
            </div>
          )}
        </DialogHeader>
        
        {step === 'mode' ? (
          <div className="grid gap-6 py-4">
            {studyModes.map((mode) => (
              <Card 
                key={mode.mode}
                className={cn(
                  "cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg dark:hover:shadow-2xl border-2 hover:border-blue-300 dark:hover:border-blue-600",
                  "bg-white dark:bg-gray-800/90 border-slate-200 dark:border-gray-700"
                )}
                onClick={() => handleModeSelect(mode.mode)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-xl border-2",
                      mode.color === 'blue' && "bg-blue-100 dark:bg-blue-900/50 border-blue-200 dark:border-blue-800",
                      mode.color === 'red' && "bg-red-100 dark:bg-red-900/50 border-red-200 dark:border-red-800",
                      mode.color === 'yellow' && "bg-yellow-100 dark:bg-yellow-900/50 border-yellow-200 dark:border-yellow-800",
                      mode.color === 'purple' && "bg-purple-100 dark:bg-purple-900/50 border-purple-200 dark:border-purple-800",
                      mode.color === 'green' && "bg-green-100 dark:bg-green-900/50 border-green-200 dark:border-green-800"
                    )}>
                      <mode.icon className={cn(
                        "h-6 w-6",
                        mode.color === 'blue' && "text-blue-600 dark:text-blue-400",
                        mode.color === 'red' && "text-red-600 dark:text-red-400",
                        mode.color === 'yellow' && "text-yellow-600 dark:text-yellow-400",
                        mode.color === 'purple' && "text-purple-600 dark:text-purple-400",
                        mode.color === 'green' && "text-green-600 dark:text-green-400"
                      )} />
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {mode.name}
                        </h3>
                        <Badge className={cn(
                          "text-xs",
                          mode.difficulty === 'Fácil' && "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
                          mode.difficulty === 'Médio' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
                          mode.difficulty === 'Difícil' && "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
                          mode.difficulty === 'Personalizado' && "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        )}>
                          {mode.difficulty}
                        </Badge>
                      </div>
                      
                      <p className="text-slate-600 dark:text-slate-400 mb-4">
                        {mode.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{mode.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {cardCounts.map((option) => (
              <Card 
                key={option.count}
                className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg dark:hover:shadow-2xl border-2 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-800/90 border-slate-200 dark:border-gray-700"
                onClick={() => handleCountSelect(option.count)}
              >
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800">
                      <option.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {option.label}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {option.time}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Card 
              className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg dark:hover:shadow-2xl border-2 hover:border-green-300 dark:hover:border-green-600 bg-white dark:bg-gray-800/90 border-slate-200 dark:border-gray-700 md:col-span-2 lg:col-span-3"
              onClick={() => handleCountSelect('all')}
            >
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/50 border border-green-200 dark:border-green-800">
                    <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Todos os Cards
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Estude todo o conteúdo do tópico
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
