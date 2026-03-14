import { useState, useEffect, useCallback } from 'react'
import { getJobStatus, type Job } from '@/services/queueService'

interface JobStatusResult {
  job: Job | null
  loading: boolean
  isDone: boolean
  isFailed: boolean
}

export function useJobStatus(jobId: string | null, pollInterval = 5000): JobStatusResult {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(!!jobId)

  const fetchStatus = useCallback(async () => {
    if (!jobId) return
    const data = await getJobStatus(jobId)
    if (data) setJob(data)
    setLoading(false)
  }, [jobId])

  useEffect(() => {
    if (!jobId) {
      setJob(null)
      setLoading(false)
      return
    }

    setLoading(true)
    fetchStatus()

    // Poll while job is pending or processing
    const interval = setInterval(async () => {
      const data = await getJobStatus(jobId)
      if (data) {
        setJob(data)
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval)
        }
      }
    }, pollInterval)

    return () => clearInterval(interval)
  }, [jobId, pollInterval, fetchStatus])

  return {
    job,
    loading,
    isDone: job?.status === 'completed',
    isFailed: job?.status === 'failed',
  }
}
