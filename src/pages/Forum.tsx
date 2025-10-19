import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  MoreHorizontal,
  Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionLoader } from '@/components/SectionLoader'

export default function ForumPage() {
  const [topics, setTopics] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulando carregamento
    setTimeout(() => {
      setIsLoading(false)
      // Por enquanto, sem dados - aguardando implementação da tabela forum_topics no banco
      setTopics([])
    }, 500)
  }, [])

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
                <div className="text-xl md:text-2xl font-bold text-blue-600">0</div>
                <div className="text-xs md:text-sm text-muted-foreground">Respostas</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-green-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-green-600">0</div>
                <div className="text-xs md:text-sm text-muted-foreground">Participantes</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-purple-600">0</div>
                <div className="text-xs md:text-sm text-muted-foreground">Categorias</div>
              </div>
              <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-orange-600">-</div>
                <div className="text-xs md:text-sm text-muted-foreground">Última Atividade</div>
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
              <Button className="flex-1 md:flex-none bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <PlusCircle className="mr-2 h-4 w-4" /> 
                <span className="hidden sm:inline">Novo Tópico</span>
                <span className="sm:hidden">Novo</span>
              </Button>
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
                  Fórum em Breve
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  O fórum de dúvidas está sendo preparado para você. Em breve você poderá criar tópicos, fazer perguntas e interagir com outros estudantes!
                </p>
                <Button disabled className="opacity-50 cursor-not-allowed">
                  <Lock className="mr-2 h-4 w-4" />
                  Em Desenvolvimento
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {topics.map((topic, index) => (
                <div
                  key={topic.id}
                  className="group p-6 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                >
                  <Link to={`/forum/${topic.id}`} className="block">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 border-2 border-border/50">
                        <AvatarImage src={topic.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {topic.author.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-grow space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                              {topic.title}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>por <span className="font-medium text-foreground">{topic.author}</span></span>
                              <span>•</span>
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium border",
                                getCategoryColor(topic.category)
                              )}>
                                {topic.category}
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
                              <span>{topic.replies} respostas</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>Última resposta {topic.lastReply}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.preventDefault()
                                // Handle like
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
                                // Handle share
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
              <div className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20 hover:border-blue-500/30 transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <PlusCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-blue-600">Criar Tópico</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Compartilhe suas dúvidas e ajude outros estudantes
                </p>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Tópico
                </Button>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20 hover:border-green-500/30 transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-600">Tópicos Populares</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Veja os tópicos mais comentados e relevantes
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Ver Populares
                </Button>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-purple-600/5 border border-purple-500/20 hover:border-purple-500/30 transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-purple-600">Comunidade</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Conecte-se com outros estudantes e professores
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Ver Comunidade
                </Button>
              </div>
            </div>
          </div>
        </MagicCard>
      </div>
    </MagicLayout>
  )
}
