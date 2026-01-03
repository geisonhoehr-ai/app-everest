export interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: string
}

export interface QuizTopic {
  id: string
  title: string
  questionCount: number
  questions: QuizQuestion[]
}

export interface QuizSubject {
  id: string
  name: string
  image: string
  description: string
  topics: QuizTopic[]
}

export const quizData: QuizSubject[] = [
  {
    id: 'quimica',
    name: 'Química',
    image: 'https://img.usecurling.com/p/400/200?q=chemistry%20lab',
    description:
      'Teste seus conhecimentos em reações, elementos e compostos químicos.',
    topics: [
      {
        id: 'termoquimica',
        title: 'Quiz de Termoquímica',
        questionCount: 3,
        questions: [
          {
            id: 1,
            question: 'Uma reação que libera calor é chamada de:',
            options: ['Endotérmica', 'Exotérmica', 'Isotérmica', 'Adiabática'],
            correctAnswer: 'Exotérmica',
          },
          {
            id: 2,
            question: 'O que a entalpia (H) mede?',
            options: [
              'A energia cinética das moléculas',
              'A temperatura de um sistema',
              'O calor de uma reação a pressão constante',
              'A velocidade de uma reação',
            ],
            correctAnswer: 'O calor de uma reação a pressão constante',
          },
          {
            id: 3,
            question:
              'De acordo com a Lei de Hess, a variação de entalpia de uma reação depende apenas de:',
            options: [
              'Do caminho da reação',
              'Dos estados inicial e final',
              'Do catalisador utilizado',
              'Da temperatura ambiente',
            ],
            correctAnswer: 'Dos estados inicial e final',
          },
        ],
      },
    ],
  },
  {
    id: 'portugues',
    name: 'Português',
    image: 'https://img.usecurling.com/p/400/200?q=literature%20books',
    description:
      'Aprimore sua gramática, interpretação de texto e conhecimentos de literatura.',
    topics: [
      {
        id: 'analise-sintatica',
        title: 'Quiz de Análise Sintática',
        questionCount: 2,
        questions: [
          {
            id: 1,
            question: 'Na frase "O menino comprou um livro", qual é o sujeito?',
            options: ['O menino', 'comprou', 'um livro', 'livro'],
            correctAnswer: 'O menino',
          },
          {
            id: 2,
            question:
              'Qual o predicado da frase "As flores do campo são bonitas"?',
            options: ['As flores', 'do campo', 'são bonitas', 'flores'],
            correctAnswer: 'são bonitas',
          },
        ],
      },
    ],
  },
]

export interface QuestionBankQuestion {
  id: number
  source: string
  year: number
  subject: string
  topic: string
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

export const questionBankData: QuestionBankQuestion[] = [
  {
    id: 1,
    source: 'ENEM',
    year: 2023,
    subject: 'Biologia',
    topic: 'Ecologia',
    question:
      'A poluição por plásticos nos oceanos representa uma grave ameaça aos ecossistemas marinhos. Uma das consequências diretas é a ingestão de microplásticos por organismos filtradores, que podem acumular essas partículas em seus tecidos. Esse processo é conhecido como:',
    options: [
      'Biomagnificação',
      'Bioacumulação',
      'Eutrofização',
      'Acidificação',
    ],
    correctAnswer: 'Bioacumulação',
    explanation:
      'Bioacumulação é o processo de acúmulo de substâncias químicas em um organismo, que ocorre quando a taxa de absorção da substância é maior que a taxa de eliminação. A biomagnificação, por outro lado, é o acúmulo progressivo ao longo da cadeia alimentar.',
  },
  {
    id: 2,
    source: 'FUVEST',
    year: 2024,
    subject: 'História',
    topic: 'Brasil Colônia',
    question:
      'A Inconfidência Mineira, ocorrida em 1789, foi um movimento de caráter emancipacionista que tinha como um de seus principais objetivos:',
    options: [
      'A abolição imediata da escravidão',
      'A proclamação de uma república independente na região das Minas Gerais',
      'A expulsão dos jesuítas do território brasileiro',
      'A coroação de um imperador nascido no Brasil',
    ],
    correctAnswer:
      'A proclamação de uma república independente na região das Minas Gerais',
    explanation:
      'A Inconfidência Mineira foi um movimento da elite de Minas Gerais que, inspirada pelos ideais iluministas e pela independência dos EUA, planejava romper com o domínio português e estabelecer uma república na capitania, embora não houvesse consenso sobre a abolição da escravidão.',
  },
]
