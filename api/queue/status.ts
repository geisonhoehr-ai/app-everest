import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://hnhzindsfuqnaxosujay.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const jobId = req.query.jobId as string
  if (!jobId) {
    return res.status(400).json({ error: 'Missing jobId' })
  }

  const { data, error } = await supabase
    .from('job_queue')
    .select('id, type, status, result, attempts, created_at, completed_at')
    .eq('id', jobId)
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'Job not found' })
  }

  return res.status(200).json(data)
}
