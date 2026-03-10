import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PollCreatorProps {
  options: string[]
  onOptionsChange: (options: string[]) => void
}

const MIN_OPTIONS = 2
const MAX_OPTIONS = 6

export function PollCreator({ options, onOptionsChange }: PollCreatorProps) {
  const handleChange = (index: number, value: string) => {
    const updated = [...options]
    updated[index] = value
    onOptionsChange(updated)
  }

  const handleAdd = () => {
    if (options.length < MAX_OPTIONS) {
      onOptionsChange([...options, ''])
    }
  }

  const handleRemove = (index: number) => {
    if (options.length > MIN_OPTIONS) {
      onOptionsChange(options.filter((_, i) => i !== index))
    }
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-semibold text-foreground">Enquete</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={option}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={`Opcao ${index + 1}`}
              className="flex-1"
            />
            {options.length > MIN_OPTIONS && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => handleRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {options.length < MAX_OPTIONS && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Opcao
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
