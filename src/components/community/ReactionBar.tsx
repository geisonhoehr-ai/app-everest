import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { communityService, type ReactionSummary } from '@/services/communityService'
import { logger } from '@/lib/logger'

const AVAILABLE_EMOJIS = [
  { emoji: '❤️', label: 'heart' },
  { emoji: '🔥', label: 'fire' },
  { emoji: '👏', label: 'clap' },
  { emoji: '🤔', label: 'thinking' },
  { emoji: '🚀', label: 'rocket' },
  { emoji: '👀', label: 'eyes' },
]

interface ReactionBarProps {
  targetType: 'post' | 'comment'
  targetId: string
  reactions: ReactionSummary[]
  onReactionChange: () => void
}

export function ReactionBar({ targetType, targetId, reactions, onReactionChange }: ReactionBarProps) {
  const { getUserId } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)

  const userId = getUserId()

  const handleToggle = async (emoji: string) => {
    if (!userId || loading) return
    setLoading(emoji)
    try {
      await communityService.toggleReaction(userId, targetType, targetId, emoji)
      onReactionChange()
    } catch (error) {
      logger.error('Failed to toggle reaction', error)
    } finally {
      setLoading(null)
    }
  }

  const reactionMap = new Map(reactions.map((r) => [r.emoji, r]))

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {AVAILABLE_EMOJIS.map(({ emoji, label }) => {
        const reaction = reactionMap.get(emoji)
        const count = reaction?.count ?? 0
        const reacted = reaction?.reacted ?? false

        return (
          <button
            key={label}
            type="button"
            onClick={() => handleToggle(emoji)}
            disabled={loading === emoji}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all duration-200 border',
              reacted
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted hover:border-border',
              loading === emoji && 'opacity-50'
            )}
          >
            <span className="text-sm">{emoji}</span>
            {count > 0 && <span className="font-medium">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}
