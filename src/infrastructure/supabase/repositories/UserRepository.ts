import { supabase } from '../client'
import type { IUserRepository } from '../../../repositories'
import type { User } from '../../../domain'

function mapUser(row: {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const UserRepository: IUserRepository = {
  async getById(id) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (error) return null
    return mapUser(data)
  },

  async getByUsername(username) {
    const { data, error } = await supabase.from('profiles').select('*').eq('username', username).single()
    if (error) return null
    return mapUser(data)
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        display_name: fields.displayName,
        avatar_url: fields.avatarUrl,
        bio: fields.bio,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error('No se pudo actualizar el perfil')
    return mapUser(data)
  },
}
