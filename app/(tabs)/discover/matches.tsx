import { SafeAreaView } from 'react-native-safe-area-context'
import type { ReaderMatch } from '@/src/domain/ReaderProfile'
import { GenreChip } from '@/src/ui/components/GenreChip'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useMatches } from '@/src/ui/hooks/useDiscover'
import { colors } from '@/src/ui/theme'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  if (days < 30) return `Hace ${Math.floor(days / 7)} sem.`
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function MatchCard({ item }: { item: ReaderMatch }) {
  const { reader, matchedAt } = item

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/discover/match/${item.matchId}`)}
      activeOpacity={0.7}
    >
      {/* Top row — genres as editorial category tags + date */}
      <View style={styles.cardTop}>
        <View style={styles.genresRow}>
          {reader.genres.slice(0, 2).map(g => (
            <GenreChip key={g} genre={g} selected small light />
          ))}
          {reader.genres.length > 2 && (
            <Text style={styles.moreGenres}>+{reader.genres.length - 2}</Text>
          )}
        </View>
        <View style={styles.dateBadge}>
          <Ionicons name="heart" size={9} color={colors.amber} />
          <Text style={styles.dateText}>{timeAgo(matchedAt)}</Text>
        </View>
      </View>

      {/* Middle — name left, avatar right (like author + author photo) */}
      <View style={styles.cardMid}>
        <View style={styles.nameBlock}>
          <Text style={styles.matchName} numberOfLines={2}>
            {reader.fullName}
          </Text>
          {reader.city && (
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={11} color={colors.textMuted} />
              <Text style={styles.cityText}>{reader.city}</Text>
            </View>
          )}
        </View>

        {/* Avatar — author photo style */}
        <View style={styles.avatarWrap}>
          {reader.avatarUrl ? (
            <Image source={{ uri: reader.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{reader.fullName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bio — book blurb style */}
      {reader.readerBio ? (
        <Text style={styles.bio} numberOfLines={2}>
          &ldquo;{reader.readerBio}&rdquo;
        </Text>
      ) : null}

      {/* Bottom rule + CTA */}
      <View style={styles.cardBottom}>
        <View style={styles.bottomRule} />
        <Text style={styles.cta}>Ver perfil completo →</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function MatchesScreen() {
  const { user } = useAuth()
  const { matches, loading, reload } = useMatches(user?.id ?? '')

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.amber} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Coincidencias</Text>
          {matches.length > 0 && (
            <Text style={styles.headerSub}>
              {matches.length} {matches.length === 1 ? 'lector afín' : 'lectores afines'}
            </Text>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.amber} />
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="book-outline" size={30} color={colors.amber} />
          </View>
          <Text style={styles.emptyTitle}>Aún no hay coincidencias</Text>
          <Text style={styles.emptyText}>
            Cuando alguien comparta tus gustos y se gusten mutuamente, aparecerá aquí con su foto y
            perfil completo.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Volver a descubrir</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={item => item.matchId}
          renderItem={({ item }) => <MatchCard item={item} />}
          contentContainerStyle={styles.list}
          onRefresh={reload}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  avatar: {
    borderColor: colors.amber,
    borderRadius: 36,
    borderWidth: 2,
    height: 72,
    width: 72,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: colors.amberFaint,
    borderColor: colors.amber,
    borderRadius: 36,
    borderWidth: 2,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  avatarInitial: {
    color: colors.amber,
    fontFamily: 'Playfair-Bold',
    fontSize: 26,
  },
  avatarWrap: {
    elevation: 3,
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  backBtn: {
    borderColor: colors.amber,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtnText: {
    color: colors.amber,
    fontFamily: 'Inter-Medium',
    fontSize: 15,
  },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  bio: {
    color: colors.textMuted,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 14,
  },
  bottomRule: {
    backgroundColor: colors.border,
    flex: 1,
    height: 1,
    marginRight: 12,
  },
  card: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    padding: 20,
    shadowColor: '#1A1208',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardBottom: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 16,
  },
  cardMid: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  cityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    marginTop: 4,
  },
  cityText: {
    color: colors.textMuted,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  container: { backgroundColor: colors.bg, flex: 1 },
  cta: {
    color: colors.amber,
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  dateBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  dateText: {
    color: colors.textMuted,
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.amberFaint,
    borderColor: colors.amber + '30',
    borderRadius: 32,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    marginBottom: 20,
    width: 72,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: 'Playfair-Bold',
    fontSize: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  genresRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerCenter: { alignItems: 'center' },
  headerSub: {
    color: colors.textMuted,
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    letterSpacing: 0.3,
    marginTop: 1,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontFamily: 'Playfair-Bold',
    fontSize: 22,
  },
  list: { padding: 16, paddingBottom: 40 },
  matchName: {
    color: colors.textPrimary,
    fontFamily: 'Playfair-Bold',
    fontSize: 22,
    flex: 1,
    lineHeight: 28,
    marginRight: 12,
  },
  moreGenres: {
    color: colors.textMuted,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginLeft: 2,
  },
  nameBlock: { flex: 1 },
  separator: { height: 12 },
  headerSpacer: { width: 40 },
})
