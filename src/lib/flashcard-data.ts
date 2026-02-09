export interface Flashcard {
  id: string
  question: string
  answer: string
  external_resource_url?: string
}

export interface FlashcardTopic {
  id: string
  title: string
  cardCount: number
  flashcards: Flashcard[]
}

export interface FlashcardSubject {
  id: string
  name: string
  image: string
  description: string
  topics: FlashcardTopic[]
}

export const flashcardData: FlashcardSubject[] = [
  {
    id: 'historia',
    name: 'História',
    image: 'https://img.usecurling.com/p/400/200?q=history%20books',
    description:
      'Revise os principais eventos históricos do Brasil e do mundo.',
    topics: [
      {
        id: 'revolucao-francesa',
        title: 'Revolução Francesa',
        cardCount: 15,
        flashcards: [
          {
            id: 'rf-1',
            question: 'Qual foi o estopim da Revolução Francesa?',
            answer: 'A Queda da Bastilha em 14 de julho de 1789.',
          },
          {
            id: 'rf-2',
            question:
              'Quais eram os três estados na sociedade francesa pré-revolucionária?',
            answer:
              'Primeiro Estado (clero), Segundo Estado (nobreza) e Terceiro Estado (povo).',
          },
        ],
      },
    ],
  },
  {
    id: 'fisica',
    name: 'Física',
    image: 'https://img.usecurling.com/p/400/200?q=physics%20formulas',
    description: 'Domine as leis e fórmulas que regem o universo.',
    topics: [
      {
        id: 'cinematica',
        title: 'Fórmulas de Cinemática',
        cardCount: 5,
        flashcards: [
          {
            id: 'cin-1',
            question: 'Qual a fórmula da velocidade média?',
            answer: 'Vm = ΔS / Δt',
          },
        ],
      },
    ],
  },
]
