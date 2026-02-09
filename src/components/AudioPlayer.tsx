import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AudioLesson } from '@/services/audioLessonService'

interface AudioPlayerProps {
    currentTrack: AudioLesson | null
    playlist: AudioLesson[]
    onTrackChange: (track: AudioLesson) => void
    onClose?: () => void
}

export function AudioPlayer({ currentTrack, playlist, onTrackChange, onClose }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)

    const audioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {
        if (currentTrack) {
            if (audioRef.current) {
                audioRef.current.src = currentTrack.audio_url
                audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => {
                    console.error("Autoplay failed", e)
                    setIsPlaying(false)
                })
            }
        }
    }, [currentTrack])

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
        const handleLoadedMetadata = () => setDuration(audio.duration)
        const handleEnded = () => {
            // Auto-play next track
            playNext()
        }

        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.addEventListener('loadedmetadata', handleLoadedMetadata)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate)
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [playlist, currentTrack])

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

    const handleSeek = (value: number[]) => {
        const audio = audioRef.current
        if (!audio) return
        audio.currentTime = value[0]
        setCurrentTime(value[0])
    }

    const handleVolumeChange = (value: number[]) => {
        const audio = audioRef.current
        if (!audio) return
        const newVol = value[0]
        audio.volume = newVol
        setVolume(newVol)
        setIsMuted(newVol === 0)
    }

    const playNext = () => {
        if (!currentTrack) return
        const currentIndex = playlist.findIndex(t => t.id === currentTrack.id)
        if (currentIndex < playlist.length - 1) {
            onTrackChange(playlist[currentIndex + 1])
        }
    }

    const playPrevious = () => {
        if (!currentTrack) return
        const currentIndex = playlist.findIndex(t => t.id === currentTrack.id)
        if (currentIndex > 0) {
            onTrackChange(playlist[currentIndex - 1])
        }
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    if (!currentTrack) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 h-24 flex items-center justify-between z-50">
            <audio ref={audioRef} />

            {/* Track Info */}
            <div className="flex items-center gap-4 w-1/3 min-w-[200px]">
                {currentTrack.thumbnail_url && (
                    <img
                        src={currentTrack.thumbnail_url}
                        alt={currentTrack.title}
                        className="h-16 w-16 rounded object-cover shadow-sm hidden md:block"
                    />
                )}
                <div className="flex flex-col truncate">
                    <span className="font-semibold truncate text-sm md:text-base">{currentTrack.title}</span>
                    <span className="text-xs text-muted-foreground truncate">{currentTrack.series || 'Everest'}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-2 w-1/3">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={playPrevious} disabled={!playlist.length}>
                        <SkipBack className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground rounded-full"
                        onClick={togglePlayPause}
                    >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={playNext} disabled={!playlist.length}>
                        <SkipForward className="h-5 w-5" />
                    </Button>
                </div>
                <div className="flex items-center gap-2 w-full max-w-md">
                    <span className="text-xs text-muted-foreground w-10 text-right">{formatTime(currentTime)}</span>
                    <Slider
                        value={[currentTime]}
                        max={duration || 100}
                        step={1}
                        onValueChange={handleSeek}
                        className="w-full"
                    />
                    <span className="text-xs text-muted-foreground w-10">{formatTime(duration)}</span>
                </div>
            </div>

            {/* Volume */}
            <div className="flex items-center justify-end gap-2 w-1/3 min-w-[150px]">
                <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="w-24"
                />
            </div>
        </div>
    )
}
