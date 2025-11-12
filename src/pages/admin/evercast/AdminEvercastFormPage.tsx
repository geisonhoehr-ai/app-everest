import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { logger } from '@/lib/logger'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/components/ui/use-toast'

const evercastSchema = z.object({
  title: z.string().min(3, 'O título é muito curto.'),
  series: z.string().min(3, 'O nome da série é muito curto.'),
  duration: z.string().min(1, 'A duração é obrigatória.'),
  audio_source_url: z
    .string()
    .url('Por favor, insira uma URL HLS válida.')
    .refine((url) => url.endsWith('.m3u8'), {
      message: 'A URL deve ser de um arquivo HLS e terminar com .m3u8',
    }),
})

type EvercastFormValues = z.infer<typeof evercastSchema>

export default function AdminEvercastFormPage() {
  const { evercastId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isEditing = !!evercastId

  const form = useForm<EvercastFormValues>({
    resolver: zodResolver(evercastSchema),
    defaultValues: {
      title: '',
      series: '',
      duration: '',
      audio_source_url: '',
    },
  })

  const onSubmit = (data: EvercastFormValues) => {
    const submissionData = {
      ...data,
      audio_source_type: 'panda_video_hls',
    }
    logger.debug(submissionData)
    toast({
      title: `Áudio-aula ${isEditing ? 'atualizada' : 'criada'} com sucesso!`,
    })
    navigate('/admin/evercast')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? 'Editar Áudio-aula' : 'Nova Áudio-aula'}
            </CardTitle>
            <CardDescription>
              Preencha os detalhes do Evercast usando uma URL HLS do Panda
              Video.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="series"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Série</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: 45 min" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="audio_source_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Áudio HLS (Panda Video)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://.../playlist.m3u8" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/evercast')}
          >
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  )
}
