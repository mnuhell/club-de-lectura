import { supabase } from '../client'
import type { IPostRepository } from '../../../repositories'
import type { Post, PostWithDetails } from '../../../domain'
import type { Database } from '../types'

type PostRow = Database['public']['Tables']['posts']['Row']

function mapPost(row: PostRow): Post {
  return {
    id: row.id,
    clubId: row.club_id,
    readingSessionId: row.reading_session_id,
    authorId: row.author_id,
    content: row.content,
    chapterRef: row.chapter_ref,
    pageRef: row.page_ref,
    hasSpoiler: row.has_spoiler,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const PostRepository: IPostRepository = {
  async getByClub(clubId, options = {}) {
    let query = supabase
      .from('posts')
      .select('*, author:profiles(*), reactions(*)')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .limit(options.limit ?? 30)

    if (options.chapterRef !== undefined) {
      query = query.eq('chapter_ref', options.chapterRef)
    }

    const { data, error } = await query
    if (error) throw new Error('No se pudieron cargar los posts')

    return data.map(row => ({
      ...mapPost(row),
      author: {
        id: row.author.id,
        username: row.author.username,
        displayName: row.author.display_name,
        avatarUrl: row.author.avatar_url,
        bio: row.author.bio,
        createdAt: row.author.created_at,
        updatedAt: row.author.updated_at,
      },
      reactions: row.reactions.map((r: Database['public']['Tables']['reactions']['Row']) => ({
        id: r.id,
        postId: r.post_id,
        userId: r.user_id,
        emoji: r.emoji,
        createdAt: r.created_at,
      })),
    })) as PostWithDetails[]
  },

  async create(fields) {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        club_id: fields.clubId,
        reading_session_id: fields.readingSessionId,
        author_id: fields.authorId,
        content: fields.content,
        chapter_ref: fields.chapterRef,
        page_ref: fields.pageRef,
        has_spoiler: fields.hasSpoiler,
      })
      .select()
      .single()
    if (error) throw new Error('No se pudo publicar el post')
    return mapPost(data)
  },

  async delete(id) {
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) throw new Error('No se pudo eliminar el post')
  },
}
