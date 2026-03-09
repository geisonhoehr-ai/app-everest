import { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PictureInPicture2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

type PomodoroWidgetProps = {
  timerActive: boolean
  timerMode: 'study' | 'break'
  timeLeft: number
  currentTopic: string
  completedPomodoros: number
  onToggleTimer: () => void
  onResetTimer: () => void
  formatTime: (seconds: number) => string
}

// Check if Document PiP API is available
function isPipSupported(): boolean {
  return 'documentPictureInPicture' in window
}

// Mini timer rendered inside the PiP window
function MiniTimer({
  timerActive,
  timerMode,
  timeLeft,
  currentTopic,
  completedPomodoros,
  onToggleTimer,
  onSkip,
  formatTime,
}: {
  timerActive: boolean
  timerMode: 'study' | 'break'
  timeLeft: number
  currentTopic: string
  completedPomodoros: number
  onToggleTimer: () => void
  onSkip: () => void
  formatTime: (seconds: number) => string
}) {
  const isStudy = timerMode === 'study'
  const totalTime = isStudy ? 25 * 60 : (completedPomodoros % 4 === 0 && completedPomodoros > 0 ? 15 : 5) * 60
  const progress = ((totalTime - timeLeft) / totalTime) * 100

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: isStudy
          ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
          : 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
        color: 'white',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        boxSizing: 'border-box',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Mode label */}
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        opacity: 0.7,
        marginBottom: '4px',
      }}>
        {isStudy ? 'Estudando' : 'Pausa'}
      </div>

      {/* Time */}
      <div style={{
        fontSize: '42px',
        fontWeight: 800,
        lineHeight: 1,
        marginBottom: '6px',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {formatTime(timeLeft)}
      </div>

      {/* Progress bar */}
      <div style={{
        width: '80%',
        height: '4px',
        borderRadius: '2px',
        background: 'rgba(255,255,255,0.15)',
        marginBottom: '8px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          borderRadius: '2px',
          background: isStudy
            ? 'linear-gradient(90deg, #818cf8, #a78bfa)'
            : 'linear-gradient(90deg, #34d399, #6ee7b7)',
          transition: 'width 1s linear',
        }} />
      </div>

      {/* Topic */}
      {currentTopic && (
        <div style={{
          fontSize: '11px',
          opacity: 0.6,
          marginBottom: '8px',
          maxWidth: '90%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}>
          {currentTopic}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={onToggleTimer}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: 'white',
            padding: '6px 16px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
        >
          {timerActive ? '⏸ Pausar' : '▶ Iniciar'}
        </button>
        <button
          onClick={onSkip}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            color: 'white',
            padding: '6px 10px',
            fontSize: '12px',
            cursor: 'pointer',
            opacity: 0.7,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7' }}
          title="Resetar"
        >
          ↺
        </button>
      </div>

      {/* Pomodoro count */}
      <div style={{
        fontSize: '10px',
        opacity: 0.5,
        marginTop: '6px',
      }}>
        {completedPomodoros} pomodoros
      </div>
    </div>
  )
}

export function PomodoroWidget(props: PomodoroWidgetProps) {
  const {
    timerActive,
    timerMode,
    timeLeft,
    currentTopic,
    completedPomodoros,
    onToggleTimer,
    onResetTimer,
    formatTime,
  } = props

  const [pipWindow, setPipWindow] = useState<Window | null>(null)
  const pipContainerRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null)

  const isOpen = pipWindow !== null

  const openPip = useCallback(async () => {
    if (!isPipSupported()) return

    try {
      const pip = await (window as any).documentPictureInPicture.requestWindow({
        width: 280,
        height: 220,
      })

      // Style the PiP window
      const style = pip.document.createElement('style')
      style.textContent = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { overflow: hidden; }
      `
      pip.document.head.appendChild(style)

      // Create container
      const container = pip.document.createElement('div')
      container.id = 'pip-root'
      container.style.width = '100%'
      container.style.height = '100%'
      pip.document.body.appendChild(container)

      pipContainerRef.current = container
      rootRef.current = createRoot(container)

      pip.addEventListener('pagehide', () => {
        rootRef.current?.unmount()
        rootRef.current = null
        pipContainerRef.current = null
        setPipWindow(null)
      })

      setPipWindow(pip)
    } catch (err) {
      logger.error('Failed to open PiP:', err)
    }
  }, [])

  const closePip = useCallback(() => {
    if (pipWindow) {
      pipWindow.close()
      setPipWindow(null)
    }
  }, [pipWindow])

  // Re-render PiP content when props change
  useEffect(() => {
    if (!rootRef.current || !pipWindow) return

    rootRef.current.render(
      <MiniTimer
        timerActive={timerActive}
        timerMode={timerMode}
        timeLeft={timeLeft}
        currentTopic={currentTopic}
        completedPomodoros={completedPomodoros}
        onToggleTimer={onToggleTimer}
        onSkip={onResetTimer}
        formatTime={formatTime}
      />
    )
  }, [timerActive, timerMode, timeLeft, currentTopic, completedPomodoros, onToggleTimer, onResetTimer, formatTime, pipWindow])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pipWindow) {
        pipWindow.close()
      }
    }
  }, [])

  if (!isPipSupported()) return null

  return (
    <Button
      onClick={isOpen ? closePip : openPip}
      variant="outline"
      size="lg"
      className={cn(
        "sm:w-auto",
        isOpen && "border-primary text-primary"
      )}
      aria-label={isOpen ? 'Fechar mini-janela' : 'Abrir mini-janela flutuante'}
      title={isOpen ? 'Fechar mini-janela' : 'Estudar em mini-janela flutuante'}
    >
      {isOpen ? <X className="h-5 w-5" /> : <PictureInPicture2 className="h-5 w-5" />}
    </Button>
  )
}
