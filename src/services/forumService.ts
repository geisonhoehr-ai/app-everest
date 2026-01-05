import { supabase } from '@/lib/supabase/client'

export interface ForumCategory {
    id: string
    name: string
    description: string | null
    slug: string
    created_at: string
}

export interface ForumTopic {
    id: string
    title: string
    content: string
    category_id: string | null
    user_id: string
    is_pinned: boolean
    is_locked: boolean
    views: number
    created_at: string
    updated_at: string
    author?: {
        first_name: string
        last_name: string
        avatar_url: string | null
    }
    category?: ForumCategory
    replies_count?: number
}

export interface ForumPost {
    id: string
    topic_id: string
    user_id: string
    content: string
    created_at: string
    updated_at: string
    author?: {
        first_name: string
        last_name: string
        avatar_url: string | null
    }
}

export const getForumCategories = async () => {
    const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .order('name')

    if (error) throw error
    return data as ForumCategory[]
}

export const getForumTopics = async (categoryId?: string) => {
    let query = supabase
        .from('forum_topics')
        .select(`
      *,
      category:forum_categories(*),
      users!forum_topics_user_id_fkey(first_name, last_name, avatar_url),
      forum_posts(count)
    `)
        .order('created_at', { ascending: false })

    if (categoryId) {
        query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query

    if (error) throw error

    // Mapear os dados para incluir author e replies_count de forma limpa
    return data.map((topic: any) => ({
        ...topic,
        author: topic.users,
        replies_count: topic.forum_posts?.[0]?.count || 0
    })) as ForumTopic[]
}

export const createForumTopic = async (topic: {
    title: string
    content: string
    category_id: string
    user_id: string
}) => {
    const { data, error } = await supabase
        .from('forum_topics')
        .insert(topic)
        .select()
        .single()

    if (error) throw error
    return data as ForumTopic
}

export const getTopicDetails = async (topicId: string) => {
    const { data, error } = await supabase
        .from('forum_topics')
        .select(`
      *,
      category:forum_categories(*),
      users!forum_topics_user_id_fkey(first_name, last_name, avatar_url)
    `)
        .eq('id', topicId)
        .single()

    if (error) throw error

    return {
        ...data,
        author: (data as any).users
    } as ForumTopic
}

export const getTopicPosts = async (topicId: string) => {
    const { data, error } = await supabase
        .from('forum_posts')
        .select(`
      *,
      users!forum_posts_user_id_fkey(first_name, last_name, avatar_url)
    `)
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true })

    if (error) throw error

    return data.map((post: any) => ({
        ...post,
        author: post.users
    })) as ForumPost[]
}

export const createForumPost = async (post: {
    topic_id: string
    content: string
    user_id: string
}) => {
    const { data, error } = await supabase
        .from('forum_posts')
        .insert(post)
        .select()
        .single()

    if (error) throw error
    return data as ForumPost
}
