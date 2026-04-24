import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
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
  const { readers, loading, error, newMatch, like, pass, clearNewMatch, reload } =
    useDiscover(userId)
  const { matches } = useMatches(userId)
  const [celebrationMatch, setCelebrationMatch] = useState<ReaderMatch | null>(null)

  React.useEffect(() => {
    if (newMatch) {
      MatchingRepository.getMatches(userId).then(allMatches => {
        const found = allMatches.find(m => m.matchId === newMatch)
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

  if (genres.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptySetup}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="library-outline" size={36} color="#C8853A" />
          </View>
          <Text style={styles.emptyTitle}>Completa tu perfil lector</Text>
          <Text style={styles.emptyText}>
            Cuéntanos qué géneros te apasionan para encontrar lectores afines a ti.
          </Text>
          <Text style={styles.emptyPrivacy}>
            La foto se revela solo si hay coincidencia — lo que importa primero es lo que lees.
          </Text>
          <TouchableOpacity
            style={styles.setupButton}
            onPress={() => router.push('/discover/setup')}
          >
            <Ionicons name="person-add-outline" size={16} color="#0D0A06" />
            <Text style={styles.setupButtonText}>Crear mi perfil lector</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Descubrir</Text>
        <TouchableOpacity
          style={styles.matchesButton}
          onPress={() => router.push('/discover/matches')}
        >
          <Ionicons name="heart" size={20} color="#C8853A" />
          {matches.length > 0 && (
            <View style={styles.matchesBadge}>
              <Text style={styles.matchesBadgeText}>{matches.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.stack}>
        {loading ? (
          <ActivityIndicator color="#C8853A" size="large" />
        ) : error ? (
          <View style={styles.emptyStack}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="wifi-outline" size={30} color="#C8853A60" />
            </View>
            <Text style={styles.emptyTitle}>No se pudo conectar</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.reloadButton} onPress={reload}>
              <Text style={styles.reloadText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : readers.length === 0 ? (
          <View style={styles.emptyStack}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="telescope-outline" size={30} color="#C8853A60" />
            </View>
            <Text style={styles.emptyTitle}>Sin más lectores por ahora</Text>
            <Text style={styles.emptyText}>
              Has explorado todos los lectores disponibles. Vuelve más tarde o amplía tu ciudad.
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
          <>
            {readers.slice(0, 2).map((reader, i) => (
              <View
                key={reader.id}
                style={[styles.cardWrapper, i === 1 && styles.cardBehind]}
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

      <MatchCelebration
        match={celebrationMatch}
        onViewMatch={handleViewMatch}
        onDismiss={handleDismissCelebration}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  cardBehind: {
    opacity: 0.65,
    transform: [{ scale: 0.94 }, { translateY: 12 }],
  },
  cardWrapper: {
    position: 'absolute',
    width: '100%',
  },
  center: { alignItems: 'center', backgroundColor: '#0D0A06', flex: 1, justifyContent: 'center' },
  container: { backgroundColor: '#0D0A06', flex: 1 },
  editProfileButton: {
    paddingVertical: 12,
  },
  editProfileText: {
    color: '#F2E8D540',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
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
  emptyPrivacy: {
    color: '#F2E8D530',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 28,
    marginTop: -8,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  emptySetup: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  emptyStack: {
    alignItems: 'center',
    padding: 32,
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
  header: {
    alignItems: 'center',
    borderBottomColor: '#C8853A20',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#F2E8D5',
    fontFamily: 'Playfair-Bold',
    fontSize: 28,
  },
  matchesBadge: {
    alignItems: 'center',
    backgroundColor: '#C8853A',
    borderColor: '#0D0A06',
    borderRadius: 8,
    borderWidth: 1.5,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -2,
    top: -2,
  },
  matchesBadgeText: {
    color: '#0D0A06',
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
  },
  matchesButton: {
    alignItems: 'center',
    backgroundColor: '#C8853A18',
    borderColor: '#C8853A40',
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    width: 40,
  },
  reloadButton: {
    borderColor: '#C8853A',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  reloadText: {
    color: '#C8853A',
    fontFamily: 'Inter-Medium',
    fontSize: 15,
  },
  setupButton: {
    alignItems: 'center',
    backgroundColor: '#C8853A',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 15,
  },
  setupButtonText: {
    color: '#0D0A06',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  stack: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
})
