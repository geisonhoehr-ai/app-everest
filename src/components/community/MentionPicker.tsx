import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { communityService } from '@/services/communityService'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { Loader2 } from 'lucide-react'

interface MentionUser {
  id: string
  first_name: string
  last_name: string
  avatar_url?: string | null
}

interface MentionPickerProps {
  query: string
  onSelect: (user: { id: string; first_name: string; last_name: string }) => void
  visible: boolean
  position?: { top: number; left: number }
}

export function MentionPicker({ query, onSelect, visible, position }: MentionPickerProps) {
  const [users, setUsers] = useState<MentionUser[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!visible || query.length < 2) {
      setUsers([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const results = await communityService.searchUsers(query)
        setUsers(results as MentionUser[])
      } catch (error) {
        logger.error('Failed to search users for mention', error)
        setUsers([])
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query, visible])

  if (!visible || query.length < 2) return null

  return (
    <div
      className={cn(
        'absolute z-50 w-64 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg'
      )}
      style={position ? { top: position.top, left: position.left } : undefined}
    >
      {loading ? (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <div className="px-3 py-2 text-sm text-muted-foreground">
          Nenhum usuario encontrado
        </div>
      ) : (
        users.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => onSelect({ id: user.id, first_name: user.first_name, last_name: user.last_name })}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="text-[10px]">
                {(user.first_name?.[0] || '') + (user.last_name?.[0] || '')}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{user.first_name} {user.last_name}</span>
          </button>
        ))
      )}
    </div>
  )
}
