import { useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { 
  Home, 
  ArrowLeft, 
  Search, 
  AlertTriangle, 
  Compass,
  Sparkles,
  Zap
} from 'lucide-react'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error(
      '404 Error: User attempted to access non-existent route:',
      location.pathname,
    )
  }, [location.pathname])

  return (
    <MagicLayout 
      title="Página não encontrada"
      description="A página que você está procurando não existe ou foi movida"
      showHeader={false}
    >
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-8">
          {/* 404 Error Display */}
          <MagicCard variant="premium" size="lg" className="text-center py-16">
            <div className="space-y-8">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <AlertTriangle className="h-16 w-16 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-orange-600">4</span>
                  </div>
                  <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-orange-600">4</span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              <div className="space-y-4">
                <h1 className="text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Oops!
                </h1>
                <h2 className="text-2xl font-semibold text-foreground">
                  Página não encontrada
                </h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  A página que você está procurando não existe ou foi movida para outro local.
                </p>
                <div className="text-sm text-muted-foreground font-mono bg-muted/50 px-3 py-2 rounded-lg inline-block">
                  {location.pathname}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <Link to="/">
                    <Home className="mr-2 h-4 w-4" />
                    Voltar ao Início
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.history.back()}
                  className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Página Anterior
                </Button>
              </div>
            </div>
          </MagicCard>

          {/* Help Section */}
          <MagicCard variant="glass" size="lg">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Precisa de ajuda?</h3>
                <p className="text-muted-foreground">
                  Tente uma dessas opções para encontrar o que procura
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                  <Search className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Buscar</h4>
                  <p className="text-sm text-muted-foreground">
                    Use a busca para encontrar conteúdo
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                  <Compass className="h-8 w-8 text-green-500 mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Navegar</h4>
                  <p className="text-sm text-muted-foreground">
                    Explore as categorias principais
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                  <Sparkles className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Descobrir</h4>
                  <p className="text-sm text-muted-foreground">
                    Veja o que há de novo no sistema
                  </p>
                </div>
              </div>

              {/* Quick Links */}
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/courses">Cursos</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/quizzes">Quizzes</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/flashcards">Flashcards</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/essays">Redações</Link>
                </Button>
              </div>
            </div>
          </MagicCard>
        </div>
      </div>
    </MagicLayout>
  )
}

export default NotFound
