import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MagicCard } from '@/components/ui/magic-card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Search, Lightbulb } from 'lucide-react'
import { questionBankData } from '@/lib/data'

export default function QuestionBankPage() {
  const [searchTerm, setSearchTerm] = useState('')
  // Add state for filters if needed

  const filteredQuestions = questionBankData.filter((q) =>
    q.question.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-6">
      <MagicCard>
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Banco de Questões</h1>
            <p className="text-muted-foreground">
              Filtre e estude com questões de provas anteriores.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por palavra-chave..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por Concurso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="enem">ENEM</SelectItem>
              <SelectItem value="fuvest">FUVEST</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por Matéria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="biologia">Biologia</SelectItem>
              <SelectItem value="historia">História</SelectItem>
            </SelectContent>
          </Select>
          </div>
        </div>
      </MagicCard>

      <div className="space-y-4">
        {filteredQuestions.map((q, index) => (
          <MagicCard key={q.id} led ledColor={index % 4 === 0 ? 'cyan' : index % 4 === 1 ? 'purple' : index % 4 === 2 ? 'orange' : 'green'}>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge>{q.source}</Badge>
                <Badge variant="secondary">{q.year}</Badge>
                <Badge variant="outline">{q.subject}</Badge>
              </div>
              <p className="text-foreground">{q.question}</p>
              
              <Accordion type="single" collapsible>
                <AccordionItem value="answer">
                  <AccordionTrigger>Ver Resposta e Explicação</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p>
                      <strong>Resposta Correta:</strong> {q.correctAnswer}
                    </p>
                    <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
                      <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <p className="text-sm">{q.explanation}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </MagicCard>
        ))}
      </div>
    </div>
  )
}
