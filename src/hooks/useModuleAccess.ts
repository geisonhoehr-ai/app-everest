import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export interface AccessResult {
  isAccessible: boolean
  rule: string
  message: string
  unlockDate?: Date
}

const DEFAULT_ACCESS: AccessResult = { isAccessible: true, rule: 'free', message: '' }

export function useModuleAccess(
  classId: string | null | undefined,
  moduleId: string
): AccessResult {
  const { user, profile } = useAuth()
  const [result, setResult] = useState<AccessResult>(DEFAULT_ACCESS)

  useEffect(() => {
    if (!user || !moduleId) {
      setResult(DEFAULT_ACCESS)
      return
    }

    // Unlimited access bypasses everything
    if ((profile as any)?.is_unlimited_access) {
      setResult({ isAccessible: true, rule: 'unlimited', message: '' })
      return
    }

    if (!classId) {
      setResult(DEFAULT_ACCESS)
      return
    }

    let cancelled = false

    async function checkAccess() {
      try {
        // Check enrollment expiration
        const { data: enrollment } = await supabase
          .from('student_classes')
          .select('enrollment_date, subscription_expires_at')
          .eq('user_id', user!.id)
          .eq('class_id', classId!)
          .maybeSingle()

        if (cancelled) return

        if (
          enrollment?.subscription_expires_at &&
          new Date(enrollment.subscription_expires_at) < new Date()
        ) {
          setResult({ isAccessible: false, rule: 'expired', message: 'Seu acesso expirou' })
          return
        }

        // Check module rule (no rule = free access)
        const { data: rule } = await supabase
          .from('class_module_rules')
          .select('*')
          .eq('class_id', classId!)
          .eq('module_id', moduleId)
          .maybeSingle()

        if (cancelled) return

        if (!rule || rule.rule_type === 'free') {
          setResult(DEFAULT_ACCESS)
          return
        }

        switch (rule.rule_type) {
          case 'hidden':
            setResult({ isAccessible: false, rule: 'hidden', message: '' })
            return

          case 'blocked':
            setResult({ isAccessible: false, rule: 'blocked', message: 'Conteudo bloqueado' })
            return

          case 'scheduled_date': {
            const date = new Date(rule.rule_value!)
            if (date <= new Date()) {
              setResult(DEFAULT_ACCESS)
              return
            }
            setResult({
              isAccessible: false,
              rule: 'scheduled_date',
              message: `Disponivel em ${date.toLocaleDateString('pt-BR')}`,
              unlockDate: date,
            })
            return
          }

          case 'days_after_enrollment': {
            if (!enrollment) {
              setResult(DEFAULT_ACCESS)
              return
            }
            const days = parseInt(rule.rule_value!)
            const enrollDate = new Date(enrollment.enrollment_date)
            const unlockDate = new Date(enrollDate.getTime() + days * 86400000)
            if (unlockDate <= new Date()) {
              setResult(DEFAULT_ACCESS)
              return
            }
            setResult({
              isAccessible: false,
              rule: 'days_after_enrollment',
              message: `Disponivel em ${unlockDate.toLocaleDateString('pt-BR')}`,
              unlockDate,
            })
            return
          }

          case 'module_completed': {
            const prereqModuleId = rule.rule_value!

            const { data: lessons } = await supabase
              .from('video_lessons')
              .select('id')
              .eq('module_id', prereqModuleId)
              .eq('is_active', true)

            if (cancelled) return

            if (!lessons || lessons.length === 0) {
              setResult(DEFAULT_ACCESS)
              return
            }

            const { count } = await supabase
              .from('lesson_progress')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user!.id)
              .eq('completed', true)
              .in(
                'lesson_id',
                lessons.map((l) => l.id)
              )

            if (cancelled) return

            if (count === lessons.length) {
              setResult(DEFAULT_ACCESS)
              return
            }

            const { data: prereqModule } = await supabase
              .from('video_modules')
              .select('name')
              .eq('id', prereqModuleId)
              .single()

            if (cancelled) return

            setResult({
              isAccessible: false,
              rule: 'module_completed',
              message: `Complete o modulo "${prereqModule?.name || ''}" primeiro`,
            })
            return
          }

          default:
            setResult(DEFAULT_ACCESS)
        }
      } catch {
        // On error, default to accessible to avoid blocking
        if (!cancelled) setResult(DEFAULT_ACCESS)
      }
    }

    checkAccess()

    return () => {
      cancelled = true
    }
  }, [user, profile, classId, moduleId])

  return result
}

export function useLessonAccess(
  classId: string | null | undefined,
  lessonId: string,
  moduleId: string
): AccessResult {
  const { user, profile } = useAuth()
  const moduleAccess = useModuleAccess(classId, moduleId)
  const [lessonResult, setLessonResult] = useState<AccessResult | null>(null)

  useEffect(() => {
    if (!user || !classId || !lessonId) {
      setLessonResult(null)
      return
    }

    if ((profile as any)?.is_unlimited_access) {
      setLessonResult(null)
      return
    }

    let cancelled = false

    async function checkLessonAccess() {
      try {
        const { data: rule } = await supabase
          .from('class_lesson_rules')
          .select('*')
          .eq('class_id', classId!)
          .eq('lesson_id', lessonId)
          .maybeSingle()

        if (cancelled) return

        // No lesson-specific rule = use module rule
        if (!rule || rule.rule_type === 'free') {
          setLessonResult(null)
          return
        }

        switch (rule.rule_type) {
          case 'hidden':
            setLessonResult({ isAccessible: false, rule: 'hidden', message: '' })
            return
          case 'blocked':
            setLessonResult({ isAccessible: false, rule: 'blocked', message: 'Aula bloqueada' })
            return
          case 'scheduled_date': {
            const date = new Date(rule.rule_value!)
            if (date <= new Date()) {
              setLessonResult(null)
              return
            }
            setLessonResult({
              isAccessible: false,
              rule: 'scheduled_date',
              message: `Disponivel em ${date.toLocaleDateString('pt-BR')}`,
              unlockDate: date,
            })
            return
          }
          default:
            setLessonResult(null)
        }
      } catch {
        if (!cancelled) setLessonResult(null)
      }
    }

    checkLessonAccess()

    return () => {
      cancelled = true
    }
  }, [user, profile, classId, lessonId])

  // Lesson rule takes priority over module rule
  return useMemo(() => lessonResult || moduleAccess, [lessonResult, moduleAccess])
}
