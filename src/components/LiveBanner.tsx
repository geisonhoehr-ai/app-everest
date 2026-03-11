import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getActiveLives, type LiveEvent } from '@/services/liveEventService'
import { supabase } from '@/lib/supabase/client'

export function LiveBanner() {
  const [activeLives, setActiveLives] = useState<LiveEvent[]>([])

  useEffect(() => {
    getActiveLives().then(setActiveLives)

    const channel = supabase
      .channel('live-events-status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_events' },
        () => {
          getActiveLives().then(setActiveLives)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (activeLives.length === 0) return null

  const live = activeLives[0]

  return (
    <div className="relative overflow-hidden rounded-lg border border-red-500/30 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <Radio className="h-5 w-5 text-red-500" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              Ao Vivo Agora{activeLives.length > 1 ? ` (${activeLives.length})` : ''}
            </p>
            <p className="text-xs text-muted-foreground">{live.title}</p>
          </div>
        </div>
        <Button size="sm" variant="destructive" asChild>
          <Link to={`/lives/${live.id}`}>Assistir Agora</Link>
        </Button>
      </div>
    </div>
  )
}
