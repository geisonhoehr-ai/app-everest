import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MagicCard } from '@/components/ui/magic-card'
import { MagicLayout } from '@/components/ui/magic-layout'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Lightbulb, CheckCircle2, XCircle, BookOpen, Layers, Target, TrendingUp, Star } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import { SectionLoader } from '@/components/SectionLoader'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  question_text: string
  options: string[]
  correct_answer: string
  explanation: string | null
  question_type: string
  points: number
  quiz_id: string
  topics: {
    name: string
    subjects: {
      name: string
    } | null
  } | null
  reading_text?: {
    id: string
    title: string
    content: string
  } | null
}

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [selectedTopic, setSelectedTopic] = useState<string>('all')

  // State to track user interactions
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({})
  const [readingTextDialog, setReadingTextDialog] = useState<{ title: string, content: string } | null>(null)

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('quiz_questions')
        .select(`
          *,
          topics (
            name,
            subjects (
              name
            )
          ),
          reading_text:quiz_reading_texts (
            id,
            title,
            content
          )
        `)
        .limit(100) // Limit initial load for performance

      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Extract unique subjects and topics for filters
  const subjects = Array.from(new Set(questions.map(q => q.topics?.subjects?.name).filter(Boolean))) as string[]
  const topicsData = Array.from(new Set(questions.map(q => q.topics?.name).filter(Boolean))) as string[]

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = selectedSubject === 'all' || q.topics?.subjects?.name === selectedSubject
    const matchesTopic = selectedTopic === 'all' || q.topics?.name === selectedTopic
    return matchesSearch && matchesSubject && matchesTopic
  })

  const handleOptionSelect = (questionId: string, option: string) => {
    if (selectedAnswers[questionId]) return // Prevent changing answer
    setSelectedAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  const toggleExplanation = (questionId: string) => {
    setShowExplanation(prev => ({ ...prev, [questionId]: !prev[questionId] }))
  }

  // Stats
  const totalAnswered = Object.keys(selectedAnswers).length
  const totalCorrect = Object.entries(selectedAnswers).filter(
    ([qId, ans]) => questions.find(q => q.id === qId)?.correct_answer === ans
  ).length

  if (loading) return <SectionLoader />

  return (
    <MagicLayout
      title="Banco de Questões"
      description="Treine com questões reais e receba feedback imediato"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Stats */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Search className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Banco de Questões
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
                    Pratique e domine os conteúdos com questões comentadas
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <Star className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                <span className="text-xs md:text-sm font-medium">Feedback Imediato</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <Layers className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-blue-600">{questions.length}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Total Questões</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-green-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-green-600">{subjects.length}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Matérias</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <Target className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-purple-600">{totalAnswered}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Respondidas</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-orange-600">
                  {totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0}%
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Acertos</div>
              </div>
            </div>
          </div>
        </MagicCard>

        {/* Filters */}
        <MagicCard variant="glass" size="lg">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar no enunciado..."
                className="pl-10 bg-card/50 backdrop-blur-sm border-border/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Matéria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Matérias</SelectItem>
                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger>
                <SelectValue placeholder="Tópico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tópicos</SelectItem>
                {topicsData.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </MagicCard>

        <Dialog open={!!readingTextDialog} onOpenChange={(open) => !open && setReadingTextDialog(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {readingTextDialog?.title || 'Texto de Apoio'}
              </DialogTitle>
            </DialogHeader>
            <div className="prose dark:prose-invert max-w-none hover:prose-a:text-primary leading-relaxed whitespace-pre-wrap">
              {readingTextDialog?.content}
            </div>
          </DialogContent>
        </Dialog>

        {/* Questions */}
        <div className="space-y-6">
          {filteredQuestions.length === 0 ? (
            <MagicCard variant="glass" size="lg" className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhuma questão encontrada com os filtros atuais.
              </p>
            </MagicCard>
          ) : (
            filteredQuestions.map((q, index) => {
              const isAnswered = !!selectedAnswers[q.id]
              const isCorrect = selectedAnswers[q.id] === q.correct_answer
              const wrongSelection = isAnswered && !isCorrect ? selectedAnswers[q.id] : null

              return (
                <MagicCard key={q.id} className={cn(
                  "transition-all duration-300",
                  isAnswered && isCorrect ? "border-green-500/20 bg-green-500/5" : "",
                  isAnswered && !isCorrect ? "border-red-500/20 bg-red-500/5" : ""
                )}>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 items-center text-xs">
                      <Badge variant="outline" className="bg-background/50">
                        {q.topics?.subjects?.name || 'Geral'}
                      </Badge>
                      <Badge variant="secondary" className="bg-background/50">
                        {q.topics?.name || 'Tópico'}
                      </Badge>
                      <span className="text-muted-foreground ml-auto">Questão #{index + 1}</span>
                    </div>

                    <div className="text-foreground font-medium text-lg leading-relaxed">
                      {q.question_text}
                    </div>

                    {q.reading_text && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 w-full sm:w-auto my-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReadingTextDialog({
                            title: q.reading_text!.title,
                            content: q.reading_text!.content
                          })
                        }}
                      >
                        <BookOpen className="h-4 w-4" />
                        Ler Texto de Apoio
                      </Button>
                    )}

                    <div className="grid gap-2 mt-4">
                      {q.options?.map((option, optIndex) => {
                        let optionStyle = "hover:bg-muted/50 border-transparent"
                        let icon = null

                        if (isAnswered) {
                          if (option === q.correct_answer) {
                            optionStyle = "bg-green-500/10 border-green-500 text-green-700 dark:text-green-300 font-medium"
                            icon = <CheckCircle2 className="h-4 w-4 text-green-500" />
                          } else if (option === wrongSelection) {
                            optionStyle = "bg-red-500/10 border-red-500 text-red-700 dark:text-red-300"
                            icon = <XCircle className="h-4 w-4 text-red-500" />
                          } else {
                            optionStyle = "opacity-50"
                          }
                        }

                        return (
                          <div
                            key={optIndex}
                            onClick={() => handleOptionSelect(q.id, option)}
                            className={cn(
                              "relative flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer text-sm",
                              !isAnswered && "hover:border-primary/50 hover:bg-primary/5",
                              optionStyle
                            )}
                          >
                            <div className={cn(
                              "flex items-center justify-center w-6 h-6 rounded-full border text-xs font-semibold",
                              isAnswered && option === q.correct_answer ? "border-green-500 bg-green-500 text-white" : "border-muted-foreground/30"
                            )}>
                              {String.fromCharCode(65 + optIndex)}
                            </div>
                            <span className="flex-1">{option}</span>
                            {icon}
                          </div>
                        )
                      })}
                    </div>

                    {isAnswered && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExplanation(q.id)}
                          className="gap-2 text-primary"
                        >
                          <Lightbulb className="h-4 w-4" />
                          {showExplanation[q.id] ? "Ocultar Comentário" : "Ver Comentário do Professor"}
                        </Button>

                        {showExplanation[q.id] && (
                          <div className="mt-3 p-4 bg-muted/50 rounded-lg text-sm leading-relaxed border border-border/50 animate-in fade-in zoom-in-95">
                            <p className="font-semibold mb-1 text-primary">Explicação:</p>
                            {q.explanation || "Nenhuma explicação cadastrada para esta questão."}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </MagicCard>
              )
            })
          )}
        </div>
      </div>
    </MagicLayout>
  )
}
