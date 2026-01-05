import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import {
  ArrowLeft,
  CornerUpRight,
  MessageSquare,
  Clock,
  Heart,
  Share2,
  Flag,
  Reply,
  ThumbsUp,
  Loader2,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getTopicDetails,
  getTopicPosts,
  createForumPost,
  type ForumTopic,
  type ForumPost
} from '@/services/forumService'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { SectionLoader } from '@/components/SectionLoader'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { logger } from '@/lib/logger'

export default function ForumTopicPage() {
  const { topicId } = useParams()
  const { user, isTeacher } = useAuth()
  const { toast } = useToast()

  const [topic, setTopic] = useState<ForumTopic | null>(null)
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (topicId) {
      loadTopicData(topicId)
    }
  }, [topicId])

  const loadTopicData = async (id: string) => {
    try {
      setIsLoading(true)
      const [topicData, postsData] = await Promise.all([
        getTopicDetails(id),
        getTopicPosts(id)
      ])
      setTopic(topicData)
      setPosts(postsData)
    } catch (error) {
      logger.error('Error loading topic:', error)
      toast({
        title: 'Erro ao carregar tópico',
        description: 'Não foi possível carregar os dados do tópico.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitReply = async () => {
    if (!user || !topicId) return
    if (replyContent.trim().length < 5) {
      toast({
        title: 'Resposta muito curta',
        description: 'Sua resposta deve ter pelo menos 5 caracteres.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSubmitting(true)
      await createForumPost({
        topic_id: topicId,
        content: replyContent,
        user_id: user.id
      })

      setReplyContent('')
      toast({
        title: 'Resposta enviada!',
        description: 'Sua resposta foi publicada com sucesso.'
      })

      // Reload posts
      const updatedPosts = await getTopicPosts(topicId)
      setPosts(updatedPosts)
    } catch (error) {
      logger.error('Error submitting reply:', error)
      toast({
        title: 'Erro ao enviar resposta',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <SectionLoader />
  }

  if (!topic) {
    return (
      <MagicLayout title="Tópico não encontrado">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Tópico não encontrado</h2>
          <Link to="/forum">
            <Button className="mt-4">Voltar para o Fórum</Button>
          </Link>
        </div>
      </MagicLayout>
    )
  }

  return (
    <MagicLayout
      title={topic.title}
      description={`Tópico do fórum • ${topic.category?.name || 'Geral'} • ${posts.length} respostas`}
      showHeader={false}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Navigation */}
        <MagicCard variant="premium" size="lg">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              asChild
              className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80"
            >
              <Link to="/forum">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Voltar para o Fórum</h1>
              <p className="text-sm text-muted-foreground">Retornar à lista de tópicos</p>
            </div>
          </div>
        </MagicCard>

        {/* Topic Header */}
        <MagicCard variant="glass" size="lg">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium border",
                    "bg-blue-500/10 border-blue-500/20 text-blue-600"
                  )}>
                    {topic.category?.name || 'Geral'}
                  </span>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {topic.title}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-70 hover:opacity-100"
                >
                  <Heart className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-70 hover:opacity-100"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-70 hover:opacity-100"
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10 border border-border/50">
              <Avatar className="h-12 w-12 border-2 border-border/50">
                <AvatarImage src={topic.author?.avatar_url || ''} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                  {topic.author?.first_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">
                    {topic.author ? `${topic.author.first_name} ${topic.author.last_name}` : 'Usuário'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Autor do tópico</p>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10 border border-border/50">
              <p className="text-foreground/90 leading-relaxed text-lg whitespace-pre-wrap">
                {topic.content}
              </p>
            </div>
          </div>
        </MagicCard>

        {/* Replies Section */}
        <MagicCard variant="glass" size="lg">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <Reply className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">
                {posts.length} Respostas
              </h2>
            </div>

            <div className="space-y-6">
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  className={cn(
                    "p-6 rounded-xl border transition-colors duration-300",
                    "bg-gradient-to-r from-muted/20 to-muted/10 border-border/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border-2 border-border/50">
                      <AvatarImage src={post.author?.avatar_url || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {post.author?.first_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-grow space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">
                            {post.author ? `${post.author.first_name} ${post.author.last_name}` : 'Usuário'}
                          </h3>
                          {/* Teacher badge logic could be added here if we check user roles */}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
                        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Curtir
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            // Focus textarea or scroll to reply form
                            document.querySelector('textarea')?.focus()
                          }}
                        >
                          <Reply className="h-4 w-4 mr-1" />
                          Responder
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MagicCard>

        {/* Reply Form */}
        <MagicCard variant="premium" size="lg">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <CornerUpRight className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Sua Resposta</h2>
            </div>

            <div className="space-y-4">
              <Textarea
                placeholder="Digite sua resposta aqui..."
                rows={6}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="bg-card/50 backdrop-blur-sm border-border/50 resize-none"
              />
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Sua resposta será pública e visível para todos os usuários
                </div>
                <Button
                  onClick={handleSubmitReply}
                  disabled={isSubmitting || !replyContent.trim()}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold transition-transform duration-300 hover:scale-105 hover:shadow-lg inline-flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CornerUpRight className="mr-2 h-4 w-4" />
                  )}
                  Publicar Resposta
                </Button>
              </div>
            </div>
          </div>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
