import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { jobId, type } = req.body

  if (!jobId || !type) {
    return res.status(400).json({ error: 'Missing jobId or type' })
  }

  const qstashToken = process.env.QSTASH_TOKEN
  if (!qstashToken) {
    return res.status(500).json({ error: 'QStash not configured' })
  }

  try {
    // Get the base URL for the callback
    const protocol = req.headers['x-forwarded-proto'] || 'https'
    const host = req.headers['x-forwarded-host'] || req.headers.host
    const callbackUrl = `${protocol}://${host}/api/queue/handler`

    // Publish to QStash
    const response = await fetch('https://qstash-us-east-1.upstash.io/v2/publish/' + encodeURIComponent(callbackUrl), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${qstashToken}`,
        'Content-Type': 'application/json',
        'Upstash-Retries': '3',
        'Upstash-Retry-After': '10',
      },
      body: JSON.stringify({ jobId, type }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('QStash publish error:', error)
      return res.status(500).json({ error: 'Failed to publish to QStash' })
    }

    const data = await response.json()
    return res.status(200).json({ messageId: data.messageId })
  } catch (error) {
    console.error('QStash publish error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
