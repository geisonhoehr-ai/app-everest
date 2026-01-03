import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { PandaVideoPickerModal } from './PandaVideoPickerModal'
import { useState } from 'react'
import { type PandaVideo } from '@/services/pandaVideo'
import { Video, Upload, Trash2, Star, ListChecks, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { QuizPickerModal } from './QuizPickerModal'
import { type Quiz } from '@/services/quizService'

interface Attachment {
  id: string
  name: string
  type: 'pdf' | 'doc' | 'image' | string
}

interface LessonFormProps {
  moduleIndex: number
  lessonIndex: number
}

export const LessonForm = ({ moduleIndex, lessonIndex }: LessonFormProps) => {
  const { control, setValue, watch } = useFormContext()
  const [isVideoPickerOpen, setIsVideoPickerOpen] = useState(false)
  const [isQuizPickerOpen, setIsQuizPickerOpen] = useState(false)
  const { toast } = useToast()

  const videoSourceId = watch(
    `modules.${moduleIndex}.lessons.${lessonIndex}.video_source_id`,
  )
  const attachments =
    watch(`modules.${moduleIndex}.lessons.${lessonIndex}.attachments`) || [] as Attachment[]
  const accompanyingPdfId = watch(
    `modules.${moduleIndex}.lessons.${lessonIndex}.accompanyingPdfId`,
  )
  const associatedQuiz = watch(
    `modules.${moduleIndex}.lessons.${lessonIndex}.quiz`,
  )

  const handleVideoSelect = (video: PandaVideo) => {
    setValue(
      `modules.${moduleIndex}.lessons.${lessonIndex}.video_source_id`,
      video.id,
    )
    setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.title`, video.title)
    setValue(
      `modules.${moduleIndex}.lessons.${lessonIndex}.duration_seconds`,
      video.duration,
    )
    setValue(
      `modules.${moduleIndex}.lessons.${lessonIndex}.video_source_type`,
      'panda_video',
    )
  }

  const handleQuizSelect = (quiz: Quiz) => {
    setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.quiz`, {
      id: quiz.id,
      title: quiz.title,
    })
  }

  const removeQuiz = () => {
    setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.quiz`, undefined)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é 50MB.',
        variant: 'destructive',
      })
      return
    }

    try {
      toast({
        title: 'Upload iniciado',
        description: `${file.name} está sendo enviado.`,
      })

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const filePath = `attachments/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('course_materials')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('course_materials')
        .getPublicUrl(filePath)

      const newAttachment = {
        id: `att_${Date.now()}`,
        name: file.name,
        url: publicUrl,
        type: file.type.includes('pdf') ? 'pdf' : 'docx', // This simple check remains, can be improved
        file_path: filePath // Store path for reference
      }

      setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.attachments`, [
        ...attachments,
        newAttachment,
      ])

      toast({
        title: 'Upload concluído',
        description: 'Arquivo enviado com sucesso.',
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível enviar o arquivo.',
        variant: 'destructive',
      })
    }
  }

  const setAccompanyingPdf = (attachmentId: string) => {
    setValue(
      `modules.${moduleIndex}.lessons.${lessonIndex}.accompanyingPdfId`,
      attachmentId,
    )
  }

  return (
    <>
      <PandaVideoPickerModal
        isOpen={isVideoPickerOpen}
        onOpenChange={setIsVideoPickerOpen}
        onVideoSelect={handleVideoSelect}
      />
      <QuizPickerModal
        isOpen={isQuizPickerOpen}
        onOpenChange={setIsQuizPickerOpen}
        onQuizSelect={handleQuizSelect}
      />
      <div className="space-y-4">
        <FormField
          control={control}
          name={`modules.${moduleIndex}.lessons.${lessonIndex}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título da Aula</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`modules.${moduleIndex}.lessons.${lessonIndex}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormLabel>Vídeo</FormLabel>
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVideoPickerOpen(true)}
              >
                <Video className="mr-2 h-4 w-4" />
                {videoSourceId ? 'Alterar Vídeo' : 'Selecionar Vídeo'}
              </Button>
              {videoSourceId && (
                <p className="text-sm text-muted-foreground mt-2">
                  ID: {videoSourceId}
                </p>
              )}
            </div>
          </div>
          <div>
            <FormLabel>Quiz Pós-Aula</FormLabel>
            <div className="mt-2">
              {associatedQuiz ? (
                <div className="flex items-center justify-between p-2 border rounded-md text-sm">
                  <p className="truncate">{associatedQuiz.title}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeQuiz}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQuizPickerOpen(true)}
                >
                  <ListChecks className="mr-2 h-4 w-4" />
                  Associar Quiz
                </Button>
              )}
            </div>
          </div>
        </div>
        <div>
          <FormLabel>Materiais de Apoio</FormLabel>
          <div className="mt-2 space-y-2">
            {attachments.map((att: Attachment) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <p className="text-sm">{att.name}</p>
                <div className="flex items-center gap-1">
                  {att.type === 'pdf' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setAccompanyingPdf(att.id)}
                    >
                      <Star
                        className={`h-4 w-4 ${accompanyingPdfId === att.id
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-muted-foreground'
                          }`}
                      />
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" asChild>
              <label>
                <Upload className="mr-2 h-4 w-4" />
                Adicionar Arquivo
                <Input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </Button>
            {attachments.some((a: Attachment) => a.type === 'pdf') && (
              <p className="text-xs text-muted-foreground">
                Clique na estrela <Star className="inline h-3 w-3" /> para
                definir o PDF de acompanhamento.
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-8">
          <FormField
            control={control}
            name={`modules.${moduleIndex}.lessons.${lessonIndex}.is_active`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Ativa</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`modules.${moduleIndex}.lessons.${lessonIndex}.is_preview`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Prévia Gratuita</FormLabel>
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  )
}
