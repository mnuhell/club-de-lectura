import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
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

  // Entry animation values
  const headerAnim = useRef(new Animated.Value(0)).current
  const contentAnim = useRef(new Animated.Value(0)).current
  const glowAnim = useRef(new Animated.Value(0)).current

  // Entry animation — only on first mount, not on every focus return
  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 70, friction: 11 }),
      Animated.spring(contentAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 10,
      }),
      Animated.timing(glowAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start()
  }, [])

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

  const headerTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  })
  const contentScale = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  })

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
        <Animated.View
          style={[
            styles.emptySetup,
            { opacity: headerAnim, transform: [{ translateY: headerTranslateY }] },
          ]}
        >
          <View style={styles.setupHeroIconWrap}>
            <Ionicons name="book" size={40} color="#C8853A" />
          </View>
          <Text style={styles.setupHeroTitle}>Descubre lectores afines</Text>
          <Text style={styles.setupHeroSubtitle}>
            Selecciona los géneros que te apasionan y encuentra personas con las que leer.
          </Text>

          <View style={styles.privacyCard}>
            <Ionicons name="eye-off-outline" size={15} color="#C8853A" />
            <Text style={styles.privacyText}>
              Las fotos solo se revelan cuando hay coincidencia mutua
            </Text>
          </View>

          <TouchableOpacity
            style={styles.setupButton}
            onPress={() => router.push('/discover/setup')}
          >
            <Ionicons name="person-add-outline" size={17} color="#0D0A06" />
            <Text style={styles.setupButtonText}>Crear mi perfil lector</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Ambient glow background */}
      <Animated.View style={[styles.ambientGlow, { opacity: glowAnim }]} pointerEvents="none" />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <View>
          <Text style={styles.headerTitle}>Descubrir</Text>
          <Text style={styles.headerSub}>lectores afines a ti</Text>
        </View>
        <TouchableOpacity
          style={styles.matchesButton}
          onPress={() => router.push('/discover/matches')}
        >
          <Ionicons name="heart" size={19} color="#C8853A" />
          {matches.length > 0 && (
            <View style={styles.matchesBadge}>
              <Text style={styles.matchesBadgeText}>{matches.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Card stack with entry animation */}
      <Animated.View
        style={[
          styles.stack,
          {
            opacity: contentAnim,
            transform: [{ scale: contentScale }],
          },
        ]}
      >
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
      </Animated.View>

      <MatchCelebration
        match={celebrationMatch}
        onViewMatch={handleViewMatch}
        onDismiss={handleDismissCelebration}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  ambientGlow: {
    backgroundColor: '#C8853A',
    borderRadius: 300,
    height: 300,
    left: '50%',
    opacity: 0.04,
    position: 'absolute',
    top: -100,
    transform: [{ translateX: -150 }],
    width: 300,
  },
  cardBehind: {
    opacity: 0.6,
    transform: [{ scale: 0.93 }, { translateY: 14 }],
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
    borderBottomColor: '#C8853A18',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerSub: {
    color: '#F2E8D535',
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    letterSpacing: 0.2,
    marginTop: 1,
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
    right: -3,
    top: -3,
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
  privacyCard: {
    alignItems: 'center',
    backgroundColor: '#C8853A10',
    borderColor: '#C8853A25',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  privacyText: {
    color: '#C8853A90',
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
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
    paddingVertical: 16,
  },
  setupButtonText: {
    color: '#0D0A06',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  setupHeroIconWrap: {
    alignItems: 'center',
    backgroundColor: '#C8853A15',
    borderColor: '#C8853A35',
    borderRadius: 40,
    borderWidth: 1,
    height: 88,
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#C8853A',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
    width: 88,
  },
  setupHeroSubtitle: {
    color: '#F2E8D555',
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  setupHeroTitle: {
    color: '#F2E8D5',
    fontFamily: 'Playfair-Bold',
    fontSize: 28,
    marginBottom: 10,
    textAlign: 'center',
  },
  stack: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
})
