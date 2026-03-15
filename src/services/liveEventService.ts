import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { createEvent, updateEvent, deleteEvent } from '@/services/calendarService'
import { notificationService } from '@/services/notificationService'
import {
  createPandaLive,
  finishPandaLive,
  deletePandaLive,
  type PandaLive,
} from '@/services/pandaLiveService'

// ─── Types ───────────────────────────────────────────────────────────────────

export type LiveEventProvider = 'panda' | 'youtube' | 'meet'
export type LiveEventStatus = 'scheduled' | 'live' | 'ended' | 'cancelled'

export interface LiveEvent {
  id: string
  title: string
  description: string | null
  provider: LiveEventProvider
  stream_url: string
  class_id: string | null
  course_id: string | null
  teacher_id: string
  scheduled_start: string
  scheduled_end: string
  status: LiveEventStatus
  recording_url: string | null
  recording_published: boolean
  reminder_sent: boolean
  calendar_event_id: string | null
  panda_live_id: string | null
  panda_rtmp: string | null
  panda_stream_key: string | null
  created_at: string
  updated_at: string
  // Joined fields
  classes?: { name: string } | null
  users?: { first_name: string; last_name: string } | null
}

export interface CreateLiveEventInput {
  title: string
  description?: string
  provider: LiveEventProvider
  stream_url?: string
  class_id?: string | null
  course_id?: string | null
  teacher_id: string
  scheduled_start: string
  scheduled_end: string
  /** Panda-specific options */
  active_dvr?: boolean
  bitrate?: string[]
}

/** Dados retornados ao criar uma live Panda (RTMP + key para OBS) */
export interface PandaLiveCredentials {
  rtmp: string
  stream_key: string
  live_player: string
  panda_live_id: string
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export const getLiveEvents = async (filters?: {
  classId?: string
  status?: LiveEventStatus
  provider?: LiveEventProvider
}): Promise<LiveEvent[]> => {
  let query = supabase
    .from('live_events')
    .select('*, classes(name), users!live_events_teacher_id_fkey(first_name, last_name)')
    .order('scheduled_start', { ascending: true })

  if (filters?.classId) query = query.eq('class_id', filters.classId)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.provider) query = query.eq('provider', filters.provider)

  const { data, error } = await query
  if (error) {
    logger.error('Erro ao buscar live events:', error)
    return []
  }
  return (data as unknown as LiveEvent[]) || []
}

export const getLiveEvent = async (id: string): Promise<LiveEvent | null> => {
  const { data, error } = await supabase
    .from('live_events')
    .select('*, classes(name), users!live_events_teacher_id_fkey(first_name, last_name)')
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Erro ao buscar live event:', error)
    return null
  }
  return data as unknown as LiveEvent
}

export const createLiveEvent = async (
  input: CreateLiveEventInput
): Promise<LiveEvent & { pandaCredentials?: PandaLiveCredentials }> => {
  // 1. If Panda provider, auto-create live via Panda API
  let pandaLive: PandaLive | null = null
  let streamUrl = input.stream_url || ''

  if (input.provider === 'panda') {
    pandaLive = await createPandaLive({
      title: input.title,
      scheduled_at: input.scheduled_start,
      active_dvr: input.active_dvr,
      bitrate: input.bitrate,
    })
    streamUrl = pandaLive.live_player
  }

  // 2. Create live event in Supabase
  const { data, error } = await supabase
    .from('live_events')
    .insert({
      title: input.title,
      description: input.description || null,
      provider: input.provider,
      stream_url: streamUrl,
      class_id: input.class_id || null,
      course_id: input.course_id || null,
      teacher_id: input.teacher_id,
      scheduled_start: input.scheduled_start,
      scheduled_end: input.scheduled_end,
      panda_live_id: pandaLive?.id || null,
      panda_rtmp: pandaLive?.rtmp || null,
      panda_stream_key: pandaLive?.stream_key || null,
    })
    .select('*, classes(name), users!live_events_teacher_id_fkey(first_name, last_name)')
    .single()

  if (error) {
    logger.error('Erro ao criar live event:', error)
    throw error
  }

  // 2. Create calendar event with bidirectional linking
  try {
    const calendarEvent = await createEvent({
      title: input.title,
      description: input.description,
      start_time: input.scheduled_start,
      end_time: input.scheduled_end,
      event_type: 'LIVE_CLASS',
      class_id: input.class_id || null,
      related_entity_id: data.id,
    })

    // 3. Update live event with calendar_event_id
    await supabase
      .from('live_events')
      .update({ calendar_event_id: calendarEvent.id })
      .eq('id', data.id)
  } catch (e) {
    logger.error('Erro ao criar calendar event vinculado:', e)
  }

  // 4. Notify students
  await notifyLiveEventRecipients(
    data as unknown as LiveEvent,
    `Nova aula ao vivo agendada: ${input.title}`,
    `A aula "${input.title}" foi agendada para ${new Date(input.scheduled_start).toLocaleString('pt-BR')}.`
  )

  const result = data as unknown as LiveEvent & { pandaCredentials?: PandaLiveCredentials }

  if (pandaLive) {
    result.pandaCredentials = {
      rtmp: pandaLive.rtmp,
      stream_key: pandaLive.stream_key,
      live_player: pandaLive.live_player,
      panda_live_id: pandaLive.id,
    }
  }

  return result
}

export const updateLiveEvent = async (
  id: string,
  updates: Partial<LiveEvent>
): Promise<LiveEvent> => {
  const { data, error } = await supabase
    .from('live_events')
    .update(updates)
    .eq('id', id)
    .select('*, classes(name), users!live_events_teacher_id_fkey(first_name, last_name)')
    .single()

  if (error) {
    logger.error('Erro ao atualizar live event:', error)
    throw error
  }

  // Sync calendar event if title or time changed
  const liveEvent = data as unknown as LiveEvent
  if (liveEvent.calendar_event_id && (updates.title || updates.scheduled_start || updates.scheduled_end)) {
    try {
      await updateEvent(liveEvent.calendar_event_id, {
        title: liveEvent.title,
        description: liveEvent.description || undefined,
        start_time: liveEvent.scheduled_start,
        end_time: liveEvent.scheduled_end,
        event_type: 'LIVE_CLASS',
        class_id: liveEvent.class_id,
      })
    } catch (e) {
      logger.error('Erro ao sincronizar calendar event:', e)
    }
  }

  return liveEvent
}

export const deleteLiveEvent = async (id: string): Promise<void> => {
  const event = await getLiveEvent(id)

  const { error } = await supabase
    .from('live_events')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('Erro ao deletar live event:', error)
    throw error
  }

  if (event?.calendar_event_id) {
    try {
      await deleteEvent(event.calendar_event_id)
    } catch (e) {
      logger.error('Erro ao deletar calendar event vinculado:', e)
    }
  }

  // Delete live on Panda too
  if (event?.panda_live_id) {
    try {
      await deletePandaLive(event.panda_live_id)
    } catch (e) {
      logger.error('Erro ao deletar live no Panda:', e)
    }
  }
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

export const startLive = async (id: string): Promise<void> => {
  const { data, error } = await supabase
    .from('live_events')
    .update({ status: 'live' })
    .eq('id', id)
    .select('*, classes(name)')
    .single()

  if (error) {
    logger.error('Erro ao iniciar live:', error)
    throw error
  }

  await notifyLiveEventRecipients(
    data as unknown as LiveEvent,
    `A aula "${data.title}" está ao vivo agora!`,
    'Clique para assistir a aula ao vivo.'
  )
}

export const endLive = async (id: string): Promise<void> => {
  // Fetch to check if it has a Panda live to finish
  const event = await getLiveEvent(id)

  const { error } = await supabase
    .from('live_events')
    .update({ status: 'ended' })
    .eq('id', id)

  if (error) {
    logger.error('Erro ao encerrar live:', error)
    throw error
  }

  // Finish live on Panda (starts VOD conversion)
  if (event?.panda_live_id) {
    try {
      await finishPandaLive(event.panda_live_id)
      logger.info('Live finalizada no Panda, VOD em conversão')
    } catch (e) {
      logger.error('Erro ao finalizar live no Panda:', e)
    }
  }
}

export const cancelLive = async (id: string): Promise<void> => {
  const event = await getLiveEvent(id)

  const { error } = await supabase
    .from('live_events')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) {
    logger.error('Erro ao cancelar live:', error)
    throw error
  }

  if (event?.calendar_event_id) {
    try {
      await deleteEvent(event.calendar_event_id)
    } catch (e) {
      logger.error('Erro ao deletar calendar event:', e)
    }
  }
}

// ─── Recording Publishing ────────────────────────────────────────────────────

export const publishRecording = async (
  id: string,
  recordingUrl: string,
  recordingProvider: 'panda' | 'youtube'
): Promise<void> => {
  const event = await getLiveEvent(id)
  if (!event || !event.course_id) throw new Error('Evento ou curso não encontrado')

  // 1. Update live event
  await supabase
    .from('live_events')
    .update({ recording_url: recordingUrl, recording_published: true })
    .eq('id', id)

  // 2. Find or create "Lives" module
  const { data: existingModule } = await supabase
    .from('video_modules')
    .select('id')
    .eq('course_id', event.course_id)
    .eq('module_type', 'lives')
    .single()

  let moduleId: string

  if (existingModule) {
    moduleId = existingModule.id
  } else {
    const { data: modules } = await supabase
      .from('video_modules')
      .select('order_index')
      .eq('course_id', event.course_id)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrder = (modules?.[0]?.order_index ?? -1) + 1

    const { data: newModule, error: modError } = await supabase
      .from('video_modules')
      .insert({
        course_id: event.course_id,
        name: 'Lives',
        module_type: 'lives',
        order_index: nextOrder,
      })
      .select('id')
      .single()

    if (modError) throw modError
    moduleId = newModule.id
  }

  // 3. Extract video source ID from URL
  const videoSourceId = extractVideoSourceId(recordingUrl, recordingProvider)
  const videoSourceType = recordingProvider === 'panda' ? 'panda_video' : 'youtube'

  // 4. Get next lesson order
  const { data: lessons } = await supabase
    .from('video_lessons')
    .select('order_index')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextLessonOrder = (lessons?.[0]?.order_index ?? -1) + 1

  // 5. Create video lesson
  const { error: lessonError } = await supabase
    .from('video_lessons')
    .insert({
      module_id: moduleId,
      title: event.title,
      description: event.description,
      video_source_id: videoSourceId,
      video_source_type: videoSourceType,
      order_index: nextLessonOrder,
      is_active: true,
    })

  if (lessonError) throw lessonError
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export const getActiveLives = async (): Promise<LiveEvent[]> => {
  const { data, error } = await supabase
    .from('live_events')
    .select('*, classes(name)')
    .eq('status', 'live')
    .order('scheduled_start', { ascending: true })

  if (error) {
    logger.error('Erro ao buscar lives ativas:', error)
    return []
  }
  return (data as unknown as LiveEvent[]) || []
}

export const getUpcomingLives = async (): Promise<LiveEvent[]> => {
  const { data, error } = await supabase
    .from('live_events')
    .select('*, classes(name), users!live_events_teacher_id_fkey(first_name, last_name)')
    .in('status', ['scheduled', 'live'])
    .gte('scheduled_end', new Date().toISOString())
    .order('scheduled_start', { ascending: true })

  if (error) {
    logger.error('Erro ao buscar próximas lives:', error)
    return []
  }
  return (data as unknown as LiveEvent[]) || []
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractVideoSourceId = (url: string, provider: 'panda' | 'youtube'): string => {
  if (provider === 'youtube') {
    const match = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|live\/))([a-zA-Z0-9_-]{11})/)
    return match?.[1] || url
  }
  // Panda: extract UUID from embed URL or raw UUID
  const match = url.match(/[?&]v=([a-f0-9-]{36})/) || url.match(/^([a-f0-9-]{36})$/)
  return match?.[1] || url
}

const notifyLiveEventRecipients = async (
  event: LiveEvent,
  title: string,
  message: string
): Promise<void> => {
  try {
    let userIds: string[] = []

    if (event.class_id) {
      const { data } = await supabase
        .from('student_classes')
        .select('user_id')
        .eq('class_id', event.class_id)
      userIds = data?.map(s => s.user_id) || []
    } else {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'student')
      userIds = data?.map(s => s.id) || []
    }

    if (userIds.length > 0) {
      await notificationService.createBulkNotifications(userIds, {
        type: 'live_event',
        title,
        message,
        relatedEntityId: event.id,
        relatedEntityType: 'live_event',
      })
    }
  } catch (error) {
    logger.error('Erro ao notificar participantes da live:', error)
  }
}
