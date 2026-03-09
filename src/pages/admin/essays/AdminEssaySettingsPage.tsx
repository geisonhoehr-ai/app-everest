import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CriteriaTemplateManagement } from '@/components/admin/essays/CriteriaTemplateManagement'
import { ErrorCategoryManagement } from '@/components/admin/essays/ErrorCategoryManagement'

export default function AdminEssaySettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/essays"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Configurações de Correção</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie os critérios de avaliação e categorias de erro
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <CriteriaTemplateManagement />
        <ErrorCategoryManagement />
      </div>
    </div>
  )
}
