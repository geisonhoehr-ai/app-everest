import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { mockCourses } from '@/lib/dashboard-data'
import { Link } from 'react-router-dom'

export const MyCourses = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus Cursos</CardTitle>
        <CardDescription>Continue sua jornada de aprendizado.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mockCourses.map((course) => (
          <Card
            key={course.title}
            className="rounded-2xl border transition-all duration-200 hover:shadow-xl hover:-translate-y-2 hover:scale-102 cursor-pointer overflow-hidden flex flex-col"
          >
            <img
              src={course.image}
              alt={course.title}
              className="w-full h-32 object-cover"
            />
            <div className="p-6 flex flex-col flex-grow">
              <h3 className="font-semibold text-md flex-grow">
                {course.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {course.description}
              </p>
              <div className="flex items-center gap-3 mb-4">
                <Progress value={course.progress} className="w-full" />
                <span className="text-sm font-medium">{course.progress}%</span>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full mt-auto"
              >
                <Link to={`/meus-cursos/${course.id}`}>Continuar</Link>
              </Button>
            </div>
          </Card>
        ))}
      </CardContent>
      <CardFooter>
        <Button asChild variant="ghost" className="w-full">
          <Link to="/meus-cursos">Ver todos os cursos</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
