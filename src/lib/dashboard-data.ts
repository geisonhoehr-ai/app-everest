import {
  BookOpen,
  Layers,
  ListChecks,
  ClipboardCheck,
  Archive,
  Calendar,
  Radio,
  Users,
  type LucideProps,
} from 'lucide-react'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

export interface MockCourse {
  id: string
  title: string
  description: string
  progress: number
  image: string
}

export const mockCourses: MockCourse[] = [
  {
    id: 'matematica-para-concursos',
    title: 'Matemática para Concursos',
    description: 'Módulo de Álgebra Linear',
    progress: 75,
    image: 'https://img.usecurling.com/p/400/200?q=mathematics%20abstract',
  },
  {
    id: 'redacao-nota-mil',
    title: 'Redação Nota Mil',
    description: 'Estrutura dissertativa-argumentativa',
    progress: 40,
    image: 'https://img.usecurling.com/p/400/200?q=writing%20on%20paper',
  },
  {
    id: 'historia-do-brasil',
    title: 'História do Brasil',
    description: 'Período Colonial',
    progress: 90,
    image: 'https://img.usecurling.com/p/400/200?q=brazil%20colonial%20history',
  },
]

export interface MockEvent {
  title: string
  date: string
  type: 'exam' | 'deadline' | 'live'
}

export const mockEvents: MockEvent[] = [
  {
    title: 'Simulado Nacional de Humanas',
    date: '25 de Outubro, 14:00',
    type: 'exam',
  },
  {
    title: 'Entrega da Redação - Tema: IA',
    date: '27 de Outubro, 23:59',
    type: 'deadline',
  },
  {
    title: 'Aula ao vivo: Biologia Celular',
    date: '29 de Outubro, 19:00',
    type: 'live',
  },
]

export interface MockAdminStat {
  title: string
  value: string
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >
}

export const mockAdminStats: MockAdminStat[] = [
  { title: 'Cursos', value: '12', icon: BookOpen },
  { title: 'Flashcards', value: '25 Tópicos', icon: Layers },
  { title: 'Quizzes', value: '18 Tópicos', icon: ListChecks },
  { title: 'Simulados', value: '5', icon: ClipboardCheck },
  { title: 'Questões', value: '542', icon: Archive },
  { title: 'Eventos', value: '8', icon: Calendar },
  { title: 'Evercasts', value: '23', icon: Radio },
  { title: 'Alunos', value: '1,250', icon: Users },
]
