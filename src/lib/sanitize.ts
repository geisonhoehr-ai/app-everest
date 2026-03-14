import DOMPurify from 'dompurify'

/** Strip all HTML tags - use for plain text fields (titles, names, descriptions) */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] })
}

/** Sanitize HTML - keeps safe formatting tags, removes scripts/events */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html)
}

/** Validate URL - only allow http, https, mailto protocols */
export function isValidUrl(url: string, allowedProtocols = ['http:', 'https:']): boolean {
  try {
    const parsed = new URL(url)
    return allowedProtocols.includes(parsed.protocol)
  } catch {
    return false
  }
}

/** Validate and sanitize filename */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255)
}
