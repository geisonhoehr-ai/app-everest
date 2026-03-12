import type { CorrectionRequest, CorrectionResult } from '@/types/essay-correction'

export interface AICorrectionAdapter {
  correct(request: CorrectionRequest): Promise<CorrectionResult>;
  transcribe(imageUrls: string[]): Promise<string>;
}
