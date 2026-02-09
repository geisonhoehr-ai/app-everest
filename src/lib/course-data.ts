export interface Attachment {
  id: string
  name: string
  url: string
  type: 'pdf' | 'docx' | 'png'
}

export interface Lesson {
  id: string
  title: string
  duration: string
  videoUrl: string
  isCompleted: boolean
  attachments: Attachment[]
  accompanyingPdfId?: string
}

export interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

export interface Course {
  id: string
  title: string
  description: string
  image: string
  modules: Module[]
}

export const courseData: Course = {
  id: 'matematica-para-concursos',
  title: 'Matemática para Concursos',
  description:
    'Domine os principais tópicos de matemática exigidos nos maiores concursos do país, desde a aritmética básica até a geometria complexa.',
  image: 'https://img.usecurling.com/p/800/400?q=mathematics%20abstract',
  modules: [
    {
      id: 'modulo-1',
      title: 'Módulo 1: Fundamentos da Aritmética',
      lessons: [
        {
          id: 'licao-101',
          title: 'Introdução às Operações Básicas',
          duration: '12:35',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          isCompleted: true,
          attachments: [
            {
              id: 'att-1',
              name: 'Resumo_Aritmetica.pdf',
              url: '/resumo.pdf',
              type: 'pdf',
            },
            {
              id: 'att-2',
              name: 'Exercicios_Aritmetica.docx',
              url: '/exercicios.docx',
              type: 'docx',
            },
          ],
          accompanyingPdfId: 'att-1',
        },
        {
          id: 'licao-102',
          title: 'Frações e Decimais',
          duration: '15:50',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          isCompleted: true,
          attachments: [],
        },
        {
          id: 'licao-103',
          title: 'Porcentagem e Juros Simples',
          duration: '18:20',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          isCompleted: false,
          attachments: [
            {
              id: 'att-3',
              name: 'Tabela_Juros.pdf',
              url: '/resumo.pdf',
              type: 'pdf',
            },
          ],
        },
      ],
    },
    {
      id: 'modulo-2',
      title: 'Módulo 2: Álgebra Essencial',
      lessons: [
        {
          id: 'licao-201',
          title: 'Equações de Primeiro Grau',
          duration: '22:10',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          isCompleted: false,
          attachments: [],
        },
        {
          id: 'licao-202',
          title: 'Sistemas de Equações',
          duration: '25:00',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          isCompleted: false,
          attachments: [],
        },
      ],
    },
  ],
}
