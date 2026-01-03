import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Mensal',
    price: 'R$ 29,90',
    period: '/mês',
    description: 'Ideal para quem quer experimentar a plataforma.',
    features: [
      'Acesso a todos os cursos',
      'Flashcards e quizzes',
      'Suporte por e-mail',
    ],
    isPopular: false,
  },
  {
    name: 'Anual',
    price: 'R$ 299,90',
    period: '/ano',
    description: 'O melhor custo-benefício para uma preparação completa.',
    features: [
      'Acesso a todos os cursos',
      'Flashcards e quizzes',
      'Aulas offline',
      'Simulados e provas',
      'Suporte prioritário',
    ],
    isPopular: true,
  },
  {
    name: 'Everest Black',
    price: 'R$ 499,90',
    period: '/ano',
    description:
      'Para quem busca a excelência e um acompanhamento personalizado.',
    features: [
      'Todos os benefícios do plano Anual',
      'Correção de redação ilimitada',
      'Sessões de mentoria',
      'Acesso antecipado a novos cursos',
    ],
    isPopular: false,
  },
]

export const PricingSection = () => {
  return (
    <section id="planos" className="py-16 md:py-24 bg-secondary">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Planos e Preços
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Escolha o plano que melhor se adapta à sua jornada de estudos.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                'flex flex-col bg-card rounded-2xl',
                plan.isPopular &&
                  'border-primary shadow-lg ring-2 ring-primary',
              )}
            >
              {plan.isPopular && (
                <div className="bg-primary text-primary-foreground text-center text-sm font-bold py-1.5 rounded-t-2xl">
                  MAIS POPULAR
                </div>
              )}
              <CardHeader className="pt-6">
                <CardTitle className="text-card-foreground">
                  {plan.name}
                </CardTitle>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-card-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span className="text-sm text-card-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.isPopular ? 'default' : 'outline'}
                >
                  Assinar agora
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
