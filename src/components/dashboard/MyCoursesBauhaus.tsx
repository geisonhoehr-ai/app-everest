import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { BauhausCard } from '@/components/ui/bauhaus-card'
import { dashboardService, Course } from '@/services/dashboardService'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export const MyCoursesBauhaus = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCourses = async () => {
      if (!user?.id) return
      
      try {
        const userCourses = await dashboardService.getUserCourses(user.id)
        setCourses(userCourses)
      } catch (error) {
        console.error('Erro ao carregar cursos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [user?.id])

  const handleContinueCourse = (courseId: string) => {
    navigate(`/cursos/${courseId}`)
  }

  const handleBookmarkCourse = (courseId: string) => {
    toast({
      title: "Curso favoritado!",
      description: "Este curso foi adicionado aos seus favoritos.",
    })
  }

  const handleMoreOptions = (courseId: string) => {
    toast({
      title: "Opções do curso",
      description: "Menu de opções em desenvolvimento.",
    })
  }

  // Cores de destaque para diferentes tipos de curso
  const getAccentColor = (index: number) => {
    const colors = ['#156ef6', '#24d200', '#fc6800', '#8f10f6', '#e91e63', '#00bcd4']
    return colors[index % colors.length]
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meus Cursos</CardTitle>
          <CardDescription>Continue sua jornada de aprendizado.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-64 bg-muted animate-pulse rounded-2xl" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus Cursos</CardTitle>
        <CardDescription>Continue sua jornada de aprendizado com nossos cards interativos.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.length > 0 ? (
          courses.map((course, index) => (
            <BauhausCard
              key={course.id}
              id={course.id}
              accentColor={getAccentColor(index)}
              backgroundColor="var(--bauhaus-card-bg)"
              separatorColor="var(--bauhaus-card-separator)"
              borderRadius="2em"
              borderWidth="2px"
              topInscription={`${course.progress}% concluído`}
              mainText={course.title}
              subMainText={course.description}
              progressBarInscription="Progresso:"
              progress={course.progress}
              progressValue={`${course.progress}%`}
              filledButtonInscription="Continuar"
              outlinedButtonInscription="Favoritar"
              onFilledButtonClick={handleContinueCourse}
              onOutlinedButtonClick={handleBookmarkCourse}
              onMoreOptionsClick={handleMoreOptions}
              mirrored={false}
              swapButtons={false}
              textColorTop="var(--bauhaus-card-inscription-top)"
              textColorMain="var(--bauhaus-card-inscription-main)"
              textColorSub="var(--bauhaus-card-inscription-sub)"
              textColorProgressLabel="var(--bauhaus-card-inscription-progress-label)"
              textColorProgressValue="var(--bauhaus-card-inscription-progress-value)"
              progressBarBackground="var(--bauhaus-card-progress-bar-bg)"
              chronicleButtonBg="var(--bauhaus-chronicle-bg)"
              chronicleButtonFg="var(--bauhaus-chronicle-fg)"
              chronicleButtonHoverFg="var(--bauhaus-chronicle-hover-fg)"
            />
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Nenhum curso encontrado.</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="ghost" className="w-full">
          <Link to="/meus-cursos">Ver todos os cursos</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
