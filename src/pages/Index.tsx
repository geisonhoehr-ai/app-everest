import { HeroSection } from '@/components/landing/HeroSection'
import { CoursesSection } from '@/components/landing/CoursesSection'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

const Index = () => {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <CoursesSection />
        <TestimonialsSection />
        <PricingSection />
      </main>
      <Footer />
    </>
  )
}

export default Index
