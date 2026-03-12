import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import type {
  AIProviderConfig,
  CorrectionRequest,
  CorrectionResult,
} from '@/types/essay-correction'

/**
 * Serviço principal de correção de redações via IA.
 * Delega a execução para uma Supabase Edge Function (ai-essay-correction)
 * para manter as chaves de API seguras no servidor.
 */
export const aiCorrectionService = {
  /**
   * Obtém o provider de IA ativo (sem retornar a api_key por segurança via RLS).
   */
  async getActiveProvider(): Promise<AIProviderConfig | null> {
    try {
      const { data, error } = await supabase
        .from('ai_provider_configs')
        .select('id, provider, display_name, model_name, base_url, is_active, config, created_at, updated_at')
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return data as AIProviderConfig
    } catch (err) {
      logger.error('Erro ao buscar provider de IA ativo:', err)
      return null
    }
  },

  /**
   * Envia a redação para correção via Edge Function.
   */
  async correctEssay(request: CorrectionRequest): Promise<CorrectionResult> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-essay-correction', {
        body: {
          action: 'correct',
          ...request,
        },
      })

      if (error) {
        throw new Error(`Erro na Edge Function: ${error.message}`)
      }

      if (!data) {
        throw new Error('Resposta vazia da Edge Function')
      }

      return data as CorrectionResult
    } catch (err) {
      logger.error('Erro ao corrigir redação via IA:', err)
      throw err
    }
  },

  /**
   * Transcreve imagens de redação manuscrita via Edge Function.
   */
  async transcribeEssay(imageUrls: string[]): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-essay-correction', {
        body: {
          action: 'transcribe',
          imageUrls,
        },
      })

      if (error) {
        throw new Error(`Erro na Edge Function: ${error.message}`)
      }

      if (!data?.text) {
        throw new Error('Resposta de transcrição vazia')
      }

      return data.text as string
    } catch (err) {
      logger.error('Erro ao transcrever redação via IA:', err)
      throw err
    }
  },

  /**
   * Obtém todos os providers configurados (admin only).
   */
  async getAllProviders(): Promise<AIProviderConfig[]> {
    try {
      const { data, error } = await supabase
        .from('ai_provider_configs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data ?? []) as AIProviderConfig[]
    } catch (err) {
      logger.error('Erro ao buscar providers de IA:', err)
      return []
    }
  },

  /**
   * Salva (cria ou atualiza) um provider de IA.
   * Se is_active for true, desativa todos os outros primeiro.
   */
  async saveProvider(
    config: Partial<AIProviderConfig> & { provider: string; display_name: string }
  ): Promise<AIProviderConfig | null> {
    try {
      // Se este provider será o ativo, desativar todos os outros primeiro
      if (config.is_active) {
        const { error: deactivateError } = await supabase
          .from('ai_provider_configs')
          .update({ is_active: false })
          .neq('id', config.id ?? '')

        if (deactivateError) {
          logger.error('Erro ao desativar providers anteriores:', deactivateError)
          throw deactivateError
        }
      }

      const payload: Record<string, unknown> = {
        provider: config.provider,
        display_name: config.display_name,
        model_name: config.model_name ?? null,
        base_url: config.base_url ?? null,
        is_active: config.is_active ?? false,
        config: config.config ?? null,
        updated_at: new Date().toISOString(),
      }

      // Only include api_key if it's being set (don't overwrite with empty)
      if (config.api_key) {
        payload.api_key = config.api_key
      }

      if (config.id) {
        payload.id = config.id
      }

      const { data, error } = await supabase
        .from('ai_provider_configs')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single()

      if (error) throw error

      return data as AIProviderConfig
    } catch (err) {
      logger.error('Erro ao salvar provider de IA:', err)
      throw err
    }
  },

  /**
   * Remove um provider de IA.
   */
  async deleteProvider(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_provider_configs')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      logger.error('Erro ao deletar provider de IA:', err)
      throw err
    }
  },
}
