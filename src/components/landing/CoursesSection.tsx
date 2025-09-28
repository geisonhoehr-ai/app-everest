import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const courses = [
  {
    title: 'Matemática para Concursos',
    description:
      'Domine os principais tópicos de matemática exigidos nos maiores concursos do país.',
    image: 'https://img.usecurling.com/p/400/250?q=mathematics%20formulas',
    tag: 'Exatas',
  },
  {
    title: 'Redação Nota Mil',
    description:
      'Aprenda a estruturar redações dissertativas-argumentativas e alcance a nota máxima.',
    image: 'https://img.usecurling.com/p/400/250?q=writing%20essay',
    tag: 'Linguagens',
  },
  {
    title: 'História do Brasil Completa',
    description:
      'Um curso aprofundado sobre todos os períodos da história brasileira, do descobrimento à atualidade.',
    image: 'https://img.usecurling.com/p/400/250?q=brazil%20history',
    tag: 'Humanas',
  },
]

export const CoursesSection = () => {
  return (
    <section id="cursos" className="py-16 md:py-24 bg-secondary">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Nossos Cursos em Destaque
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Conteúdo de alta qualidade para acelerar sua aprovação.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <Card
              key={course.title}
              className="rounded-2xl border transition-all duration-200 hover:shadow-xl hover:-translate-y-2 hover:scale-102 cursor-pointer overflow-hidden"
            >
              <CardHeader className="p-0">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
              </CardHeader>
              <CardContent className="p-6">
                <Badge variant="outline" className="mb-2">
                  {course.tag}
                </Badge>
                <CardTitle className="text-xl font-semibold mb-2 text-card-foreground">
                  {course.title}
                </CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
