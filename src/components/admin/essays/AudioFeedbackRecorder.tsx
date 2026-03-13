import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, Square, Trash2, Play, Pause, Upload, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioFeedbackRecorderProps {
  audioUrl: string | null
  onSave: (audioUrl: string | null) => void
  onUpload: (file: Blob) => Promise<string>
  disabled?: boolean
}

export function AudioFeedbackRecorder({
  audioUrl,
  onSave,
  onUpload,
  disabled = false,
}: AudioFeedbackRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<number | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (recordedUrl) URL.revokeObjectURL(recordedUrl)
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [recordedUrl])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        const url = URL.createObjectURL(blob)
        setRecordedBlob(blob)
        setRecordedUrl(url)
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorder.start(100)
      setIsRecording(true)
      setDuration(0)
      setRecordedBlob(null)
      if (recordedUrl) URL.revokeObjectURL(recordedUrl)
      setRecordedUrl(null)

      timerRef.current = window.setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    } catch {
      // Permission denied or no microphone
    }
  }, [recordedUrl])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const togglePlayback = useCallback(() => {
    const url = recordedUrl || audioUrl
    if (!url) return

    if (!audioRef.current) {
      audioRef.current = new Audio(url)
      audioRef.current.onended = () => setIsPlaying(false)
      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0)
      }
      audioRef.current.onloadedmetadata = () => {
        setDuration(audioRef.current?.duration || 0)
      }
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [recordedUrl, audioUrl, isPlaying])

  const handleUpload = useCallback(async () => {
    if (!recordedBlob) return
    setIsUploading(true)
    try {
      const url = await onUpload(recordedBlob)
      onSave(url)
      setRecordedBlob(null)
    } finally {
      setIsUploading(false)
    }
  }, [recordedBlob, onUpload, onSave])

  const handleDelete = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
    setRecordedBlob(null)
    if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    setRecordedUrl(null)
    setDuration(0)
    setCurrentTime(0)
    onSave(null)
  }, [recordedUrl, onSave])

  const hasAudio = !!recordedUrl || !!audioUrl

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Mic className="h-4 w-4" />
          Feedback em Áudio
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex items-center gap-2">
          {/* Record button */}
          {!hasAudio && !isRecording && (
            <Button
              size="sm"
              variant="outline"
              onClick={startRecording}
              disabled={disabled}
              className="gap-1.5"
            >
              <Mic className="h-4 w-4 text-red-500" />
              Gravar
            </Button>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <span className="text-sm font-mono text-red-600 dark:text-red-400">
                  {formatTime(duration)}
                </span>
              </div>
              <Button size="sm" variant="destructive" onClick={stopRecording} className="gap-1.5">
                <Square className="h-3.5 w-3.5" />
                Parar
              </Button>
            </>
          )}

          {/* Playback controls */}
          {hasAudio && !isRecording && (
            <>
              <Button size="sm" variant="ghost" onClick={togglePlayback} className="gap-1.5">
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <span className="text-xs font-mono text-muted-foreground min-w-[70px]">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Upload button (only if recorded but not yet uploaded) */}
              {recordedBlob && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="gap-1.5"
                >
                  {isUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Salvar Áudio
                </Button>
              )}

              {/* Already saved indicator */}
              {audioUrl && !recordedBlob && (
                <span className="text-xs text-green-600 dark:text-green-400">Salvo</span>
              )}

              {/* Delete */}
              <Button size="sm" variant="ghost" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
