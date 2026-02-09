import { useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Star } from 'lucide-react'
import Autoplay from 'embla-carousel-autoplay'

const testimonials = [
  {
    name: 'Juliana Silva',
    title: 'Aprovada em Medicina',
    quote:
      'A Everest foi fundamental na minha aprovação. A metodologia com flashcards e os simulados fizeram toda a diferença. Recomendo de olhos fechados!',
    avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=1',
  },
  {
    name: 'Carlos Pereira',
    title: 'Aprovado em Direito',
    quote:
      'Nunca pensei que estudar pudesse ser tão organizado. O calendário e o acompanhamento de progresso me mantiveram focado e motivado até o dia da prova.',
    avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=2',
  },
  {
    name: 'Fernanda Costa',
    title: 'Aprovada em Engenharia',
    quote:
      'As aulas offline me salvaram! Conseguia estudar no ônibus, na fila do banco... em qualquer lugar. A flexibilidade da plataforma é incrível.',
    avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=3',
  },
]

export const TestimonialsSection = () => {
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }))

  return (
    <section id="depoimentos" className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            O que nossos alunos dizem
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Histórias de sucesso que nos inspiram a continuar.
          </p>
        </div>
        <Carousel
          plugins={[plugin.current]}
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          opts={{ loop: true }}
          className="w-full max-w-4xl mx-auto"
        >
          <CarouselContent>
            {testimonials.map((testimonial) => (
              <CarouselItem key={testimonial.name}>
                <div className="p-2">
                  <Card className="rounded-2xl">
                    <CardContent className="p-8 flex flex-col items-center text-center">
                      <Avatar className="w-20 h-20 mb-4">
                        <AvatarImage
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          loading="lazy"
                        />
                        <AvatarFallback>
                          {testimonial.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex gap-1 text-yellow-400 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-current" />
                        ))}
                      </div>
                      <p className="text-lg font-medium mb-4">
                        "{testimonial.quote}"
                      </p>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.title}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  )
}
