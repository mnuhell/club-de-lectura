import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  View,
  Text,
  StyleSheet,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useMatches } from '@/src/ui/hooks/useDiscover'
import { useChat } from '@/src/ui/hooks/useChat'
import { GenreChip } from '@/src/ui/components/GenreChip'
import { colors } from '@/src/ui/theme'

const { width: SW, height: SH } = Dimensions.get('window')

function PhotoViewer({
  uri,
  name,
  visible,
  onClose,
}: {
  uri: string
  name: string
  visible: boolean
  onClose: () => void
}) {
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.88)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 70, friction: 11, useNativeDriver: true }),
      ]).start()
    } else {
      opacity.setValue(0)
      scale.setValue(0.88)
    }
  }, [visible])

  function handleClose() {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.88, duration: 180, useNativeDriver: true }),
    ]).start(onClose)
  }

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="none">
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.photoBackdrop, { opacity }]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.photoContainer, { transform: [{ scale }] }]}>
              <Image source={{ uri }} style={styles.photoFull} resizeMode="cover" />
              <View style={styles.photoNameBar}>
                <Text style={styles.photoName}>{name}</Text>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
          <TouchableOpacity style={styles.photoClose} onPress={handleClose}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { matches, loading } = useMatches(user?.id ?? '')
  const match = matches.find(m => m.matchId === id)
  const { messages } = useChat(match?.matchId ?? '', user?.id ?? '')
  const hasMessages = messages.length > 0
  const [photoVisible, setPhotoVisible] = useState(false)

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} size="large" />
      </View>
    )
  }

  if (!match) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.amber} />
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.amber} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil del lector</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── HERO ───────────────────────────────────── */}
        <View style={styles.hero}>
          {/* Warm amber wash behind avatar */}
          <View style={styles.heroWash} />

          {/* Badge */}
          <View style={styles.connectedBadge}>
            <Ionicons name="heart" size={11} color={colors.amber} />
            <Text style={styles.connectedText}>Conectados literariamente</Text>
          </View>

          {/* Avatar — tappable to expand */}
          <TouchableOpacity
            style={styles.avatarWrap}
            activeOpacity={reader.avatarUrl ? 0.85 : 1}
            onPress={() => reader.avatarUrl && setPhotoVisible(true)}
          >
            <View style={styles.avatarRing}>
              {reader.avatarUrl ? (
                <Image source={{ uri: reader.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {reader.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            {reader.avatarUrl && (
              <View style={styles.expandHint}>
                <Ionicons name="expand-outline" size={11} color={colors.white} />
              </View>
            )}
          </TouchableOpacity>

          {/* Full-screen photo viewer */}
          {reader.avatarUrl && (
            <PhotoViewer
              uri={reader.avatarUrl}
              name={reader.fullName}
              visible={photoVisible}
              onClose={() => setPhotoVisible(false)}
            />
          )}

          {/* Name */}
          <Text style={styles.name}>{reader.fullName}</Text>

          {/* City */}
          {reader.city && (
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.city}>{reader.city}</Text>
            </View>
          )}

          {/* Date */}
          <Text style={styles.matchedAt}>
            Coincidencia el{' '}
            {new Date(match.matchedAt).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>

        {/* ── CHAT BUTTON ────────────────────────────── */}
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => router.push(`/discover/chat/${match.matchId}`)}
          activeOpacity={0.85}
        >
          <Ionicons
            name={hasMessages ? 'chatbubble-ellipses' : 'chatbubble-outline'}
            size={18}
            color={colors.white}
          />
          <Text style={styles.chatButtonText}>
            {hasMessages ? 'Ver conversación' : 'Enviar mensaje'}
          </Text>
        </TouchableOpacity>

        {/* ── BIO QUOTE ──────────────────────────────── */}
        {reader.readerBio && (
          <View style={styles.bioCard}>
            <Text style={styles.quoteChar}>&ldquo;</Text>
            <Text style={styles.bio}>{reader.readerBio}</Text>
            <Text style={[styles.quoteChar, styles.quoteClose]}>&rdquo;</Text>
            <View style={styles.bioLabelRow}>
              <View style={styles.bioLabelLine} />
              <Text style={styles.bioLabel}>Su frase lectora</Text>
              <View style={styles.bioLabelLine} />
            </View>
          </View>
        )}

        {/* ── GENRES ─────────────────────────────────── */}
        {reader.genres.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Ionicons name="library-outline" size={13} color={colors.amber} />
              <Text style={styles.sectionLabel}>Sus géneros literarios</Text>
            </View>
            <View style={styles.genresGrid}>
              {reader.genres.map(g => (
                <GenreChip key={g} genre={g} selected light />
              ))}
            </View>
          </View>
        )}

        {/* ── CTA: CLUBS ─────────────────────────────── */}
        <View style={styles.ctaCard}>
          <View style={styles.ctaIconWrap}>
            <Ionicons name="people-outline" size={22} color={colors.amber} />
          </View>
          <Text style={styles.ctaTitle}>¿Leéis lo mismo?</Text>
          <Text style={styles.ctaText}>
            Crea un club de lectura e invítale con el código para empezar a leer juntos.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/(tabs)/clubs')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={15} color={colors.white} />
            <Text style={styles.ctaButtonText}>Ir a mis clubs</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  avatar: { borderRadius: 58, height: 116, width: 116 },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: colors.amberFaint,
    borderRadius: 58,
    height: 116,
    justifyContent: 'center',
    width: 116,
  },
  avatarInitial: {
    color: colors.amber,
    fontFamily: 'Playfair-Bold',
    fontSize: 46,
  },
  avatarRing: {
    borderColor: colors.amber,
    borderRadius: 64,
    borderWidth: 2,
    elevation: 4,
    padding: 4,
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  avatarWrap: { marginBottom: 18, marginTop: 8, position: 'relative' },
  expandHint: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    bottom: 4,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
    width: 20,
  },
  photoBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.92)',
    flex: 1,
    justifyContent: 'center',
  },
  photoClose: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    top: 56,
    width: 40,
  },
  photoContainer: {
    borderRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },
  photoFull: {
    height: SW,
    width: SW,
  },
  photoName: {
    color: '#fff',
    fontFamily: 'Playfair-Bold',
    fontSize: 18,
    textAlign: 'center',
  },
  photoNameBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  bio: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    fontSize: 17,
    lineHeight: 26,
    marginTop: -8,
    textAlign: 'center',
  },
  bioCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    marginHorizontal: 20,
    padding: 24,
    shadowColor: '#1A1208',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  bioLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  bioLabelLine: { backgroundColor: colors.border, flex: 1, height: 1 },
  bioLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    width: '100%',
  },
  center: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: 'center',
  },
  chatButton: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 24,
    marginHorizontal: 20,
    paddingVertical: 16,
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  chatButtonText: {
    color: colors.white,
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  city: {
    color: colors.textMuted,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  cityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
    marginTop: 2,
  },
  connectedBadge: {
    alignItems: 'center',
    backgroundColor: colors.amberFaint,
    borderColor: colors.amber + '40',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 24,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  connectedText: {
    color: colors.amber,
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  container: { backgroundColor: colors.bg, flex: 1 },
  content: { paddingBottom: 60 },
  ctaButton: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  ctaButtonText: {
    color: colors.white,
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  ctaCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 1,
    marginHorizontal: 20,
    marginTop: 8,
    padding: 24,
    shadowColor: '#1A1208',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  ctaIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.amberFaint,
    borderColor: colors.amber + '30',
    borderRadius: 24,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    marginBottom: 14,
    width: 52,
  },
  ctaText: {
    color: colors.textMuted,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  ctaTitle: {
    color: colors.textPrimary,
    fontFamily: 'Playfair-Bold',
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 15 },
  genresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
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
  headerTitle: {
    color: colors.textPrimary,
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  hero: {
    alignItems: 'center',
    paddingBottom: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    position: 'relative',
  },
  heroWash: {
    backgroundColor: colors.amber,
    borderRadius: 160,
    height: 220,
    left: '50%',
    opacity: 0.05,
    position: 'absolute',
    top: -20,
    transform: [{ translateX: -110 }],
    width: 220,
  },
  matchedAt: {
    color: colors.textMuted,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    fontSize: 12,
    marginTop: 4,
  },
  name: {
    color: colors.textPrimary,
    fontFamily: 'Playfair-Bold',
    fontSize: 30,
    marginBottom: 4,
    textAlign: 'center',
  },
  quoteChar: {
    color: colors.amber,
    fontFamily: 'Playfair-Bold',
    fontSize: 52,
    lineHeight: 52,
    marginBottom: -12,
  },
  quoteClose: { alignSelf: 'flex-end', marginBottom: 0, marginTop: -4 },
  section: { marginBottom: 16, marginHorizontal: 20 },
  sectionLabel: {
    color: colors.amber,
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionLabelRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 12 },
})
