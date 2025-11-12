import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import {
  getAdminQuizzes,
  getTopics,
  createQuiz,
  bulkInsertQuestions,
  type AdminQuiz,
  type AdminTopic,
} from '@/services/adminQuizService'
import { parseQuestionBankFromFile, type ImportError } from '@/lib/importExport'
import { ImportErrorsDialog } from '@/components/admin/ImportErrorsDialog'
import { useAuth } from '@/hooks/use-auth'

interface ImportQuestionsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

const NEW_QUIZ_VALUE = 'new-quiz'

export const ImportQuestionsDialog = ({
  isOpen,
  onOpenChange,
  onImportComplete,
}: ImportQuestionsDialogProps) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([])
  const [topics, setTopics] = useState<AdminTopic[]>([])
  const [selectedQuiz, setSelectedQuiz] = useState('')
  const [newQuizTitle, setNewQuizTitle] = useState('')
  const [newQuizTopic, setNewQuizTopic] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [importErrors, setImportErrors] = useState<ImportError[]>([])
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      getAdminQuizzes().then(setQuizzes)
      getTopics().then(setTopics)
    }
  }, [isOpen])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!file || !user) return
    if (selectedQuiz === NEW_QUIZ_VALUE && (!newQuizTitle || !newQuizTopic)) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título e o tópico para o novo quiz.',
        variant: 'destructive',
      })
      return
    }
    if (selectedQuiz === '' || selectedQuiz === undefined) {
      toast({
        title: 'Selecione um quiz',
        description:
          'Você precisa selecionar um quiz existente ou criar um novo.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    const content = await file.text()
    const result = parseQuestionBankFromFile(content)

    if (result.errors) {
      setImportErrors(result.errors)
      setIsErrorDialogOpen(true)
      setIsSubmitting(false)
      return
    }

    try {
      let quizId = selectedQuiz
      if (selectedQuiz === NEW_QUIZ_VALUE) {
        const newQuiz = await createQuiz({
          title: newQuizTitle,
          topic_id: newQuizTopic,
          created_by_user_id: user.id,
        })
        if (!newQuiz) throw new Error('Failed to create quiz')
        quizId = newQuiz.id
      }

      const questionsToInsert = result.data!.map((q) => ({
        quiz_id: quizId,
        question_text: q.question,
        options: q.options,
        correct_answer: q.answer,
        explanation: q.explanation,
        points: q.points,
        question_type: q.type,
      }))

      await bulkInsertQuestions(questionsToInsert)

      toast({
        title: 'Importação bem-sucedida!',
        description: `${result.data!.length} questões foram importadas.`,
      })
      onImportComplete()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Erro na importação',
        description: 'Não foi possível salvar as questões.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <ImportErrorsDialog
        errors={importErrors}
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
      />
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Questões em Massa</DialogTitle>
            <DialogDescription>
              Faça o upload de um arquivo .txt para adicionar questões a um quiz
              existente ou novo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quiz-select">Associar a um Quiz</Label>
              <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                <SelectTrigger id="quiz-select">
                  <SelectValue placeholder="Selecione um quiz..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NEW_QUIZ_VALUE}>
                    + Criar Novo Quiz
                  </SelectItem>
                  {quizzes.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedQuiz === NEW_QUIZ_VALUE && (
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="new-quiz-title">Título do Novo Quiz</Label>
                  <Input
                    id="new-quiz-title"
                    value={newQuizTitle}
                    onChange={(e) => setNewQuizTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="new-quiz-topic">Tópico</Label>
                  <Select value={newQuizTopic} onValueChange={setNewQuizTopic}>
                    <SelectTrigger id="new-quiz-topic">
                      <SelectValue placeholder="Selecione um tópico..." />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Arquivo de Questões (.txt)</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".txt"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !file}>
              {isSubmitting ? 'Importando...' : 'Importar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
