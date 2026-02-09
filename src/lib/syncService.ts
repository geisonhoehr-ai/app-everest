/**
 * Serviço de Sincronização Offline
 * Monitora conexão e sincroniza dados quando online
 */

import { offlineStorage } from './offlineStorage'
import { supabase } from './supabase/client'

class SyncService {
  private isOnline: boolean = navigator.onLine
  private syncInProgress: boolean = false
  private listeners: Set<(online: boolean) => void> = new Set()

  constructor() {
    // Monitorar mudanças de conectividade
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
  }

  /**
   * Adicionar listener para mudanças de status online/offline
   */
  addListener(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback)
    // Retorna função para remover listener
    return () => this.listeners.delete(callback)
  }

  /**
   * Notificar todos os listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.isOnline))
  }

  /**
   * Handler quando conexão é restaurada
   */
  private async handleOnline(): Promise<void> {
    console.log('[SyncService] Conexão restaurada')
    this.isOnline = true
    this.notifyListeners()

    // Iniciar sincronização automática
    await this.syncAll()
  }

  /**
   * Handler quando conexão é perdida
   */
  private handleOffline(): void {
    console.log('[SyncService] Conexão perdida - modo offline ativado')
    this.isOnline = false
    this.notifyListeners()
  }

  /**
   * Verifica se está online
   */
  getOnlineStatus(): boolean {
    return this.isOnline
  }

  /**
   * Sincronizar todos os dados pendentes
   */
  async syncAll(): Promise<{
    success: boolean
    synced: number
    failed: number
  }> {
    if (this.syncInProgress) {
      console.log('[SyncService] Sincronização já em andamento')
      return { success: false, synced: 0, failed: 0 }
    }

    if (!this.isOnline) {
      console.log('[SyncService] Offline - sincronização adiada')
      return { success: false, synced: 0, failed: 0 }
    }

    this.syncInProgress = true
    console.log('[SyncService] Iniciando sincronização...')

    let synced = 0
    let failed = 0

    try {
      // Sincronizar fila de sync
      const queue = await offlineStorage.getSyncQueue()
      console.log(`[SyncService] ${queue.length} itens na fila`)

      for (const item of queue) {
        try {
          await this.syncQueueItem(item)
          await offlineStorage.removeFromSyncQueue(item.id)
          synced++
          console.log(`[SyncService] Sincronizado: ${item.type}`)
        } catch (error) {
          console.error(`[SyncService] Erro ao sincronizar ${item.type}:`, error)
          await offlineStorage.incrementRetries(item.id)
          failed++

          // Remover da fila se exceder 5 tentativas
          if (item.retries >= 5) {
            console.warn(
              `[SyncService] Item ${item.id} excedeu máximo de tentativas`,
            )
            await offlineStorage.removeFromSyncQueue(item.id)
          }
        }
      }

      // Sincronizar progresso de flashcards não sincronizado
      const flashcardProgress =
        await offlineStorage.getUnsyncedFlashcardProgress()
      for (const progress of flashcardProgress) {
        try {
          await this.syncFlashcardProgress(progress)
          await offlineStorage.markFlashcardProgressSynced(progress.session_id)
          synced++
        } catch (error) {
          console.error(
            '[SyncService] Erro ao sincronizar progresso flashcard:',
            error,
          )
          failed++
        }
      }

      // Sincronizar progresso de quizzes não sincronizado
      const quizProgress = await offlineStorage.getUnsyncedQuizProgress()
      for (const progress of quizProgress) {
        try {
          await this.syncQuizProgress(progress)
          await offlineStorage.markQuizProgressSynced(
            progress.quiz_id,
            progress.user_id,
          )
          synced++
        } catch (error) {
          console.error(
            '[SyncService] Erro ao sincronizar progresso quiz:',
            error,
          )
          failed++
        }
      }

      console.log(
        `[SyncService] Sincronização completa: ${synced} sucesso, ${failed} falhas`,
      )
      return { success: true, synced, failed }
    } catch (error) {
      console.error('[SyncService] Erro durante sincronização:', error)
      return { success: false, synced, failed }
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Sincronizar item individual da fila
   */
  private async syncQueueItem(item: any): Promise<void> {
    switch (item.type) {
      case 'flashcard_progress':
        await this.syncFlashcardProgress(item.data)
        break
      case 'flashcard_session':
        await this.syncFlashcardSession(item.data)
        break
      case 'quiz_attempt':
        await this.syncQuizAttempt(item.data)
        break
      default:
        console.warn(`[SyncService] Tipo desconhecido: ${item.type}`)
    }
  }

  /**
   * Sincronizar progresso de flashcard
   */
  private async syncFlashcardProgress(progress: any): Promise<void> {
    const { error } = await supabase.from('flashcard_progress').insert({
      flashcard_id: progress.flashcard_id,
      user_id: progress.user_id,
      quality: progress.quality,
      session_id: progress.session_id,
      created_at: new Date(progress.timestamp).toISOString(),
    })

    if (error) throw error
  }

  /**
   * Sincronizar sessão completa de flashcards
   */
  private async syncFlashcardSession(session: any): Promise<void> {
    // Criar sessão
    const { data: sessionData, error: sessionError } = await supabase
      .from('flashcard_sessions')
      .insert({
        user_id: session.user_id,
        topic_id: session.topic_id,
        cards_studied: session.cards_studied,
        session_duration: session.session_duration,
        created_at: new Date(session.timestamp).toISOString(),
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // Criar progresso de cada card
    if (session.progress && session.progress.length > 0) {
      const progressData = session.progress.map((p: any) => ({
        flashcard_id: p.flashcard_id,
        user_id: session.user_id,
        quality: p.quality,
        session_id: sessionData.id,
        created_at: new Date(p.timestamp).toISOString(),
      }))

      const { error: progressError } = await supabase
        .from('flashcard_progress')
        .insert(progressData)

      if (progressError) throw progressError
    }
  }

  /**
   * Sincronizar tentativa de quiz
   */
  private async syncQuizAttempt(attempt: any): Promise<void> {
    // Criar tentativa
    const { data: attemptData, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: attempt.quiz_id,
        user_id: attempt.user_id,
        score: attempt.score,
        total_questions: attempt.total_questions,
        duration_seconds: attempt.duration_seconds,
        attempt_date: new Date(attempt.started_at).toISOString(),
      })
      .select()
      .single()

    if (attemptError) throw attemptError

    // Criar respostas
    if (attempt.answers && Object.keys(attempt.answers).length > 0) {
      const answersData = Object.entries(attempt.answers).map(
        ([questionId, answer]: [string, any]) => ({
          quiz_attempt_id: attemptData.id,
          question_id: questionId,
          user_answer: answer.user_answer,
          is_correct: answer.is_correct,
        }),
      )

      const { error: answersError } = await supabase
        .from('quiz_attempt_answers')
        .insert(answersData)

      if (answersError) throw answersError
    }
  }

  /**
   * Sincronizar progresso de quiz (quiz em andamento)
   */
  private async syncQuizProgress(progress: any): Promise<void> {
    // Não precisamos sincronizar progresso de quiz em andamento
    // Ele será sincronizado quando o quiz for finalizado como quiz_attempt
    console.log('[SyncService] Progresso de quiz será sincronizado ao finalizar')
  }

  /**
   * Forçar sincronização manual
   */
  async forceSyncNow(): Promise<{
    success: boolean
    synced: number
    failed: number
  }> {
    console.log('[SyncService] Sincronização manual solicitada')
    return await this.syncAll()
  }
}

// Singleton instance
export const syncService = new SyncService()
