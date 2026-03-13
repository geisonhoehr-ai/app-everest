import { Eye, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useViewMode } from '@/contexts/view-mode-context'
import { useAuth } from '@/hooks/use-auth'

export function ViewAsStudentBanner() {
  const { viewingAsStudent, exitStudentView } = useViewMode()
  const { realRole } = useAuth()
  const navigate = useNavigate()

  if (!viewingAsStudent) return null

  const handleExit = () => {
    exitStudentView()
    // Redirect to admin dashboard based on real role
    if (realRole === 'administrator' || realRole === 'teacher') {
      navigate('/admin')
    }
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-primary px-4 py-2 text-primary-foreground text-sm">
      <Eye className="h-4 w-4" />
      <span className="font-medium">Visualizando como aluno</span>
      <Button
        size="sm"
        variant="secondary"
        className="h-7 px-3 text-xs"
        onClick={handleExit}
      >
        <X className="h-3 w-3 mr-1" />
        Voltar ao painel
      </Button>
    </div>
  )
}
