import React from 'react'
import { ModernCard, ModernCardWithHeader, ModernStatsCard } from '@/components/ui/modern-card'
import { ModernButton, FloatingActionButton } from '@/components/ui/modern-button'
import { 
  AnimatedGradientBackground, 
  GlassCard, 
  FloatingParticles, 
  NeumorphicCard,
  Card3D 
} from '@/components/ui/visual-effects'
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Star, 
  Heart, 
  Plus,
  Settings,
  Bell,
  Download,
  Share2
} from 'lucide-react'

const ModernComponentsDemo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Componentes Modernos Inspirados no 21st.dev
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma coleção de componentes modernos com animações fluidas, gradientes sutis e micro-interações avançadas.
          </p>
        </div>

        {/* Cards Modernos */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold">Cards Modernos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card Padrão */}
            <ModernCard variant="default" hover glow>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Card Padrão</h3>
                <p className="text-muted-foreground">
                  Card com hover effect e glow sutil.
                </p>
                <ModernButton variant="primary" size="sm">
                  Ação
                </ModernButton>
              </div>
            </ModernCard>

            {/* Card com Gradiente */}
            <ModernCard variant="gradient" gradient="accent" hover>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Card Gradiente</h3>
                <p className="text-white/80">
                  Card com gradiente animado e efeitos visuais.
                </p>
                <ModernButton variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-gray-900">
                  Ação
                </ModernButton>
              </div>
            </ModernCard>

            {/* Card Glass */}
            <GlassCard className="p-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Glass Card</h3>
                <p className="text-muted-foreground">
                  Efeito glassmorphism com blur e transparência.
                </p>
                <ModernButton variant="ghost" size="sm">
                  Ação
                </ModernButton>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Cards com Header */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold">Cards com Header</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ModernCardWithHeader
              title="Meus Cursos"
              subtitle="Continue sua jornada de aprendizado"
              icon={<BookOpen className="w-5 h-5" />}
              action={<ModernButton variant="ghost" size="sm">Ver todos</ModernButton>}
              variant="elevated"
              hover
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">React Avançado</p>
                    <p className="text-sm text-muted-foreground">75% concluído</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">TypeScript</p>
                    <p className="text-sm text-muted-foreground">45% concluído</p>
                  </div>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </div>
            </ModernCardWithHeader>

            <ModernCardWithHeader
              title="Estatísticas"
              subtitle="Seu progresso esta semana"
              icon={<TrendingUp className="w-5 h-5" />}
              variant="gradient"
              gradient="success"
              hover
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">24h</div>
                  <div className="text-sm text-white/80">Estudadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">12</div>
                  <div className="text-sm text-white/80">Cursos</div>
                </div>
              </div>
            </ModernCardWithHeader>
          </div>
        </section>

        {/* Cards de Estatísticas */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold">Cards de Estatísticas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ModernStatsCard
              title="Total de Alunos"
              value="1,234"
              change={{ value: 12, type: 'increase' }}
              icon={<Users className="w-5 h-5" />}
              variant="elevated"
              hover
            />
            
            <ModernStatsCard
              title="Cursos Ativos"
              value="45"
              change={{ value: 5, type: 'increase' }}
              icon={<BookOpen className="w-5 h-5" />}
              variant="gradient"
              gradient="primary"
              hover
            />
            
            <ModernStatsCard
              title="Taxa de Conclusão"
              value="87%"
              change={{ value: 3, type: 'increase' }}
              icon={<TrendingUp className="w-5 h-5" />}
              variant="gradient"
              gradient="success"
              hover
            />
            
            <ModernStatsCard
              title="Avaliações"
              value="4.8"
              change={{ value: 0.2, type: 'increase' }}
              icon={<Star className="w-5 h-5" />}
              variant="gradient"
              gradient="warning"
              hover
            />
          </div>
        </section>

        {/* Botões Modernos */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold">Botões Modernos</h2>
          
          <div className="space-y-6">
            {/* Variantes de Botões */}
            <div className="flex flex-wrap gap-4">
              <ModernButton variant="primary" glow>Primário</ModernButton>
              <ModernButton variant="secondary">Secundário</ModernButton>
              <ModernButton variant="accent">Accent</ModernButton>
              <ModernButton variant="success">Sucesso</ModernButton>
              <ModernButton variant="warning">Aviso</ModernButton>
              <ModernButton variant="error">Erro</ModernButton>
              <ModernButton variant="outline">Outline</ModernButton>
              <ModernButton variant="ghost">Ghost</ModernButton>
              <ModernButton variant="gradient" gradient="accent">Gradiente</ModernButton>
            </div>

            {/* Tamanhos */}
            <div className="flex flex-wrap items-center gap-4">
              <ModernButton size="sm">Pequeno</ModernButton>
              <ModernButton size="md">Médio</ModernButton>
              <ModernButton size="lg">Grande</ModernButton>
              <ModernButton size="xl">Extra Grande</ModernButton>
            </div>

            {/* Botões com Ícones */}
            <div className="flex flex-wrap gap-4">
              <ModernButton icon={<Download className="w-4 h-4" />} iconPosition="left">
                Download
              </ModernButton>
              <ModernButton icon={<Share2 className="w-4 h-4" />} iconPosition="right">
                Compartilhar
              </ModernButton>
              <ModernButton loading>Carregando...</ModernButton>
            </div>

            {/* Floating Action Buttons */}
            <div className="flex gap-4">
              <FloatingActionButton
                icon={<Plus className="w-6 h-6" />}
                tooltip="Adicionar novo"
                variant="primary"
                glow
              />
              <FloatingActionButton
                icon={<Settings className="w-6 h-6" />}
                tooltip="Configurações"
                variant="secondary"
              />
              <FloatingActionButton
                icon={<Bell className="w-6 h-6" />}
                tooltip="Notificações"
                variant="accent"
              />
            </div>
          </div>
        </section>

        {/* Efeitos Visuais */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold">Efeitos Visuais</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Neumorphism */}
            <NeumorphicCard variant="raised" intensity="medium" className="p-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Neumorphism</h3>
                <p className="text-muted-foreground">
                  Efeito neumórfico com sombras suaves e elevação.
                </p>
              </div>
            </NeumorphicCard>

            {/* Card 3D */}
            <Card3D intensity={15}>
              <ModernCard variant="elevated" className="p-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Card 3D</h3>
                  <p className="text-muted-foreground">
                    Efeito 3D com rotação baseada no mouse.
                  </p>
                </div>
              </ModernCard>
            </Card3D>
          </div>
        </section>

        {/* Fundo com Gradiente Animado */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold">Fundo com Gradiente Animado</h2>
          
          <AnimatedGradientBackground 
            gradient="primary" 
            speed="slow"
            className="rounded-2xl p-8"
          >
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-white">Gradiente Animado</h3>
              <p className="text-white/80 max-w-md mx-auto">
                Fundo com gradiente animado e partículas flutuantes.
              </p>
              <ModernButton variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                Explorar
              </ModernButton>
            </div>
            <FloatingParticles count={15} size="sm" color="white" />
          </AnimatedGradientBackground>
        </section>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Inspirado nos componentes do{' '}
            <a 
              href="https://21st.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              21st.dev
            </a>
            {' '}com implementação personalizada para o Everest.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ModernComponentsDemo
