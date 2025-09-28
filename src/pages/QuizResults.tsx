import { useLocation, useParams } from 'react-router-dom'
import { quizData } from '@/lib/data'
import { QuizResult } from '@/components/quizzes/QuizResult'

export default function QuizResultsPage() {
  const { subjectId, topicId } = useParams<{
    subjectId: string
    topicId: string
  }>()
  const location = useLocation()
  const { answers } = location.state || { answers: {} }

  const subject = quizData.find((s) => s.id === subjectId)
  const topic = subject?.topics.find((t) => t.id === topicId)

  if (!topic) {
    return <div>Quiz não encontrado.</div>
  }

  return (
    <QuizResult
      answers={answers}
      topic={topic}
      retakeLink={`/quizzes/${subjectId}/${topicId}`}
      backLink={`/quizzes/${subjectId}`}
      backLinkText="Voltar aos Tópicos"
    />
  )
}
