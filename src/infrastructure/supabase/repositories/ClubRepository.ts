import type { Book, Club, ClubMember, ClubWithDetails, ExternalSource } from '../../../domain'
import type { ClubCreateData } from '../../../domain/Club'
import type { IClubRepository } from '../../../repositories'
import { supabase } from '../client'
import type { Database } from '../types'

type ClubRow = Database['public']['Tables']['clubs']['Row']
type MemberRow = Database['public']['Tables']['club_members']['Row']

function mapBook(row: Record<string, unknown> | Record<string, unknown>[] | null): Book | null {
  const data = Array.isArray(row) ? (row[0] ?? null) : row
  if (!data) return null
  return {
    id: data.id as string,
    title: data.title as string,
    author: data.author as string,
    isbn: (data.isbn as string | null) ?? null,
    coverUrl: (data.cover_url as string | null) ?? null,
    description: (data.description as string | null) ?? null,
    pageCount: (data.page_count as number | null) ?? null,
    publishedYear: (data.published_year as number | null) ?? null,
    externalId: (data.external_id as string | null) ?? null,
    externalSource: (data.external_source as ExternalSource | null) ?? null,
    createdAt: data.created_at as string,
  }
}

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
    city: row.city,
    startDate: row.start_date,
    meetingDate: row.meeting_date,
    closeDate: row.close_date,
    bookstoreName: row.bookstore_name,
    bookstoreUrl: row.bookstore_url,
    bookstoreAddress: row.bookstore_address,
    bookstorePhone: row.bookstore_phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapMember(
  row: MemberRow & {
    display_name?: string | null
    username?: string | null
    avatar_url?: string | null
  },
): ClubMember {
  return {
    clubId: row.club_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
    displayName: row.display_name ?? null,
    username: row.username ?? null,
    avatarUrl: row.avatar_url ?? null,
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
      currentBook: mapBook(clubData.current_book as Record<string, unknown>[] | null),
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
      currentBook: mapBook(row.current_book as Record<string, unknown>[] | null),
      memberCount: countMap[row.id] ?? 0,
      myRole: (roleMap[row.id] as ClubMember['role']) ?? null,
    })) as ClubWithDetails[]
  },

  async create(fields: ClubCreateData) {
    const { data, error } = await supabase
      .from('clubs')
      .insert({
        name: fields.name,
        description: fields.description,
        is_private: fields.isPrivate,
        owner_id: fields.ownerId,
        current_book_id: fields.currentBookId ?? null,
        start_date: fields.startDate ?? null,
        meeting_date: fields.meetingDate ?? null,
        close_date: fields.closeDate ?? null,
        bookstore_name: fields.bookstoreName ?? null,
        bookstore_url: fields.bookstoreUrl ?? null,
        bookstore_address: fields.bookstoreAddress ?? null,
        bookstore_phone: fields.bookstorePhone ?? null,
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
        ...(fields.name !== undefined && { name: fields.name }),
        ...(fields.description !== undefined && { description: fields.description }),
        ...(fields.coverUrl !== undefined && { cover_url: fields.coverUrl }),
        ...(fields.currentBookId !== undefined && { current_book_id: fields.currentBookId }),
        ...(fields.city !== undefined && { city: fields.city }),
        ...(fields.isPrivate !== undefined && { is_private: fields.isPrivate }),
        ...(fields.startDate !== undefined && { start_date: fields.startDate }),
        ...(fields.meetingDate !== undefined && { meeting_date: fields.meetingDate }),
        ...(fields.closeDate !== undefined && { close_date: fields.closeDate }),
        ...(fields.bookstoreName !== undefined && { bookstore_name: fields.bookstoreName }),
        ...(fields.bookstoreUrl !== undefined && { bookstore_url: fields.bookstoreUrl }),
        ...(fields.bookstoreAddress !== undefined && {
          bookstore_address: fields.bookstoreAddress,
        }),
        ...(fields.bookstorePhone !== undefined && { bookstore_phone: fields.bookstorePhone }),
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
      .select('id, close_date')
      .eq('invite_code', inviteCode)
      .single()
    if (clubError) throw new Error('Código de invitación inválido')
    if (club.close_date && new Date(club.close_date) <= new Date()) {
      throw new Error('Este club ya está cerrado y no admite nuevos miembros')
    }

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
  async getPublicClubs(userId, city) {
    let query = supabase
      .from('clubs')
      .select('*, current_book:books(*)')
      .eq('is_private', false)
      .order('created_at', { ascending: false })

    if (city?.trim()) {
      query = query.ilike('city', `%${city.trim()}%`)
    }

    const { data: clubs, error } = await query
    if (error) throw new Error('No se pudieron cargar los clubs')
    if (!clubs || clubs.length === 0) return []

    const clubIds = clubs.map(c => c.id)
    const [{ data: allMembers }, { data: memberships }] = await Promise.all([
      supabase.from('club_members').select('club_id').in('club_id', clubIds),
      supabase
        .from('club_members')
        .select('club_id, role')
        .eq('user_id', userId)
        .in('club_id', clubIds),
    ])

    const countMap = (allMembers ?? []).reduce<Record<string, number>>((acc, m) => {
      acc[m.club_id] = (acc[m.club_id] ?? 0) + 1
      return acc
    }, {})
    const roleMap = Object.fromEntries((memberships ?? []).map(m => [m.club_id, m.role]))

    return clubs.map(row => ({
      ...mapClub(row as unknown as ClubRow),
      currentBook: mapBook(row.current_book as Record<string, unknown>[] | null),
      memberCount: countMap[row.id] ?? 0,
      myRole: (roleMap[row.id] as ClubMember['role']) ?? null,
    })) as ClubWithDetails[]
  },

  async getMembers(clubId) {
    const { data: members, error } = await supabase
      .from('club_members')
      .select('club_id, user_id, role, joined_at')
      .eq('club_id', clubId)
    if (error) {
      console.error('[ClubRepository.getMembers] error:', JSON.stringify(error))
      throw new Error('No se pudieron cargar los miembros')
    }
    if (!members || members.length === 0) return []

    const userIds = members.map(m => m.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url')
      .in('id', userIds)

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

    return members
      .map(m => ({
        clubId: m.club_id,
        userId: m.user_id,
        role: m.role as ClubMember['role'],
        joinedAt: m.joined_at,
        displayName: profileMap[m.user_id]?.display_name ?? null,
        username: profileMap[m.user_id]?.username ?? null,
        avatarUrl: profileMap[m.user_id]?.avatar_url ?? null,
      }))
      .sort((a, b) => {
        const order = { owner: 0, admin: 1, member: 2 }
        return (order[a.role] ?? 2) - (order[b.role] ?? 2)
      })
  },
}
