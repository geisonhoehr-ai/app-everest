import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import {
  MessageSquare,
  PlusCircle,
  Search,
  Users,
  TrendingUp,
  Clock,
  BookOpen,
  Star,
  Filter,
  ArrowRight,
  MessageCircle,
  Heart,
  Share2,
  Lock,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionLoader } from '@/components/SectionLoader'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import {
  getForumTopics,
  getForumCategories,
  createForumTopic,
  type ForumTopic,
  type ForumCategory
} from '@/services/forumService'
import { logger } from '@/lib/logger'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const topicSchema = z.object({
  title: z.string().min(5, 'O título deve ter pelo menos 5 caracteres'),
  content: z.string().min(20, 'O conteúdo deve ter pelo menos 20 caracteres'),
  category_id: z.string().uuid('Selecione uma categoria válida'),
})

type TopicFormValues = z.infer<typeof topicSchema>

export default function ForumPage() {
  const [topics, setTopics] = useState<ForumTopic[]>([])
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()

  const form = useForm<TopicFormValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [topicsData, categoriesData] = await Promise.all([
        getForumTopics(),
        getForumCategories(),
      ])
      setTopics(topicsData)
      setCategories(categoriesData)
    } catch (error) {
      logger.error('Error loading forum data:', error)
      toast({
        title: 'Erro ao carregar fórum',
        description: 'Tente novamente mais tarde',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: TopicFormValues) => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para criar um tópico',
        variant: 'destructive',
      })
      return
    }

    try {
      await createForumTopic({
        ...data,
        user_id: user.id,
      })

      toast({
        title: 'Tópico criado!',
        description: 'Seu tópico foi publicado com sucesso',
      })

      setIsDialogOpen(false)
      form.reset()
      loadData()
    } catch (error) {
      logger.error('Error creating topic:', error)
      toast({
        title: 'Erro ao criar tópico',
        description: 'Tente novamente mais tarde',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return <SectionLoader />
  }

  return (
    <MagicLayout
      title="Fórum de Dúvidas"
      description="Interaja, tire suas dúvidas e ajude outros estudantes"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Stats */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <MessageSquare className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Fórum de Dúvidas
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-lg">
                    Interaja e tire suas dúvidas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <Users className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                <span className="text-xs md:text-sm font-medium">{topics.length} Tópicos Ativos</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-blue-600">
                  {topics.reduce((acc, t) => acc + (t.replies_count || 0), 0)}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Respostas</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-green-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-green-600">
                  {new Set(topics.map(t => t.user_id)).size}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Participantes</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-purple-600">{categories.length}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Categorias</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-orange-600">24h</div>
                <div className="text-xs md:text-sm text-muted-foreground">Resposta Média</div>
              </div>
            </div>
          </div>
        </MagicCard>

        {/* Search and Actions */}
        <MagicCard variant="glass" size="lg">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar no fórum..."
                className="pl-10 bg-card/50 backdrop-blur-sm border-border/50"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                className="flex-1 md:flex-none bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex-1 md:flex-none bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold transition-transform duration-300 hover:scale-105 hover:shadow-lg inline-flex items-center justify-center">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Novo Tópico</span>
                    <span className="sm:hidden">Novo</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Tópico</DialogTitle>
                    <DialogDescription>
                      Compartilhe suas dúvidas ou conhecimentos com a comunidade.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input placeholder="Resumo da sua dúvida..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conteúdo</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Descreva sua dúvida detalhadamente..."
                                className="min-h-[150px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                          {form.formState.isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Publicar Tópico
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </MagicCard>

        {/* Topics List */}
        <MagicCard variant="glass" size="lg">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Tópicos Recentes</h2>
            </div>

            {topics.length === 0 ? (
              <div className="text-center py-24">
                <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Nenhum tópico encontrado
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Seja o primeiro a criar um tópico e iniciar uma discussão!
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-primary to-primary/80"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Criar Primeiro Tópico
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="group p-6 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10 border border-border/50 hover:border-primary/30 transition-colors duration-300 hover:scale-[1.02] hover:shadow-lg"
                  >
                    <Link to={`/forum/${topic.id}`} className="block">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 border-2 border-border/50">
                          <AvatarImage src={topic.author?.avatar_url || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                            {topic.author?.first_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-grow space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                                {topic.title}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>por <span className="font-medium text-foreground">
                                  {topic.author ? `${topic.author.first_name} ${topic.author.last_name}` : 'Usuário'}
                                </span></span>
                                <span>•</span>
                                <span className="px-2 py-1 rounded-full text-xs font-medium border bg-muted/50">
                                  {topic.category?.name || 'Geral'}
                                </span>
                              </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowRight className="h-5 w-5 text-primary" />
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                <span>{topic.replies_count || 0} respostas</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true, locale: ptBR })}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.preventDefault()
                                }}
                              >
                                <Heart className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.preventDefault()
                                }}
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </MagicCard>

        {/* Quick Actions */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Ações Rápidas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20 hover:border-blue-500/30 transition-transform duration-300 hover:scale-105 inline-flex items-center justify-center cursor-pointer"
                onClick={() => setIsDialogOpen(true)}
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <PlusCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-blue-600">Criar Tópico</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Compartilhe suas dúvidas e ajude outros estudantes
                  </p>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white w-full"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Tópico
                  </Button>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20 hover:border-green-500/30 transition-transform duration-300 hover:scale-105 inline-flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-green-600">Tópicos Populares</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Veja os tópicos mais comentados e relevantes
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 w-full"
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Ver Populares
                  </Button>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-purple-600/5 border border-purple-500/20 hover:border-purple-500/30 transition-transform duration-300 hover:scale-105 inline-flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-purple-600">Comunidade</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Conecte-se com outros estudantes e professores
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 w-full"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Ver Comunidade
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
