import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export interface TabItem {
  value: string
  label: string
  icon?: ReactNode
  count?: number
  content: ReactNode
}

interface PageTabsProps {
  tabs: TabItem[]
  value: string
  onChange: (value: string) => void
  className?: string
  /** 'auto' = fit content, 'full' = grid equal width, number = fixed grid cols */
  layout?: 'auto' | 'full' | number
}

export function PageTabs({ tabs, value, onChange, className, layout = 'auto' }: PageTabsProps) {
  const gridClass = layout === 'full'
    ? `grid grid-cols-${tabs.length}`
    : layout === 'auto'
    ? ''
    : `grid grid-cols-${layout}`

  return (
    <Tabs value={value} onValueChange={onChange} className={cn('w-full', className)}>
      <TabsList className={cn(
        layout === 'auto' ? '' : 'w-full max-w-md',
        gridClass
      )}>
        {tabs.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1 text-xs opacity-70">({tab.count})</span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map(tab => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
