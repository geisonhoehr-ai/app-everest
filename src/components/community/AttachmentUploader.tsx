import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, Film, Music, ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { compressFiles } from '@/lib/fileCompression'

interface AttachmentUploaderProps {
  attachments: File[]
  onAttachmentsChange: (files: File[]) => void
  maxFiles?: number
}

const MAX_SIZE_IMAGE = 10 * 1024 * 1024 // 10MB
const MAX_SIZE_DOC = 25 * 1024 * 1024 // 25MB
const MAX_SIZE_VIDEO = 25 * 1024 * 1024 // 25MB
const MAX_SIZE_AUDIO = 5 * 1024 * 1024 // 5MB

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

function getMaxSize(mimeType: string): number {
  if (mimeType.startsWith('image/')) return MAX_SIZE_IMAGE
  if (mimeType.startsWith('video/')) return MAX_SIZE_VIDEO
  if (mimeType.startsWith('audio/')) return MAX_SIZE_AUDIO
  return MAX_SIZE_DOC
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(file: File) {
  if (file.type.startsWith('image/')) return ImageIcon
  if (file.type.startsWith('video/')) return Film
  if (file.type.startsWith('audio/')) return Music
  return FileText
}

export function AttachmentUploader({ attachments, onAttachmentsChange, maxFiles = 5 }: AttachmentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const validateAndAdd = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const remaining = maxFiles - attachments.length
    if (remaining <= 0) {
      toast({ title: 'Limite atingido', description: `Maximo de ${maxFiles} arquivos.`, variant: 'destructive' })
      return
    }

    const valid: File[] = []
    for (const file of fileArray.slice(0, remaining)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({ title: 'Tipo nao permitido', description: `${file.name}: tipo de arquivo nao suportado.`, variant: 'destructive' })
        continue
      }
      const maxSize = getMaxSize(file.type)
      if (file.size > maxSize) {
        toast({ title: 'Arquivo muito grande', description: `${file.name}: maximo ${formatFileSize(maxSize)}.`, variant: 'destructive' })
        continue
      }
      valid.push(file)
    }

    if (valid.length > 0) {
      setIsCompressing(true)
      try {
        const compressed = await compressFiles(valid)
        onAttachmentsChange([...attachments, ...compressed])
      } finally {
        setIsCompressing(false)
      }
    }
  }, [attachments, maxFiles, onAttachmentsChange, toast])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      validateAndAdd(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAdd(e.target.files)
      e.target.value = ''
    }
  }

  const handleRemove = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index)
    onAttachmentsChange(updated)
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/40'
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        {isCompressing ? (
          <>
            <Loader2 className="h-6 w-6 mx-auto mb-2 text-primary animate-spin" />
            <p className="text-sm text-primary font-medium">Comprimindo imagens...</p>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Arraste arquivos aqui ou <span className="text-primary font-medium">clique para selecionar</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Imagens, documentos, videos e audio ({attachments.length}/{maxFiles})
            </p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* File previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, index) => {
            const Icon = getFileIcon(file)
            const isImage = file.type.startsWith('image/')

            return (
              <div
                key={`${file.name}-${index}`}
                className="relative group rounded-lg border border-border overflow-hidden bg-muted/30"
              >
                {isImage ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-20 w-20 object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 flex flex-col items-center justify-center p-2">
                    <Icon className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-[10px] text-muted-foreground truncate max-w-full text-center">
                      {file.name}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
