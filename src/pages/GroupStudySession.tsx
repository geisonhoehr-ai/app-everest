import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { flashcardData } from '@/lib/flashcard-data'

const mockSession = {
  id: 'session123',
  flashcards: flashcardData[0].topics[0].flashcards,
  participants: [
    {
      name: 'João Pedro',
      avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=10',
      score: 0,
    },
    {
      name: 'Ana Clara',
      avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=5',
      score: 0,
    },
  ],
}

export default function GroupStudySessionPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [scores, setScores] = useState(
    mockSession.participants.map((p) => ({ ...p })),
  )

  const currentCard = mockSession.flashcards[currentIndex]
  const progress = ((currentIndex + 1) / mockSession.flashcards.length) * 100

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFlipped(true)
    }, 5000) // Flip after 5 seconds

    const nextCardTimer = setTimeout(() => {
      setIsFlipped(false)
      if (currentIndex < mockSession.flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // End of session
      }
    }, 10000) // Next card after 10 seconds

    return () => {
      clearTimeout(timer)
      clearTimeout(nextCardTimer)
    }
  }, [currentIndex])

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <Progress value={progress} />
          </CardHeader>
          <CardContent>
            <div className="w-full h-80 perspective-1000">
              <div
                className={cn(
                  'relative w-full h-full transition-transform duration-700 transform-style-preserve-3d',
                  { 'rotate-y-180': isFlipped },
                )}
              >
                <Card className="absolute w-full h-full backface-hidden flex items-center justify-center p-6">
                  <p className="text-3xl font-semibold text-center">
                    {currentCard.question}
                  </p>
                </Card>
                <Card className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center p-6 bg-muted">
                  <p className="text-2xl text-center">{currentCard.answer}</p>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            className="bg-red-100 text-red-700 hover:bg-red-200"
          >
            <ThumbsDown className="mr-2 h-5 w-5" /> Errei
          </Button>
          <Button
            variant="outline"
            className="bg-green-100 text-green-700 hover:bg-green-200"
          >
            <ThumbsUp className="mr-2 h-5 w-5" /> Acertei
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" /> Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {scores
              .sort((a, b) => b.score - a.score)
              .map((p, index) => (
                <li key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-bold w-6 text-center">
                      {index + 1}
                    </span>
                    <Avatar>
                      <AvatarImage src={p.avatar} />
                      <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{p.name}</span>
                  </div>
                  <span className="font-semibold">{p.score} pts</span>
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
