import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { communityService, type PollOption } from '@/services/communityService'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/lib/logger'

interface PollDisplayProps {
  postId: string
  options: PollOption[]
  onVote: () => void
}

export function PollDisplay({ postId, options, onVote }: PollDisplayProps) {
  const { getUserId } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const userId = getUserId()
  const totalVotes = options.reduce((sum, o) => sum + (o.votes_count || 0), 0)
  const hasVoted = options.some((o) => o.user_voted)

  const handleVote = async (option: PollOption) => {
    if (!userId || loading) return

    setLoading(option.id)
    try {
      if (option.user_voted) {
        await communityService.removePollVote(option.id, userId)
      } else {
        // Remove previous vote if any
        const previousVote = options.find((o) => o.user_voted)
        if (previousVote) {
          await communityService.removePollVote(previousVote.id, userId)
        }
        await communityService.votePoll(option.id, userId)
      }
      onVote()
    } catch (error) {
      logger.error('Failed to vote on poll', error)
      toast({ title: 'Erro ao votar', description: 'Tente novamente.', variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const percentage = totalVotes > 0 ? Math.round((option.votes_count / totalVotes) * 100) : 0

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => handleVote(option)}
            disabled={loading === option.id}
            className={cn(
              'relative w-full text-left rounded-lg border px-4 py-3 transition-all duration-200 overflow-hidden',
              option.user_voted
                ? 'border-primary/40 bg-primary/5'
                : 'border-border hover:border-primary/20 hover:shadow-sm',
              loading === option.id && 'opacity-60'
            )}
          >
            {/* Progress bar background */}
            {hasVoted && (
              <div
                className={cn(
                  'absolute inset-y-0 left-0 transition-all duration-500',
                  option.user_voted ? 'bg-primary/10' : 'bg-muted/50'
                )}
                style={{ width: `${percentage}%` }}
              />
            )}

            <div className="relative flex items-center justify-between">
              <span className={cn(
                'text-sm',
                option.user_voted ? 'font-medium text-foreground' : 'text-foreground'
              )}>
                {option.text}
              </span>
              {hasVoted && (
                <span className="text-sm font-medium text-muted-foreground ml-2 shrink-0">
                  {percentage}%
                </span>
              )}
            </div>
          </button>
        )
      })}

      <p className="text-xs text-muted-foreground text-center pt-1">
        {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
      </p>
    </div>
  )
}
