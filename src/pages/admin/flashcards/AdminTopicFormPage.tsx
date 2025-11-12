import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { SectionLoader } from '@/components/SectionLoader'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Layers, Save } from 'lucide-react'
import { logger } from '@/lib/logger'

const topicSchema = z.object({
  name: z.string().min(1, 'O nome do tópico é obrigatório'),
  description: z.string().optional(),
  order_index: z.number().int().min(0).default(0),
})

type TopicFormValues = z.infer<typeof topicSchema>

export default function AdminTopicFormPage() {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId?: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [subjectName, setSubjectName] = useState('')

  const isEditing = !!topicId

  const form = useForm<TopicFormValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      name: '',
      description: '',
      order_index: 0,
    },
  })

  useEffect(() => {
    loadData()
  }, [subjectId, topicId])

  const loadData = async () => {
    try {
      // Carregar nome da matéria
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('name')
        .eq('id', subjectId)
        .single()

      if (subjectData) {
        setSubjectName(subjectData.name)
      }

      // Se estiver editando, carregar dados do tópico
      if (isEditing && topicId) {
        const { data: topicData, error } = await supabase
          .from('flashcard_topics')
          .select('*')
          .eq('id', topicId)
          .single()

        if (error) throw error

        if (topicData) {
          form.reset({
            name: topicData.name,
            description: topicData.description || '',
            order_index: topicData.order_index || 0,
          })
        }
      }
    } catch (error) {
      logger.error('Erro ao carregar dados:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: TopicFormValues) => {
    try {
      if (isEditing && topicId) {
        const { error } = await supabase
          .from('flashcard_topics')
          .update({
            name: values.name,
            description: values.description,
            order_index: values.order_index,
          })
          .eq('id', topicId)

        if (error) throw error

        toast({
          title: 'Sucesso',
          description: 'Tópico atualizado com sucesso',
        })
      } else {
        const { error } = await supabase
          .from('flashcard_topics')
          .insert({
            name: values.name,
            description: values.description,
            subject_id: subjectId,
            order_index: values.order_index,
          })

        if (error) throw error

        toast({
          title: 'Sucesso',
          description: 'Tópico criado com sucesso',
        })
      }

      navigate(`/admin/flashcards/${subjectId}`)
    } catch (error) {
      logger.error('Erro ao salvar tópico:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o tópico',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <SectionLoader />
  }

  return (
    <MagicLayout
      title={isEditing ? 'Editar Tópico' : 'Novo Tópico'}
      description={`${subjectName} - ${isEditing ? 'Edite o tópico' : 'Crie um novo tópico'}`}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <MagicCard variant="glass" size="lg">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/admin/flashcards/${subjectId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isEditing ? 'Editar Tópico' : 'Novo Tópico'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {subjectName}
                </p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Tópico *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Funções Quadráticas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrição do tópico (opcional)"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Breve descrição sobre o conteúdo do tópico
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order_index"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem de Exibição</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Define a ordem em que o tópico aparece na lista (0 = primeiro)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/admin/flashcards/${subjectId}`)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Salvar Alterações' : 'Criar Tópico'}
                </Button>
              </div>
            </form>
          </Form>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
