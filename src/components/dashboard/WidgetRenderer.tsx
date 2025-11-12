import { WIDGETS } from '@/lib/dashboard-config'
import { Skeleton } from '@/components/ui/skeleton'
import { Suspense } from 'react'

interface WidgetRendererProps {
  widgetId: string
}

export const WidgetRenderer = ({ widgetId }: WidgetRendererProps) => {
  const WidgetComponent = WIDGETS[widgetId]?.component

  if (!WidgetComponent) {
    return (
      <div className="p-4 border rounded-lg bg-destructive/10 text-destructive">
        Widget não encontrado: {widgetId}
      </div>
    )
  }

  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <WidgetComponent />
    </Suspense>
  )
}
