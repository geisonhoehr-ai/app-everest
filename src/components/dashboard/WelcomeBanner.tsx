import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { MoveRight } from 'lucide-react'

export const WelcomeBanner = () => {
  const { profile } = useAuth()

  return (
    <Card className="bg-gradient-to-r from-primary to-orange-400 text-primary-foreground shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">
          Bem-vindo de volta, {profile?.first_name || 'Aluno'}!
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          "A persistência é o caminho do êxito." - Charles Chaplin. Continue com
          o ótimo trabalho!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="secondary" asChild>
          <a href="#">
            Continuar de onde parou
            <MoveRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
