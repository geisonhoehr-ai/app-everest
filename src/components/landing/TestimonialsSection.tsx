import { Check } from 'lucide-react'

const highlights = [
  'Acesso a todas as videoaulas até a data da prova',
  'Flashcards com repetição espaçada',
  'Simulados no formato oficial do concurso',
  'Correção de redações por especialistas',
  'Banco de questões com milhares de exercícios',
  'Ranking e gamificação para manter a motivação',
  'Plano de estudos personalizado com Pomodoro',
  'Acervo digital com provas anteriores',
  'Comunidade exclusiva de alunos',
  'Acesso pelo celular, tablet ou computador',
]

export const TestimonialsSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              O que está incluso
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Tudo isso em uma única plataforma, sem custos extras.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {highlights.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 p-4 rounded-xl bg-card border transition-colors hover:border-primary/30"
              >
                <div className="shrink-0 p-1 rounded-full bg-primary/10">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
