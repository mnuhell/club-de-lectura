import { SafeAreaView } from 'react-native-safe-area-context'
import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useMatches } from '@/src/ui/hooks/useDiscover'
import { useChat } from '@/src/ui/hooks/useChat'
import { GenreChip } from '@/src/ui/components/GenreChip'

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { matches, loading } = useMatches(user?.id ?? '')
  const match = matches.find(m => m.matchId === id)
  const { messages } = useChat(match?.matchId ?? '', user?.id ?? '')
  const hasMessages = messages.length > 0

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#C8853A" size="large" />
      </View>
    )
  }

  if (!match) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>No se encontró la coincidencia</Text>
        </View>
      </SafeAreaView>
    )
  }

  const { reader } = match

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coincidencia literaria</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Match badge */}
        <View style={styles.matchBadge}>
          <Text style={styles.matchBadgeText}>♥ Habéis conectado</Text>
        </View>

        {/* Avatar — revealed because of the match */}
        <View style={styles.avatarWrapper}>
          {reader.avatarUrl ? (
            <Image source={{ uri: reader.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{reader.fullName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Name + city */}
        <Text style={styles.name}>{reader.fullName}</Text>
        {reader.city && <Text style={styles.city}>📍 {reader.city}</Text>}

        {/* Matched at */}
        <Text style={styles.matchedAt}>
          Coincidencia el{' '}
          {new Date(match.matchedAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>

        {/* Chat button */}
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => router.push(`/discover/chat/${match.matchId}`)}
        >
          <Text style={styles.chatButtonText}>
            {hasMessages ? '💬 Ver conversación' : '✉ Enviar mensaje'}
          </Text>
        </TouchableOpacity>

        {/* Reader bio */}
        {reader.readerBio && (
          <View style={styles.bioCard}>
            <Text style={styles.bioLabel}>Su frase lectora</Text>
            <Text style={styles.bio}>&ldquo;{reader.readerBio}&rdquo;</Text>
          </View>
        )}

        {/* Genres */}
        {reader.genres.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Sus géneros</Text>
            <View style={styles.genresGrid}>
              {reader.genres.map(g => (
                <GenreChip key={g} genre={g} selected />
              ))}
            </View>
          </View>
        )}

        {/* Invite to club CTA */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>¿Leéis lo mismo?</Text>
          <Text style={styles.ctaText}>
            Crea un club de lectura e invítale con el código para empezar a leer juntos.
          </Text>
          <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/(tabs)/clubs')}>
            <Text style={styles.ctaButtonText}>Ir a mis clubs</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A06' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D0A06' },
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
    fontSize: 17,
    fontFamily: 'Inter-Regular',
    fontWeight: '700',
  },
  content: { alignItems: 'center', padding: 24, paddingBottom: 48 },
  matchBadge: {
    backgroundColor: '#C8853A22',
    borderWidth: 1,
    borderColor: '#C8853A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 24,
  },
  matchBadgeText: {
    color: '#C8853A',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  avatarWrapper: {
    shadowColor: '#C8853A',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#C8853A',
  },
  avatarFallback: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#C8853A22',
    borderWidth: 3,
    borderColor: '#C8853A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#C8853A',
    fontSize: 48,
    fontFamily: 'Inter-Regular',
    fontWeight: '700',
  },
  name: {
    color: '#F2E8D5',
    fontSize: 26,
    fontFamily: 'Inter-Regular',
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  city: {
    color: '#F2E8D560',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  matchedAt: {
    color: '#F2E8D530',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  chatButton: {
    backgroundColor: '#C8853A',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 28,
  },
  chatButtonText: {
    color: '#0D0A06',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    fontWeight: '700',
  },
  bioCard: {
    backgroundColor: '#161009',
    borderWidth: 1,
    borderColor: '#C8853A20',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
  },
  bioLabel: {
    color: '#C8853A',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  bio: {
    color: '#F2E8D5',
    fontSize: 17,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'center',
  },
  section: { width: '100%', marginBottom: 24 },
  sectionLabel: {
    color: '#C8853A',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ctaCard: {
    backgroundColor: '#161009',
    borderWidth: 1,
    borderColor: '#C8853A30',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  ctaTitle: {
    color: '#F2E8D5',
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    fontWeight: '700',
    marginBottom: 8,
  },
  ctaText: {
    color: '#F2E8D560',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: '#C8853A',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  ctaButtonText: {
    color: '#0D0A06',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    fontWeight: '700',
  },
  errorText: {
    color: '#F2E8D560',
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
})
