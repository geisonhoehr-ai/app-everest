import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getAttemptDetails,
  type AttemptAnswer,
} from '@/services/adminQuizService'
import { type StudentAttempt } from '@/services/adminQuizService'
import { CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AttemptDetailsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  attempt: StudentAttempt | null
}

export const AttemptDetailsDialog = ({
  isOpen,
  onOpenChange,
  attempt,
}: AttemptDetailsDialogProps) => {
  const [answers, setAnswers] = useState<AttemptAnswer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen && attempt) {
      setIsLoading(true)
      getAttemptDetails(attempt.attempt_id).then((data) => {
        if (data) {
          setAnswers(data)
        }
        setIsLoading(false)
      })
    }
  }, [isOpen, attempt])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Tentativa</DialogTitle>
          {attempt && (
            <DialogDescription>
              Revisão das respostas de {attempt.user_name} ({attempt.user_email}
              ).
            </DialogDescription>
          )}
        </DialogHeader>
        <ScrollArea className="h-[60vh] border rounded-md p-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {answers.map((answer, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold mb-2">
                      {index + 1}. {answer.question_text}
                    </p>
                    {answer.is_correct ? (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      Sua resposta:{' '}
                      <span
                        className={cn(
                          'font-medium',
                          answer.is_correct ? 'text-green-600' : 'text-red-600',
                        )}
                      >
                        {answer.user_answer || 'Não respondida'}
                      </span>
                    </p>
                    {!answer.is_correct && (
                      <p>
                        Resposta correta:{' '}
                        <span className="font-medium text-green-600">
                          {answer.correct_answer}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
