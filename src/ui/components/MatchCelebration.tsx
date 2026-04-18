import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  Image,
  Dimensions,
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

  useEffect(() => {
    if (match) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.delay(600),
        Animated.spring(avatarReveal, { toValue: 1, useNativeDriver: true, tension: 40, friction: 6 }),
      ]).start()
    } else {
      scale.setValue(0)
      opacity.setValue(0)
      avatarReveal.setValue(0)
    }
  }, [match])

  if (!match) return null

  const avatarScale = avatarReveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  })

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
          <Text style={styles.title}>¡Coincidencia literaria!</Text>
          <Text style={styles.subtitle}>
            Tú y {match.reader.fullName} compartís los mismos gustos lectores
          </Text>

          {/* Avatar reveal — the key moment */}
          <View style={styles.avatarWrapper}>
            <Text style={styles.revealHint}>Ya puedes ver su foto</Text>
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
            <Text style={styles.city}>📍 {match.reader.city}</Text>
          )}

          <TouchableOpacity style={styles.button} onPress={() => onViewMatch(match.matchId)}>
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
    flex: 1,
    backgroundColor: '#0D0A06EE',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#161009',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#C8853A',
    padding: 32,
    alignItems: 'center',
    width: width - 48,
  },
  title: {
    color: '#C8853A',
    fontSize: 26,
    fontFamily: 'Georgia',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#F2E8D580',
    fontSize: 14,
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  revealHint: {
    color: '#C8853A60',
    fontSize: 11,
    fontFamily: 'SpaceMono',
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2.5,
    borderColor: '#C8853A',
    overflow: 'hidden',
    shadowColor: '#C8853A',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    backgroundColor: '#C8853A22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#C8853A',
    fontSize: 44,
    fontFamily: 'Georgia',
    fontWeight: '700',
  },
  name: {
    color: '#F2E8D5',
    fontSize: 20,
    fontFamily: 'Georgia',
    fontWeight: '600',
    marginTop: 8,
  },
  city: {
    color: '#F2E8D560',
    fontSize: 13,
    fontFamily: 'SpaceMono',
    marginTop: 4,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#C8853A',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#0D0A06',
    fontSize: 15,
    fontFamily: 'SpaceMono',
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#F2E8D550',
    fontSize: 13,
    fontFamily: 'SpaceMono',
  },
})
