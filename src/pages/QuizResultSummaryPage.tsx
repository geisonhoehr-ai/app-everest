import { useLocation, useParams } from 'react-router-dom'
import { QuizResult } from '@/components/quizzes/QuizResult'

export default function QuizResultSummaryPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const location = useLocation()
  const { answers, topic } = location.state || { answers: {}, topic: null }

  if (!topic) {
    return <div>Resultados não encontrados.</div>
  }

  return (
    <QuizResult
      answers={answers}
      topic={topic}
      retakeLink={`/quiz/${quizId}`}
      backLink="/meus-cursos"
      backLinkText="Voltar aos Cursos"
    />
  )
}
