import { useAuth } from '@/src/ui/hooks/useAuth'
import { colors } from '@/src/ui/theme'
import { MatchingRepository } from '@/src/infrastructure/supabase/repositories/MatchingRepository'
import { createMatchingActions } from '@/src/usecases/matching'
import { supabase } from '@/src/infrastructure/supabase/client'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const matchingActions = createMatchingActions(MatchingRepository)

interface MemberProfile {
  id: string
  displayName: string | null
  username: string | null
  avatarUrl: string | null
  city: string | null
  readerBio: string | null
  genres: string[]
}

export default function MemberProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [matching, setMatching] = useState(false)
  const [matched, setMatched] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: prof }, { data: genres }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url, city, reader_bio')
          .eq('id', userId)
          .single(),
        supabase.from('reader_genres').select('genre').eq('user_id', userId),
      ])
      if (prof) {
        setProfile({
          id: prof.id,
          displayName: prof.display_name ?? null,
          username: prof.username ?? null,
          avatarUrl: prof.avatar_url ?? null,
          city: prof.city ?? null,
          readerBio: prof.reader_bio ?? null,
          genres: (genres ?? []).map((g: { genre: string }) => g.genre),
        })
      }
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  async function handleMatch() {
    if (!user?.id) return
    setMatching(true)
    try {
      const matchId = await matchingActions.like(user.id, userId)
      if (matchId) {
        setMatched(true)
        Alert.alert('¡Es un match! 📚', `Tú y ${profile?.displayName ?? 'este lector'} tenéis gustos en común.`)
      } else {
        Alert.alert('¡Interés enviado!', 'Si la otra persona también te da like, haréis match.')
      }
    } catch {
      Alert.alert('Error', 'No se pudo registrar el interés.')
    } finally {
      setMatching(false)
    }
  }

  const name = profile?.displayName ?? profile?.username ?? 'Lector'
  const initial = name.charAt(0).toUpperCase()

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.amber} />
        </View>
      </SafeAreaView>
    )
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Perfil no encontrado</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
        </View>

        {/* Nombre */}
        <Text style={styles.name}>{name}</Text>
        {profile.username && profile.displayName && (
          <Text style={styles.username}>@{profile.username}</Text>
        )}

        {/* Ciudad */}
        {profile.city && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{profile.city}</Text>
          </View>
        )}

        {/* Bio lectora */}
        {profile.readerBio && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SOBRE ESTE LECTOR</Text>
            <Text style={styles.bio}>{profile.readerBio}</Text>
          </View>
        )}

        {/* Géneros */}
        {profile.genres.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>GÉNEROS FAVORITOS</Text>
            <View style={styles.genreRow}>
              {profile.genres.map(g => (
                <View key={g} style={styles.genreChip}>
                  <Text style={styles.genreText}>{g}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Botón match */}
        <TouchableOpacity
          style={[styles.matchBtn, matched && styles.matchBtnDone]}
          onPress={handleMatch}
          disabled={matching || matched}
          activeOpacity={0.8}
        >
          {matching ? (
            <ActivityIndicator color={colors.bg} size="small" />
          ) : (
            <>
              <Text style={styles.matchIcon}>{matched ? '✓' : '📚'}</Text>
              <Text style={styles.matchText}>
                {matched ? 'Match enviado' : 'Quiero conectar'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  avatar: { borderRadius: 50, height: 100, width: 100 },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 50,
    borderWidth: 1,
    height: 100,
    justifyContent: 'center',
    width: 100,
  },
  avatarInitial: { color: colors.amber, fontFamily: 'SpaceMono', fontSize: 36 },
  avatarWrap: { alignItems: 'center', marginBottom: 16, marginTop: 12 },
  backBtn: { padding: 16, paddingBottom: 0 },
  bio: {
    color: colors.textSecondary,
    fontFamily: 'Georgia',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  container: { backgroundColor: colors.bg, flex: 1 },
  errorText: { color: colors.error, fontFamily: 'SpaceMono', fontSize: 13 },
  genreChip: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  genreText: { color: colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 11 },
  matchBtn: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginHorizontal: 24,
    marginTop: 36,
    paddingVertical: 14,
  },
  matchBtnDone: { backgroundColor: colors.surfaceUp, borderColor: colors.border, borderWidth: 1 },
  matchIcon: { fontSize: 18 },
  matchText: { color: colors.bg, fontFamily: 'SpaceMono', fontSize: 13 },
  metaRow: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 4 },
  metaText: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 12 },
  name: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 24, textAlign: 'center' },
  scroll: { paddingBottom: 48, paddingHorizontal: 24 },
  section: { marginTop: 28 },
  sectionLabel: {
    color: colors.textMuted,
    fontFamily: 'SpaceMono',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  username: {
    color: colors.textMuted,
    fontFamily: 'SpaceMono',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
})
