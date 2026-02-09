import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { getQuizzes, type Quiz } from '@/services/quizService'
import { Search, CheckCircle, ListChecks } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { Button } from '@/components/ui/button'

interface QuizPickerModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onQuizSelect: (quiz: Quiz) => void
}

export const QuizPickerModal = ({
  isOpen,
  onOpenChange,
  onQuizSelect,
}: QuizPickerModalProps) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      getQuizzes(debouncedSearchTerm).then((data) => {
        setQuizzes(data)
        setIsLoading(false)
      })
    }
  }, [isOpen, debouncedSearchTerm])

  const handleSelect = (quiz: Quiz) => {
    onQuizSelect(quiz)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Selecionar Quiz</DialogTitle>
          <DialogDescription>
            Associe um quiz a esta aula ou módulo.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar quiz..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ScrollArea className="h-[50vh] border rounded-md p-4">
          <div className="space-y-2">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              : quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted"
                  >
                    <div>
                      <p className="font-semibold">{quiz.title}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <ListChecks className="h-4 w-4" />
                        {quiz.questionCount} questões
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelect(quiz)}
                    >
                      Selecionar
                    </Button>
                  </div>
                ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
