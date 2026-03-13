/**
 * Client-side file compression for images.
 * Reduces storage usage: 700 alunos × 15 redações × 3MB = 31GB → ~6GB com compressão.
 *
 * - Imagens (JPG/PNG): redimensiona para max 1600px e comprime qualidade 0.75
 * - PDFs/DOCX: não comprime (retorna original)
 */

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.75

/**
 * Comprime uma imagem usando Canvas API.
 * Retorna um novo File com a imagem comprimida em JPEG.
 */
function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Redimensionar se maior que MAX_DIMENSION
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file) // fallback: retorna original
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // Se comprimido ficou maior, retorna original
            resolve(file)
            return
          }

          // Manter nome original mas trocar extensão para .jpg
          const baseName = file.name.replace(/\.[^.]+$/, '')
          const compressed = new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(compressed)
        },
        'image/jpeg',
        JPEG_QUALITY
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Falha ao carregar imagem para compressão'))
    }

    img.src = url
  })
}

/**
 * Comprime um arquivo se for imagem. PDFs e outros formatos passam direto.
 * Retorna o arquivo comprimido (ou original se não for imagem).
 */
export async function compressFile(file: File): Promise<File> {
  if (file.type.startsWith('image/') && !file.type.includes('gif')) {
    return compressImage(file)
  }
  // PDFs, DOCX, etc: retorna sem modificação
  return file
}

/**
 * Comprime múltiplos arquivos em paralelo.
 */
export async function compressFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressFile))
}

/**
 * Formata tamanho de arquivo para exibição.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
