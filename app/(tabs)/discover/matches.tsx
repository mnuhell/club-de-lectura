import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useMatches } from '@/src/ui/hooks/useDiscover'
import { GenreChip } from '@/src/ui/components/GenreChip'
import type { ReaderMatch } from '@/src/domain/ReaderProfile'

export default function MatchesScreen() {
  const { user } = useAuth()
  const { matches, loading, reload } = useMatches(user?.id ?? '')

  const renderMatch = ({ item }: { item: ReaderMatch }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => router.push(`/discover/match/${item.matchId}`)}
      activeOpacity={0.75}
    >
      {/* Avatar — revealed because it's a match */}
      <View style={styles.avatarContainer}>
        {item.reader.avatarUrl ? (
          <Image source={{ uri: item.reader.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>
              {item.reader.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.matchDot} />
      </View>

      <View style={styles.matchInfo}>
        <Text style={styles.matchName}>{item.reader.fullName}</Text>
        {item.reader.city && (
          <Text style={styles.matchCity}>📍 {item.reader.city}</Text>
        )}
        {item.reader.readerBio && (
          <Text style={styles.matchBio} numberOfLines={2}>
            "{item.reader.readerBio}"
          </Text>
        )}
        <View style={styles.genresRow}>
          {item.reader.genres.slice(0, 3).map((g) => (
            <GenreChip key={g} genre={g} selected small />
          ))}
        </View>
        <Text style={styles.matchedAt}>
          Coincidencia el {new Date(item.matchedAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
          })}
        </Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis coincidencias</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#C8853A" />
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>♥</Text>
          <Text style={styles.emptyTitle}>Aún no hay coincidencias</Text>
          <Text style={styles.emptyText}>
            Sigue descubriendo lectores. Cuando alguien comparta tus gustos y se gusten mutuamente,
            aparecerá aquí su foto y su perfil completo.
          </Text>
          <TouchableOpacity style={styles.discoverButton} onPress={() => router.back()}>
            <Text style={styles.discoverButtonText}>Volver a descubrir</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.matchId}
          renderItem={renderMatch}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={reload}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A06' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#C8853A20',
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: '#C8853A', fontSize: 22 },
  headerTitle: {
    color: '#F2E8D5',
    fontSize: 18,
    fontFamily: 'Georgia',
    fontWeight: '700',
  },
  list: { padding: 16 },
  matchCard: {
    flexDirection: 'row',
    backgroundColor: '#161009',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C8853A20',
    padding: 16,
    gap: 14,
  },
  avatarContainer: { position: 'relative' },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#C8853A22',
    borderWidth: 1.5,
    borderColor: '#C8853A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#C8853A',
    fontSize: 28,
    fontFamily: 'Georgia',
    fontWeight: '700',
  },
  matchDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C8853A',
    borderWidth: 2,
    borderColor: '#161009',
  },
  matchInfo: { flex: 1 },
  matchName: {
    color: '#F2E8D5',
    fontSize: 16,
    fontFamily: 'Georgia',
    fontWeight: '600',
    marginBottom: 2,
  },
  matchCity: {
    color: '#F2E8D550',
    fontSize: 12,
    fontFamily: 'SpaceMono',
    marginBottom: 6,
  },
  matchBio: {
    color: '#F2E8D570',
    fontSize: 12,
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 17,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  matchedAt: {
    color: '#F2E8D530',
    fontSize: 11,
    fontFamily: 'SpaceMono',
  },
  separator: { height: 10 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    color: '#F2E8D5',
    fontSize: 20,
    fontFamily: 'Georgia',
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    color: '#F2E8D560',
    fontSize: 14,
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  discoverButton: {
    borderWidth: 1,
    borderColor: '#C8853A',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  discoverButtonText: {
    color: '#C8853A',
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
})
