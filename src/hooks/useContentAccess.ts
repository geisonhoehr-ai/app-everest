import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

interface ContentAccessResult {
  isRestricted: boolean
  allowedIds: string[]
  isAllowed: (id: string) => boolean
  loading: boolean
}

export function useContentAccess(contentType: string): ContentAccessResult {
  const { user, profile } = useAuth()
  const [allowedIds, setAllowedIds] = useState<string[]>([])
  const [isRestricted, setIsRestricted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchAccess() {
      // Unlimited access = no restrictions
      if ((profile as any)?.is_unlimited_access) {
        if (!cancelled) {
          setIsRestricted(false)
          setAllowedIds([])
          setLoading(false)
        }
        return
      }

      if (!user) {
        if (!cancelled) setLoading(false)
        return
      }

      try {
        // Get student's class IDs
        const { data: enrollments } = await supabase
          .from('student_classes')
          .select('class_id')
          .eq('user_id', user.id)

        if (!enrollments || enrollments.length === 0) {
          if (!cancelled) {
            setIsRestricted(false)
            setLoading(false)
          }
          return
        }

        const classIds = enrollments.map(e => e.class_id)

        // Get content access entries for all student's classes
        const { data: accessEntries } = await supabase
          .from('class_content_access')
          .select('content_id')
          .in('class_id', classIds)
          .eq('content_type', contentType)

        if (!cancelled) {
          if (!accessEntries || accessEntries.length === 0) {
            // No restrictions for this content type
            setIsRestricted(false)
            setAllowedIds([])
          } else {
            // Merge allowed IDs from all classes (union)
            const ids = [...new Set(accessEntries.map(e => e.content_id))]
            setIsRestricted(true)
            setAllowedIds(ids)
          }
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setIsRestricted(false)
          setLoading(false)
        }
      }
    }

    setLoading(true)
    fetchAccess()

    return () => { cancelled = true }
  }, [user, profile, contentType])

  const isAllowed = useCallback(
    (id: string) => !isRestricted || allowedIds.includes(id),
    [isRestricted, allowedIds]
  )

  return useMemo(
    () => ({ isRestricted, allowedIds, isAllowed, loading }),
    [isRestricted, allowedIds, isAllowed, loading]
  )
}
