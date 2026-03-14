import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Supabase admin client (service role)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://hnhzindsfuqnaxosujay.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Verify QStash signature
function verifySignature(req: VercelRequest): boolean {
  const signature = req.headers['upstash-signature'] as string
  if (!signature) return false

  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY
  const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY

  if (!currentKey && !nextKey) return false

  const body = JSON.stringify(req.body)

  // Try current key
  if (currentKey) {
    const expected = crypto.createHmac('sha256', currentKey).update(body).digest('base64')
    if (signature === expected) return true
  }

  // Try next key (for key rotation)
  if (nextKey) {
    const expected = crypto.createHmac('sha256', nextKey).update(body).digest('base64')
    if (signature === expected) return true
  }

  return false
}

async function processEssayCorrection(jobId: string, payload: any) {
  // Update job status to processing
  await supabase.from('job_queue').update({
    status: 'processing',
    started_at: new Date().toISOString(),
    attempts: payload.attempts || 1
  }).eq('id', jobId)

  // Check circuit breaker
  const { data: cb } = await supabase
    .from('circuit_breaker_state')
    .select('*')
    .eq('service', 'gemini-ai')
    .single()

  if (cb?.state === 'open') {
    // Check if enough time has passed to go half-open (5 minutes)
    const openedAt = new Date(cb.opened_at).getTime()
    if (Date.now() - openedAt < 5 * 60 * 1000) {
      await supabase.from('job_queue').update({
        status: 'pending', // Put back in queue
        result: { error: 'Circuit breaker open - Gemini AI temporarily unavailable' }
      }).eq('id', jobId)
      return
    }
    // Go half-open
    await supabase.from('circuit_breaker_state').update({
      state: 'half-open',
      updated_at: new Date().toISOString()
    }).eq('service', 'gemini-ai')
  }

  try {
    // Call the existing Supabase Edge Function for AI correction
    const response = await fetch(`${supabaseUrl}/functions/v1/ai-essay-correction`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        essayId: payload.essay_id,
        submissionText: payload.submission_text,
        promptId: payload.prompt_id,
      }),
    })

    if (!response.ok) throw new Error(`AI correction failed: ${response.status}`)

    const result = await response.json()

    // Success - update job and circuit breaker
    await supabase.from('job_queue').update({
      status: 'completed',
      result,
      completed_at: new Date().toISOString()
    }).eq('id', jobId)

    // Reset circuit breaker on success
    await supabase.from('circuit_breaker_state').update({
      state: 'closed',
      failure_count: 0,
      updated_at: new Date().toISOString()
    }).eq('service', 'gemini-ai')

  } catch (error: any) {
    // Failure - update circuit breaker
    const newFailureCount = (cb?.failure_count || 0) + 1
    const newState = newFailureCount >= 3 ? 'open' : cb?.state || 'closed'

    await supabase.from('circuit_breaker_state').update({
      state: newState,
      failure_count: newFailureCount,
      last_failure_at: new Date().toISOString(),
      opened_at: newState === 'open' ? new Date().toISOString() : cb?.opened_at,
      updated_at: new Date().toISOString()
    }).eq('service', 'gemini-ai')

    // Update job
    const job = await supabase.from('job_queue').select('attempts, max_attempts').eq('id', jobId).single()
    const attempts = (job.data?.attempts || 0) + 1
    const maxAttempts = job.data?.max_attempts || 3

    await supabase.from('job_queue').update({
      status: attempts >= maxAttempts ? 'failed' : 'pending',
      attempts,
      result: { error: error.message }
    }).eq('id', jobId)
  }
}

async function processEmail(jobId: string, payload: any) {
  await supabase.from('job_queue').update({
    status: 'processing',
    started_at: new Date().toISOString()
  }).eq('id', jobId)

  try {
    // For now, just log the email (implement actual sending later with Resend)
    console.log('Sending email:', payload)

    // TODO: Implement actual email sending via Resend API
    // const response = await fetch('https://api.resend.com/emails', { ... })

    await supabase.from('job_queue').update({
      status: 'completed',
      result: { sent: true, to: payload.to, template: payload.template },
      completed_at: new Date().toISOString()
    }).eq('id', jobId)
  } catch (error: any) {
    const job = await supabase.from('job_queue').select('attempts, max_attempts').eq('id', jobId).single()
    const attempts = (job.data?.attempts || 0) + 1
    const maxAttempts = job.data?.max_attempts || 3

    await supabase.from('job_queue').update({
      status: attempts >= maxAttempts ? 'failed' : 'pending',
      attempts,
      result: { error: error.message }
    }).eq('id', jobId)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify QStash signature in production
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    if (!verifySignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' })
    }
  }

  const { jobId, type } = req.body

  if (!jobId || !type) {
    return res.status(400).json({ error: 'Missing jobId or type' })
  }

  try {
    switch (type) {
      case 'essay-correction':
        const { data: job } = await supabase.from('job_queue').select('payload').eq('id', jobId).single()
        await processEssayCorrection(jobId, job?.payload || {})
        break

      case 'send-email':
        const { data: emailJob } = await supabase.from('job_queue').select('payload').eq('id', jobId).single()
        await processEmail(jobId, emailJob?.payload || {})
        break

      default:
        return res.status(400).json({ error: `Unknown job type: ${type}` })
    }

    return res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('Job processing error:', error)
    return res.status(500).json({ error: error.message })
  }
}
