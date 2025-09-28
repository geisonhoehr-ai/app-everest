import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'


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
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/components/ui/use-toast'
import { Trash, Users, Rocket, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const flashcardSetSchema = z.object({
  name: z.string().min(3, 'O nome do conjunto é muito curto.'),
  description: z.string().optional(),
  flashcards: z.array(
    z.object({
      question: z.string().min(1, 'A pergunta é obrigatória.'),
      answer: z.string().min(1, 'A resposta é obrigatória.'),
      external_resource_url: z
        .string()
        .url('URL inválida.')
        .optional()
        .or(z.literal('')),
    }),
  ),
})

type FormValues = z.infer<typeof flashcardSetSchema>

// Mock permission based on setId
const getPermissionForSet = (setId?: string) => {
  if (!setId) return 'owner' // Creating new set
  if (setId === 'set4') return 'viewer'
  if (setId === 'set3') return 'editor'
  return 'owner'
}

export default function FlashcardSetEditorPage() {
  const { setId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isEditing = !!setId
  const [permission, setPermission] = useState<'owner' | 'editor' | 'viewer'>(
    'owner',
  )

  useEffect(() => {
    const perm = getPermissionForSet(setId)
    setPermission(perm)
  }, [setId])

  const form = useForm<FormValues>({
    
    defaultValues: {
      name: '',
      description: '',
      flashcards: [{ question: '', answer: '', external_resource_url: '' }],
    },
    disabled: permission === 'viewer',
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'flashcards',
  })

  const onSubmit = (data: FormValues) => {
    console.log(data)
    toast({
      title: `Conjunto ${isEditing ? 'atualizado' : 'criado'} com sucesso!`,
    })
    navigate('/meus-conjuntos')
  }

  const isOwner = permission === 'owner'
  const canEdit = permission === 'owner' || permission === 'editor'

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {isEditing
              ? canEdit
                ? 'Editar Conjunto'
                : 'Visualizar Conjunto'
              : 'Criar Novo Conjunto'}
          </h1>
          <div className="flex gap-2">
            {isEditing && isOwner && (
              <Button variant="outline" asChild>
                <Link to={`/conjuntos/${setId}/colaboradores`}>
                  <Users className="mr-2 h-4 w-4" /> Gerenciar Colaboradores
                </Link>
              </Button>
            )}
            {canEdit && (
              <Button type="submit">
                <Rocket className="mr-2 h-4 w-4" /> Salvar Conjunto
              </Button>
            )}
          </div>
        </div>

        {permission === 'viewer' && (
          <Alert>
            <Eye className="h-4 w-4" />
            <AlertTitle>Modo de Visualização</AlertTitle>
            <AlertDescription>
              Você tem permissão apenas para visualizar este conjunto. Para
              editar, peça ao proprietário para alterar sua permissão.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Conjunto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Fórmulas de Física" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flashcards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="bg-muted/50 p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Card {index + 1}</h3>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`flashcards.${index}.question`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frente</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`flashcards.${index}.answer`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verso</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`flashcards.${index}.external_resource_url`}
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>URL Externa (Opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </Card>
            ))}
            {canEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    question: '',
                    answer: '',
                    external_resource_url: '',
                  })
                }
              >
                Adicionar Card
              </Button>
            )}
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
