import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { MagicCard } from '@/components/ui/magic-card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RichTextEditor } from '@/components/RichTextEditor'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Trash2,
  ImageIcon,
  GripVertical,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { MagicLayout } from '@/components/ui/magic-layout'

const questionSchema = z.object({
  question_format: z.enum([
    'multiple_choice',
    'true_false',
    'multiple_response',
    'fill_blank',
    'matching',
    'ordering',
    'essay',
  ]),
  question_text: z.string().min(10, 'O enunciado é muito curto.'),
  question_html: z.string().optional(),
  question_image_url: z.string().url().optional().or(z.literal('')),
  question_image_caption: z.string().optional(),
  source: z.string().min(1, 'A fonte é obrigatória.'),
  year: z.coerce.number().min(2000, 'Ano inválido.'),
  subject: z.string().min(1, 'A matéria é obrigatória.'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
  tags: z.array(z.string()).optional(),
  points: z.coerce.number().min(1).default(1),
  time_limit_seconds: z.coerce.number().optional(),

  // For multiple choice and true/false
  options: z.array(z.string()).optional(),
  correct_answer: z.string().optional(),

  // For multiple response
  options_rich: z.array(z.object({
    id: z.string(),
    text: z.string(),
    html: z.string().optional(),
    imageUrl: z.string().optional(),
    isCorrect: z.boolean().optional(),
  })).optional(),

  // For matching
  matching_pairs: z.array(z.object({
    left: z.string(),
    right: z.string(),
    leftHtml: z.string().optional(),
    rightHtml: z.string().optional(),
  })).optional(),

  // For ordering
  ordering_items: z.array(z.object({
    id: z.string(),
    text: z.string(),
    html: z.string().optional(),
    correctOrder: z.number(),
  })).optional(),

  explanation: z.string().min(10, 'A explicação é muito curta.'),
  explanation_html: z.string().optional(),
})

type QuestionFormValues = z.infer<typeof questionSchema>

export default function AdminQuestionFormPage() {
  const { questionId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isEditing = !!questionId
  const [loading, setLoading] = useState(false)

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question_format: 'multiple_choice',
      question_text: '',
      question_html: '',
      source: '',
      year: new Date().getFullYear(),
      subject: '',
      difficulty: 'medium',
      tags: [],
      points: 1,
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      explanation_html: '',
      options_rich: [],
      matching_pairs: [],
      ordering_items: [],
    },
  })

  const questionFormat = form.watch('question_format')

  const { fields: optionsFields, append: appendOption, remove: removeOption } = useFieldArray({
    control: form.control,
    name: 'options_rich' as any,
  })

  const { fields: matchingFields, append: appendMatching, remove: removeMatching } = useFieldArray({
    control: form.control,
    name: 'matching_pairs' as any,
  })

  const { fields: orderingFields, append: appendOrdering, remove: removeOrdering } = useFieldArray({
    control: form.control,
    name: 'ordering_items' as any,
  })

  useEffect(() => {
    if (isEditing && questionId) {
      loadQuestion()
    }
  }, [questionId])

  const loadQuestion = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('id', questionId)
        .single()

      if (error) throw error

      form.reset({
        question_format: data.question_format || 'multiple_choice',
        question_text: data.question_text,
        question_html: data.question_html || '',
        question_image_url: data.question_image_url || '',
        question_image_caption: data.question_image_caption || '',
        source: data.source || '',
        year: data.year || new Date().getFullYear(),
        subject: data.subject || '',
        difficulty: data.difficulty || 'medium',
        tags: data.tags || [],
        points: data.points || 1,
        time_limit_seconds: data.time_limit_seconds,
        options: data.options || [],
        correct_answer: data.correct_answer || '',
        options_rich: data.options_rich || [],
        matching_pairs: data.matching_pairs || [],
        ordering_items: data.ordering_items || [],
        explanation: data.explanation || '',
        explanation_html: data.explanation_html || '',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar questão',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const onSubmit = async (data: QuestionFormValues) => {
    setLoading(true)
    try {
      const questionData = {
        question_format: data.question_format,
        question_text: data.question_text,
        question_html: data.question_html,
        question_image_url: data.question_image_url || null,
        question_image_caption: data.question_image_caption || null,
        source: data.source,
        year: data.year,
        subject: data.subject,
        difficulty: data.difficulty,
        tags: data.tags,
        points: data.points,
        time_limit_seconds: data.time_limit_seconds || null,
        explanation: data.explanation,
        explanation_html: data.explanation_html,
        options: data.options,
        correct_answer: data.correct_answer,
        options_rich: data.options_rich,
        matching_pairs: data.matching_pairs,
        ordering_items: data.ordering_items,
      }

      if (isEditing) {
        const { error } = await supabase
          .from('quiz_questions')
          .update(questionData)
          .eq('id', questionId)

        if (error) throw error

        toast({
          title: 'Questão atualizada',
          description: 'A questão foi atualizada com sucesso.',
        })
      } else {
        const { error } = await supabase
          .from('quiz_questions')
          .insert(questionData)

        if (error) throw error

        toast({
          title: 'Questão criada',
          description: 'A questão foi criada com sucesso.',
        })
      }

      navigate('/admin/questions')
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar questão',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <MagicLayout
      title={isEditing ? 'Editar Questão' : 'Nova Questão'}
      description="Crie questões com formatação rica e diversos formatos"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Question Type Selection */}
          <MagicCard variant="glass">
            <h3 className="text-lg font-semibold mb-4">Tipo de Questão</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'multiple_choice', label: 'Múltipla Escolha', icon: Circle },
                { value: 'true_false', label: 'Verdadeiro/Falso', icon: CheckCircle2 },
                { value: 'multiple_response', label: 'Múltiplas Respostas', icon: CheckCircle2 },
                { value: 'fill_blank', label: 'Preencher Lacuna', icon: Circle },
                { value: 'matching', label: 'Correspondência', icon: Circle },
                { value: 'ordering', label: 'Ordenação', icon: Circle },
                { value: 'essay', label: 'Dissertativa', icon: Circle },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => form.setValue('question_format', type.value as any)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    questionFormat === type.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <type.icon className="h-6 w-6" />
                    <span className="text-sm font-medium text-center">{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </MagicCard>

          {/* Question Content */}
          <MagicCard variant="glass">
            <h3 className="text-lg font-semibold mb-4">Conteúdo da Questão</h3>
            <div className="space-y-4">
              <Tabs defaultValue="editor" className="w-full">
                <TabsList>
                  <TabsTrigger value="editor">Editor Rico</TabsTrigger>
                  <TabsTrigger value="text">Texto Simples</TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="question_html"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enunciado (com formatação)</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            content={field.value || ''}
                            onChange={field.onChange}
                            placeholder="Digite o enunciado da questão..."
                            minHeight="150px"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="text">
                  <FormField
                    control={form.control}
                    name="question_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enunciado (texto simples)</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={5} />
                        </FormControl>
                        <FormDescription>
                          Será usado como fallback se não houver versão formatada
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="question_image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da Imagem</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="question_image_caption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legenda da Imagem</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Descrição..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </MagicCard>

          {/* Question Metadata */}
          <MagicCard variant="glass">
            <h3 className="text-lg font-semibold mb-4">Informações Gerais</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonte</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ENEM, FUVEST..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matéria</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dificuldade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="easy">Fácil</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="hard">Difícil</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pontos</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min={1} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time_limit_seconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempo Limite (seg)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="Opcional" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </MagicCard>

          {/* Options based on question type */}
          {questionFormat === 'multiple_choice' && (
            <MagicCard variant="glass">
              <h3 className="text-lg font-semibold mb-4">Alternativas</h3>
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <FormField
                    key={i}
                    control={form.control}
                    name={`options.${i}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="px-3">
                              {String.fromCharCode(65 + i)}
                            </Badge>
                            <Input {...field} placeholder={`Alternativa ${String.fromCharCode(65 + i)}`} className="flex-1" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormField
                control={form.control}
                name="correct_answer"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Resposta Correta</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a resposta correta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {form.watch('options')?.map(
                          (opt, i) =>
                            opt && (
                              <SelectItem key={i} value={opt}>
                                {String.fromCharCode(65 + i)} - {opt}
                              </SelectItem>
                            ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </MagicCard>
          )}

          {questionFormat === 'true_false' && (
            <MagicCard variant="glass">
              <h3 className="text-lg font-semibold mb-4">Resposta</h3>
              <FormField
                control={form.control}
                name="correct_answer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resposta Correta</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Verdadeiro</SelectItem>
                        <SelectItem value="false">Falso</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </MagicCard>
          )}

          {/* Explanation */}
          <MagicCard variant="glass">
            <h3 className="text-lg font-semibold mb-4">Explicação</h3>
            <Tabs defaultValue="editor" className="w-full">
              <TabsList>
                <TabsTrigger value="editor">Editor Rico</TabsTrigger>
                <TabsTrigger value="text">Texto Simples</TabsTrigger>
              </TabsList>

              <TabsContent value="editor">
                <FormField
                  control={form.control}
                  name="explanation_html"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RichTextEditor
                          content={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Digite a explicação da resposta..."
                          minHeight="120px"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="text">
                <FormField
                  control={form.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </MagicCard>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/questions')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : isEditing ? 'Atualizar Questão' : 'Criar Questão'}
            </Button>
          </div>
        </form>
      </Form>
    </MagicLayout>
  )
}
