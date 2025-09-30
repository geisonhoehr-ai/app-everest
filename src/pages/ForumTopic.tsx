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
  User, 
  Star,
  Heart,
  Share2,
  BookOpen,
  Award,
  Users,
  TrendingUp,
  Reply,
  ThumbsUp,
  Flag
} from 'lucide-react'
import { cn } from '@/lib/utils'

const topicData = {
  id: 1,
  title: 'Dúvida sobre a Segunda Lei de Newton',
  author: 'Ana Clara',
  avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=5',
  timestamp: '2 dias atrás',
  category: 'Física',
  content:
    'Olá pessoal! Estou com uma dúvida sobre a aplicação da Segunda Lei de Newton (F=ma) em problemas que envolvem planos inclinados. Alguém poderia me dar uma luz ou indicar um bom material de estudo sobre isso? Agradeço desde já!',
  replies: [
    {
      author: 'Prof. Carlos',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=8',
      timestamp: '2 dias atrás',
      content:
        'Olá, Ana! Ótima pergunta. O segredo em planos inclinados é decompor a força peso (P) em duas componentes: Px (paralela ao plano) and Py (perpendicular ao plano). Px será P * sen(θ) e Py será P * cos(θ), onde θ é o ângulo de inclinação. A força resultante no eixo do movimento será F_res = Px - F_atrito. Espero que ajude!',
      isTeacher: true,
    },
    {
      author: 'Lucas Mendes',
      avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=6',
      timestamp: '1 dia atrás',
      content:
        'Valeu, professor! Essa dica da decomposição da força peso foi o que faltava pra eu entender. Consegui resolver as questões aqui. Obrigado, Ana, por criar o tópico!',
    },
  ],
}

export default function ForumTopicPage() {
  const { topicId } = useParams()

  return (
    <MagicLayout 
      title={topicData.title}
      description={`Tópico do fórum • ${topicData.category} • ${topicData.replies.length} respostas`}
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
                    {topicData.category}
                  </span>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {topicData.title}
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
                <AvatarImage src={topicData.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                  {topicData.author.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{topicData.author}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{topicData.timestamp}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Autor do tópico</p>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10 border border-border/50">
              <p className="text-foreground/90 leading-relaxed text-lg">
                {topicData.content}
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
                {topicData.replies.length} Respostas
              </h2>
            </div>

            <div className="space-y-6">
              {topicData.replies.map((reply, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-6 rounded-xl border transition-all duration-300",
                    reply.isTeacher 
                      ? "bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border-yellow-500/20" 
                      : "bg-gradient-to-r from-muted/20 to-muted/10 border-border/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border-2 border-border/50">
                      <AvatarImage src={reply.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {reply.author.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-grow space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{reply.author}</h3>
                          {reply.isTeacher && (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                              <Award className="h-3 w-3" />
                              PROFESSOR
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{reply.timestamp}</span>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
                        <p className="text-foreground/90 leading-relaxed">
                          {reply.content}
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
                className="bg-card/50 backdrop-blur-sm border-border/50 resize-none"
              />
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Sua resposta será pública e visível para todos os usuários
                </div>
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <CornerUpRight className="mr-2 h-4 w-4" />
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
