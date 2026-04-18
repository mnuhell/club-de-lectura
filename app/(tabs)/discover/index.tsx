import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useDiscover, useMatches, useReaderPreferences } from '@/src/ui/hooks/useDiscover'
import { ReaderCard } from '@/src/ui/components/ReaderCard'
import { MatchCelebration } from '@/src/ui/components/MatchCelebration'
import type { ReaderMatch } from '@/src/domain/ReaderProfile'
import { MatchingRepository } from '@/src/infrastructure/supabase/repositories/MatchingRepository'

export default function DiscoverScreen() {
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const { genres, loading: genresLoading } = useReaderPreferences(userId)
  const { readers, loading, error, newMatch, like, pass, clearNewMatch, reload } = useDiscover(userId)
  const { matches } = useMatches(userId)
  const [celebrationMatch, setCelebrationMatch] = useState<ReaderMatch | null>(null)

  // When a match occurs, fetch the match data to show celebration
  React.useEffect(() => {
    if (newMatch) {
      MatchingRepository.getMatches(userId).then((allMatches) => {
        const found = allMatches.find((m) => m.matchId === newMatch)
        if (found) setCelebrationMatch(found)
        clearNewMatch()
      })
    }
  }, [newMatch, userId, clearNewMatch])

  const handleViewMatch = (matchId: string) => {
    setCelebrationMatch(null)
    router.push(`/discover/match/${matchId}`)
  }

  const handleDismissCelebration = () => {
    setCelebrationMatch(null)
  }

  if (genresLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#C8853A" />
      </View>
    )
  }

  // No genres set — prompt setup
  if (genres.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptySetup}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>Completa tu perfil lector</Text>
          <Text style={styles.emptyText}>
            Cuéntanos qué géneros te apasionan para encontrar lectores afines a ti.
            {'\n\n'}La foto se revela solo si hay match — lo que importa primero es lo que lees.
          </Text>
          <TouchableOpacity
            style={styles.setupButton}
            onPress={() => router.push('/discover/setup')}
          >
            <Text style={styles.setupButtonText}>Crear mi perfil lector</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Descubrir</Text>
        <TouchableOpacity
          style={styles.matchesButton}
          onPress={() => router.push('/discover/matches')}
        >
          <Text style={styles.matchesIcon}>♥</Text>
          {matches.length > 0 && (
            <View style={styles.matchesBadge}>
              <Text style={styles.matchesBadgeText}>{matches.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Card stack */}
      <View style={styles.stack}>
        {loading ? (
          <ActivityIndicator color="#C8853A" size="large" />
        ) : error ? (
          <View style={styles.emptyStack}>
            <Text style={styles.emptyIcon}>⚠️</Text>
            <Text style={styles.emptyTitle}>No se pudo conectar</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.reloadButton} onPress={reload}>
              <Text style={styles.reloadText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : readers.length === 0 ? (
          <View style={styles.emptyStack}>
            <Text style={styles.emptyIcon}>🔭</Text>
            <Text style={styles.emptyTitle}>Sin más lectores por ahora</Text>
            <Text style={styles.emptyText}>
              Has explorado todos los lectores disponibles en tu zona.
              Vuelve más tarde o amplía tu ciudad.
            </Text>
            <TouchableOpacity style={styles.reloadButton} onPress={reload}>
              <Text style={styles.reloadText}>Volver a buscar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => router.push('/discover/setup')}
            >
              <Text style={styles.editProfileText}>Editar perfil lector</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Show top 2 cards (stacked visually)
          <>
            {readers.slice(0, 2).map((reader, i) => (
              <View
                key={reader.id}
                style={[
                  styles.cardWrapper,
                  i === 1 && styles.cardBehind,
                ]}
                pointerEvents={i === 0 ? 'auto' : 'none'}
              >
                <ReaderCard
                  reader={reader}
                  isTop={i === 0}
                  onLike={() => like(reader.id)}
                  onPass={() => pass(reader.id)}
                />
              </View>
            ))}
          </>
        )}
      </View>

      {/* Match celebration overlay */}
      <MatchCelebration
        match={celebrationMatch}
        onViewMatch={handleViewMatch}
        onDismiss={handleDismissCelebration}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A06' },
  center: { flex: 1, backgroundColor: '#0D0A06', alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#C8853A20',
  },
  headerTitle: {
    color: '#F2E8D5',
    fontSize: 22,
    fontFamily: 'Georgia',
    fontWeight: '700',
  },
  matchesButton: {
    position: 'relative',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchesIcon: {
    color: '#C8853A',
    fontSize: 22,
  },
  matchesBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#C8853A',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  matchesBadgeText: {
    color: '#0D0A06',
    fontSize: 10,
    fontFamily: 'SpaceMono',
    fontWeight: '700',
  },
  stack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cardWrapper: {
    position: 'absolute',
    width: '100%',
  },
  cardBehind: {
    transform: [{ scale: 0.95 }, { translateY: 10 }],
    opacity: 0.7,
  },
  emptySetup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStack: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
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
  setupButton: {
    backgroundColor: '#C8853A',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  setupButtonText: {
    color: '#0D0A06',
    fontSize: 15,
    fontFamily: 'SpaceMono',
    fontWeight: '700',
  },
  reloadButton: {
    borderWidth: 1,
    borderColor: '#C8853A',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 12,
  },
  reloadText: {
    color: '#C8853A',
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
  editProfileButton: {
    paddingVertical: 10,
  },
  editProfileText: {
    color: '#F2E8D550',
    fontSize: 13,
    fontFamily: 'SpaceMono',
  },
})
