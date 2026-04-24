import { SafeAreaView } from 'react-native-safe-area-context'
import type { ReaderMatch } from '@/src/domain/ReaderProfile'
import { GenreChip } from '@/src/ui/components/GenreChip'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useMatches } from '@/src/ui/hooks/useDiscover'
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

export default function MatchesScreen() {
  const { user } = useAuth()
  const { matches, loading, reload } = useMatches(user?.id ?? '')

  const renderMatch = ({ item }: { item: ReaderMatch }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => router.push(`/discover/match/${item.matchId}`)}
      activeOpacity={0.72}
    >
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
        {item.reader.city && (
          <View style={styles.cityRow}>
            <Ionicons name="location-outline" size={12} color="#F2E8D545" />
            <Text style={styles.matchCity}>{item.reader.city}</Text>
          </View>
        )}
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

      <Ionicons name="chevron-forward" size={16} color="#C8853A40" style={styles.chevron} />
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#C8853A" />
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
          <View style={styles.emptyIconWrap}>
            <Ionicons name="heart-outline" size={32} color="#C8853A60" />
          </View>
          <Text style={styles.emptyTitle}>Aún no hay coincidencias</Text>
          <Text style={styles.emptyText}>
            Sigue descubriendo lectores. Cuando alguien comparta tus gustos y se gusten
            mutuamente, verás aquí su foto y su perfil completo.
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
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  avatar: { borderRadius: 38, height: 76, width: 76 },
  avatarContainer: { position: 'relative' },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: '#C8853A18',
    borderColor: '#C8853A50',
    borderRadius: 38,
    borderWidth: 1.5,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  avatarInitial: {
    color: '#C8853A',
    fontFamily: 'Playfair-Bold',
    fontSize: 30,
  },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  chevron: { alignSelf: 'center' },
  cityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    marginBottom: 6,
  },
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
    fontFamily: 'Inter-Medium',
    fontSize: 15,
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconWrap: {
    alignItems: 'center',
    backgroundColor: '#C8853A15',
    borderColor: '#C8853A30',
    borderRadius: 32,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    marginBottom: 20,
    width: 72,
  },
  emptyText: {
    color: '#F2E8D555',
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#F2E8D5',
    fontFamily: 'Playfair-Bold',
    fontSize: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
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
    fontFamily: 'Playfair-Bold',
    fontSize: 20,
  },
  list: { padding: 16, paddingBottom: 32 },
  matchBio: {
    color: '#F2E8D565',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  matchCard: {
    alignItems: 'center',
    backgroundColor: '#161009',
    borderColor: '#C8853A20',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  matchCity: {
    color: '#F2E8D545',
    fontFamily: 'Inter-Regular',
    fontSize: 12,
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
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    marginBottom: 3,
  },
  matchedAt: {
    color: '#F2E8D528',
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },
  separator: { height: 10 },
})
