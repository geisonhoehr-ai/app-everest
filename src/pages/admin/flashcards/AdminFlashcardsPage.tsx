import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { flashcardData } from '@/lib/flashcard-data'
import { PlusCircle } from 'lucide-react'

export default function AdminFlashcardsPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciar Flashcards</CardTitle>
          <CardDescription>
            Gerencie as matérias e tópicos de flashcards.
          </CardDescription>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Matéria
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {flashcardData.map((subject) => (
          <Link to={`/admin/flashcards/${subject.id}`} key={subject.id}>
            <Card className="rounded-2xl border transition-all duration-200 min-h-[280px] hover:shadow-xl hover:-translate-y-2 hover:scale-102 cursor-pointer overflow-hidden flex flex-col h-full">
              <img
                src={subject.image}
                alt={subject.name}
                className="w-full h-32 object-cover"
              />
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-semibold text-lg flex-grow">
                  {subject.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {subject.topics.length} Tópicos
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
