import { supabase } from '../client'
import type { IClubRepository } from '../../../repositories'
import type { Club, ClubMember, ClubWithDetails } from '../../../domain'
import type { Database } from '../types'

type ClubRow = Database['public']['Tables']['clubs']['Row']
type MemberRow = Database['public']['Tables']['club_members']['Row']

function mapClub(row: ClubRow): Club {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    coverUrl: row.cover_url,
    isPrivate: row.is_private,
    inviteCode: row.invite_code,
    ownerId: row.owner_id,
    currentBookId: row.current_book_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapMember(row: MemberRow): ClubMember {
  return {
    clubId: row.club_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
  }
}

export const ClubRepository: IClubRepository = {
  async getById(id, userId) {
    const [{ data: clubData, error }, { data: membership }] = await Promise.all([
      supabase.from('clubs').select('*, current_book:books(*)').eq('id', id).single(),
      supabase
        .from('club_members')
        .select('role')
        .eq('club_id', id)
        .eq('user_id', userId)
        .maybeSingle(),
    ])
    if (error || !clubData) return null

    return {
      ...mapClub(clubData),
      currentBook: clubData.current_book ?? null,
      memberCount: 0,
      myRole: (membership?.role as ClubMember['role']) ?? null,
    } as ClubWithDetails
  },

  async getMyClubs(userId) {
    const { data: memberships, error } = await supabase
      .from('club_members')
      .select('role, club_id')
      .eq('user_id', userId)
    if (error) throw new Error('No se pudieron cargar tus clubs')
    if (memberships.length === 0) return []

    const clubIds = memberships.map(m => m.club_id)

    const [{ data: clubs, error: clubsError }, { data: allMembers }] = await Promise.all([
      supabase.from('clubs').select('*, current_book:books(*)').in('id', clubIds),
      supabase.from('club_members').select('club_id').in('club_id', clubIds),
    ])
    if (clubsError) throw new Error('No se pudieron cargar tus clubs')

    const roleMap = Object.fromEntries(memberships.map(m => [m.club_id, m.role]))
    const countMap = (allMembers ?? []).reduce<Record<string, number>>((acc, m) => {
      acc[m.club_id] = (acc[m.club_id] ?? 0) + 1
      return acc
    }, {})

    return (clubs ?? []).map(row => ({
      ...mapClub(row as unknown as ClubRow),
      currentBook: (row.current_book as ClubWithDetails['currentBook']) ?? null,
      memberCount: countMap[row.id] ?? 0,
      myRole: (roleMap[row.id] as ClubMember['role']) ?? null,
    })) as ClubWithDetails[]
  },

  async create(fields) {
    const { data, error } = await supabase
      .from('clubs')
      .insert({
        name: fields.name,
        description: fields.description,
        is_private: fields.isPrivate,
        owner_id: fields.ownerId,
      })
      .select()
      .single()
    if (error) throw new Error('No se pudo crear el club')
    return mapClub(data)
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from('clubs')
      .update({
        name: fields.name,
        description: fields.description,
        cover_url: fields.coverUrl,
        current_book_id: fields.currentBookId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error('No se pudo actualizar el club')
    return mapClub(data)
  },

  async delete(id) {
    const { error } = await supabase.from('clubs').delete().eq('id', id)
    if (error) throw new Error('No se pudo eliminar el club')
  },

  async joinByCode(inviteCode, userId) {
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('invite_code', inviteCode)
      .single()
    if (clubError) throw new Error('Código de invitación inválido')

    const { data, error } = await supabase
      .from('club_members')
      .insert({ club_id: club.id, user_id: userId, role: 'member' })
      .select()
      .single()
    if (error) throw new Error('No se pudo unir al club')
    return mapMember(data)
  },

  async leave(clubId, userId) {
    const { error } = await supabase
      .from('club_members')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', userId)
    if (error) throw new Error('No se pudo abandonar el club')
  },
  async getMembers(clubId) {
    const { data, error } = await supabase.rpc('get_club_members', { p_club_id: clubId })
    if (error) throw new Error('No se pudieron cargar los miembros')
    return (data ?? []).map(mapMember)
  },
}
