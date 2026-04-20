import { SafeAreaView } from 'react-native-safe-area-context'
import type { ReaderMatch } from '@/src/domain/ReaderProfile'
import { GenreChip } from '@/src/ui/components/GenreChip'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useMatches } from '@/src/ui/hooks/useDiscover'
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
            <Text style={styles.avatarInitial}>{item.reader.fullName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.matchDot} />
      </View>

      <View style={styles.matchInfo}>
        <Text style={styles.matchName}>{item.reader.fullName}</Text>
        {item.reader.city && <Text style={styles.matchCity}>📍 {item.reader.city}</Text>}
        {item.reader.readerBio && (
          <Text style={styles.matchBio} numberOfLines={2}>
            {item.reader.readerBio}
          </Text>
        )}
        <View style={styles.genresRow}>
          {item.reader.genres.slice(0, 3).map(g => (
            <GenreChip key={g} genre={g} selected small />
          ))}
        </View>
        <Text style={styles.matchedAt}>
          Coincidencia el{' '}
          {new Date(item.matchedAt).toLocaleDateString('es-ES', {
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
          keyExtractor={item => item.matchId}
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
  avatar: { borderRadius: 36, height: 72, width: 72 },
  avatarContainer: { position: 'relative' },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: '#C8853A22',
    borderColor: '#C8853A',
    borderRadius: 36,
    borderWidth: 1.5,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  avatarInitial: {
    color: '#C8853A',
    fontFamily: 'Inter-Regular',
    fontSize: 28,
    fontWeight: '700',
  },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  backIcon: { color: '#C8853A', fontSize: 22 },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  container: { backgroundColor: '#0D0A06', flex: 1 },
  discoverButton: {
    borderColor: '#C8853A',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  discoverButtonText: {
    color: '#C8853A',
    fontFamily: 'Inter-Regular',
    fontSize: 15,
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: {
    color: '#F2E8D560',
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 28,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#F2E8D5',
    fontFamily: 'Inter-Regular',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#C8853A20',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#F2E8D5',
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    fontWeight: '700',
  },
  list: { padding: 16 },
  matchBio: {
    color: '#F2E8D570',
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 17,
    marginBottom: 8,
  },
  matchCard: {
    backgroundColor: '#161009',
    borderColor: '#C8853A20',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  matchCity: {
    color: '#F2E8D550',
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginBottom: 6,
  },
  matchDot: {
    backgroundColor: '#C8853A',
    borderColor: '#161009',
    borderRadius: 6,
    borderWidth: 2,
    bottom: 2,
    height: 12,
    position: 'absolute',
    right: 2,
    width: 12,
  },
  matchInfo: { flex: 1 },
  matchName: {
    color: '#F2E8D5',
    fontFamily: 'Inter-Regular',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  matchedAt: {
    color: '#F2E8D530',
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  separator: { height: 10 },
})
