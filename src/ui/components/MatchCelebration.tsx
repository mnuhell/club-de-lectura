import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useRef } from 'react'
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import type { ReaderMatch } from '@/src/domain/ReaderProfile'

const { width } = Dimensions.get('window')

interface Props {
  match: ReaderMatch | null
  onViewMatch: (matchId: string) => void
  onDismiss: () => void
}

export function MatchCelebration({ match, onViewMatch, onDismiss }: Props) {
  const scale = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current
  const avatarReveal = useRef(new Animated.Value(0)).current
  const heartScale = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (match) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.delay(400),
        Animated.parallel([
          Animated.spring(avatarReveal, {
            toValue: 1,
            useNativeDriver: true,
            tension: 40,
            friction: 6,
          }),
          Animated.spring(heartScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 80,
            friction: 5,
          }),
        ]),
      ]).start()
    } else {
      scale.setValue(0)
      opacity.setValue(0)
      avatarReveal.setValue(0)
      heartScale.setValue(0)
    }
  }, [match])

  if (!match) return null

  const avatarScale = avatarReveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 1],
  })

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
          {/* Animated heart icon */}
          <Animated.View style={[styles.heartWrap, { transform: [{ scale: heartScale }] }]}>
            <Ionicons name="heart" size={28} color="#C8853A" />
          </Animated.View>

          <Text style={styles.title}>¡Coincidencia literaria!</Text>
          <Text style={styles.subtitle}>
            Tú y {match.reader.fullName} compartís los mismos gustos lectores
          </Text>

          {/* Avatar reveal */}
          <View style={styles.avatarWrapper}>
            <Text style={styles.revealHint}>YA PUEDES VER SU FOTO</Text>
            <Animated.View
              style={[
                styles.avatarContainer,
                { transform: [{ scale: avatarScale }], opacity: avatarReveal },
              ]}
            >
              {match.reader.avatarUrl ? (
                <Image source={{ uri: match.reader.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {match.reader.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </Animated.View>
          </View>

          <Text style={styles.name}>{match.reader.fullName}</Text>
          {match.reader.city && (
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={13} color="#F2E8D550" />
              <Text style={styles.city}>{match.reader.city}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={() => onViewMatch(match.matchId)} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Ver mi coincidencia</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onDismiss}>
            <Text style={styles.secondaryButtonText}>Seguir descubriendo</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: '#0D0A06EE',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#161009',
    borderColor: '#C8853A',
    borderRadius: 28,
    borderWidth: 1,
    padding: 32,
    shadowColor: '#C8853A',
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 10,
    width: width - 48,
  },
  heartWrap: {
    alignItems: 'center',
    backgroundColor: '#C8853A18',
    borderColor: '#C8853A40',
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    marginBottom: 16,
    width: 56,
  },
  title: {
    color: '#C8853A',
    fontFamily: 'Playfair-Bold',
    fontSize: 26,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#F2E8D575',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 14,
  },
  revealHint: {
    color: '#C8853A55',
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  avatarContainer: {
    borderColor: '#C8853A',
    borderRadius: 58,
    borderWidth: 2.5,
    elevation: 8,
    height: 116,
    overflow: 'hidden',
    shadowColor: '#C8853A',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    width: 116,
  },
  avatar: {
    height: '100%',
    width: '100%',
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: '#C8853A22',
    flex: 1,
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#C8853A',
    fontFamily: 'Playfair-Bold',
    fontSize: 46,
  },
  name: {
    color: '#F2E8D5',
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  cityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 24,
    marginTop: 4,
  },
  city: {
    color: '#F2E8D555',
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#C8853A',
    borderRadius: 14,
    marginBottom: 10,
    paddingHorizontal: 28,
    paddingVertical: 15,
    width: '100%',
  },
  buttonText: {
    color: '#0D0A06',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#F2E8D540',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
})
