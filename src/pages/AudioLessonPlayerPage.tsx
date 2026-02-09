import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { MagicLayout } from '@/components/ui/magic-layout'
import { MagicCard } from '@/components/ui/magic-card'
import { 
  ChevronLeft, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  SkipBack,
  SkipForward,
  Clock,
  Headphones
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { audioLessonService, type AudioLesson } from '@/services/audioLessonService'
import { useToast } from '@/hooks/use-toast'
import { SectionLoader } from '@/components/SectionLoader'

export default function AudioLessonPlayerPage() {
  const { audioId } = useParams<{ audioId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [audioLesson, setAudioLesson] = useState<AudioLesson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (!audioId) return

    const loadAudioLesson = async () => {
      try {
        setIsLoading(true)
        const lesson = await audioLessonService.getAudioLessonById(audioId)

        if (!lesson) {
          toast({
            title: 'Aula não encontrada',
            description: 'A aula de áudio que você está procurando não existe.',
            variant: 'destructive',
          })
          navigate('/evercast')
          return
        }

        setAudioLesson(lesson)
        
        // Incrementar contador de reproduções
        await audioLessonService.incrementListens(audioId)
      } catch (error) {
        console.error('Erro ao carregar aula de áudio:', error)
        toast({
          title: 'Erro ao carregar aula',
          description: 'Não foi possível carregar a aula de áudio.',
          variant: 'destructive',
        })
        navigate('/evercast')
      } finally {
        setIsLoading(false)
      }
    }

    loadAudioLesson()
  }, [audioId, navigate, toast])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioLesson) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      
      // Configurar Media Session API para controles na tela de bloqueio
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: audioLesson.title,
          artist: audioLesson.series || 'Everest',
          album: 'Evercast',
          artwork: [
            { src: audioLesson.thumbnail_url || '/logo.png', sizes: '96x96', type: 'image/png' },
            { src: audioLesson.thumbnail_url || '/logo.png', sizes: '128x128', type: 'image/png' },
            { src: audioLesson.thumbnail_url || '/logo.png', sizes: '192x192', type: 'image/png' },
            { src: audioLesson.thumbnail_url || '/logo.png', sizes: '256x256', type: 'image/png' },
            { src: audioLesson.thumbnail_url || '/logo.png', sizes: '384x384', type: 'image/png' },
            { src: audioLesson.thumbnail_url || '/logo.png', sizes: '512x512', type: 'image/png' },
          ]
        })

        // Configurar ações da Media Session
        navigator.mediaSession.setActionHandler('play', () => {
          audio.play()
          setIsPlaying(true)
        })

        navigator.mediaSession.setActionHandler('pause', () => {
          audio.pause()
          setIsPlaying(false)
        })

        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          const skipTime = details.seekOffset || 10
          audio.currentTime = Math.max(0, audio.currentTime - skipTime)
        })

        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          const skipTime = details.seekOffset || 10
          audio.currentTime = Math.min(duration, audio.currentTime + skipTime)
        })

        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            audio.currentTime = details.seekTime
          }
        })

        // Configurar posição do playback
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime
        })
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      
      // Atualizar posição na Media Session
      if ('mediaSession' in navigator && navigator.mediaSession.setPositionState) {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime
        })
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      // Atualizar estado da Media Session
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing'
      }
    }

    const handlePause = () => {
      setIsPlaying(false)
      // Atualizar estado da Media Session
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused'
      }
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [audioLesson, duration])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = parseFloat(e.target.value)
    audio.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const skipBackward = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.max(0, audio.currentTime - 10)
  }

  const skipForward = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.min(duration, audio.currentTime + 10)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return <SectionLoader />
  }

  if (!audioLesson) {
    return (
      <MagicLayout title="Aula não encontrada">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎧</div>
          <h2 className="text-2xl font-bold mb-2">Aula não encontrada</h2>
          <p className="text-muted-foreground mb-6">
            A aula de áudio que você está procurando não existe.
          </p>
          <Button onClick={() => navigate('/evercast')}>
            Voltar ao Evercast
          </Button>
        </div>
      </MagicLayout>
    )
  }

  return (
    <MagicLayout
      title={audioLesson.title}
      description={`Duração: ${audioLesson.duration_minutes} min • ${audioLesson.series}`}
      showHeader={false}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/evercast')}
            className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar ao Evercast
          </Button>
        </div>

        {/* Audio Player Card */}
        <MagicCard variant="premium" size="lg" className="p-8">
          <div className="space-y-8">
            {/* Lesson Info */}
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Headphones className="h-16 w-16 text-primary" />
              </div>
              
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-2">
                  {audioLesson.title}
                </h1>
                {audioLesson.series && (
                  <p className="text-lg text-muted-foreground">{audioLesson.series}</p>
                )}
                {audioLesson.description && (
                  <p className="text-muted-foreground mt-2">{audioLesson.description}</p>
                )}
              </div>
            </div>

            {/* Audio Element */}
            <audio
              ref={audioRef}
              src={audioLesson.audio_url}
              preload="metadata"
              className="hidden"
            />

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-6">
              <Button
                variant="outline"
                size="icon"
                onClick={skipBackward}
                className="h-12 w-12 rounded-full"
              >
                <SkipBack className="h-6 w-6" />
              </Button>

              <Button
                onClick={togglePlayPause}
                size="icon"
                className="h-16 w-16 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={skipForward}
                className="h-12 w-12 rounded-full"
              >
                <SkipForward className="h-6 w-6" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleMute}
                className="h-10 w-10 rounded-full"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              
              <div className="flex items-center space-x-2 w-32">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{audioLesson.duration_minutes} min</span>
              </div>
              <div className="flex items-center space-x-1">
                <Headphones className="h-4 w-4" />
                <span>{audioLesson.listens_count || 0} ouvintes</span>
              </div>
            </div>

            {/* Background Playback Info */}
            <div className="bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Background Playback Ativo</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                O áudio continuará tocando mesmo com a tela bloqueada. Use os controles na tela de bloqueio ou notificação.
              </p>
            </div>
          </div>
        </MagicCard>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </MagicLayout>
  )
}
