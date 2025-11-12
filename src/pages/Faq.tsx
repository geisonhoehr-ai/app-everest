import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'Quais são as formas de pagamento aceitas?',
    answer:
      'Aceitamos as principais bandeiras de cartão de crédito (Visa, MasterCard, American Express) e Pix. O plano anual pode ser parcelado em até 12x sem juros.',
  },
  {
    question: 'Posso cancelar minha assinatura a qualquer momento?',
    answer:
      'Sim, você pode cancelar sua assinatura quando quiser. Para o plano mensal, o cancelamento impede a próxima cobrança. Para o plano anual, você pode solicitar o cancelamento e reembolso proporcional dentro dos primeiros 30 dias.',
  },
  {
    question: 'As aulas são ao vivo ou gravadas?',
    answer:
      'Oferecemos uma combinação de ambos! Temos um cronograma de aulas ao vivo com nossos professores especialistas, e todas as aulas ficam gravadas e disponíveis na plataforma para você assistir quando e onde quiser.',
  },
  {
    question: 'Como funciona a correção de redação?',
    answer:
      'No plano Everest Black, você pode enviar redações ilimitadas. Nossos corretores especializados analisam seu texto com base nos critérios dos principais vestibulares e concursos, fornecendo um feedback detalhado para sua evolução.',
  },
  {
    question: 'Tenho acesso a materiais de apoio?',
    answer:
      'Sim! Além das videoaulas, cada curso conta com materiais de apoio em PDF, listas de exercícios, flashcards e quizzes para reforçar o aprendizado.',
  },
]

export default function FaqPage() {
  return (
    <div className="bg-background">
      <div className="container py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Perguntas Frequentes
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Encontre aqui as respostas para as dúvidas mais comuns sobre a nossa
            plataforma.
          </p>
        </div>
        <Accordion
          type="single"
          collapsible
          className="w-full max-w-3xl mx-auto"
        >
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index + 1}`} key={index}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
