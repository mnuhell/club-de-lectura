import React, { useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from 'react-native'
import type { ReaderProfile } from '@/src/domain/ReaderProfile'
import { GenreChip } from './GenreChip'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3

interface Props {
  reader: ReaderProfile
  onLike: () => void
  onPass: () => void
  isTop: boolean
}

export function ReaderCard({ reader, onLike, onPass, isTop }: Props) {
  const position = useRef(new Animated.ValueXY()).current
  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  })
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH * 0.25],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })
  const passOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.25, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTop,
      onPanResponderMove: (_, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy })
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          Animated.spring(position, {
            toValue: { x: SCREEN_WIDTH + 100, y: gestureState.dy },
            useNativeDriver: true,
          }).start(onLike)
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          Animated.spring(position, {
            toValue: { x: -SCREEN_WIDTH - 100, y: gestureState.dy },
            useNativeDriver: true,
          }).start(onPass)
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start()
        }
      },
    }),
  ).current

  const handleLike = () => {
    Animated.spring(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      useNativeDriver: true,
    }).start(onLike)
  }

  const handlePass = () => {
    Animated.spring(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      useNativeDriver: true,
    }).start(onPass)
  }

  const sharedCount = reader.sharedGenreCount ?? 0

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate: rotation },
            ],
          },
        ]}
        {...(isTop ? panResponder.panHandlers : {})}
      >
        {/* LIKE label */}
        <Animated.View style={[styles.label, styles.likeLabel, { opacity: likeOpacity }]}>
          <Text style={styles.likeText}>LEER JUNTOS</Text>
        </Animated.View>
        {/* PASS label */}
        <Animated.View style={[styles.label, styles.passLabel, { opacity: passOpacity }]}>
          <Text style={styles.passText}>PASAR</Text>
        </Animated.View>

        {/* Avatar placeholder — nunca se muestra aquí, solo tras el match */}
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarIcon}>📖</Text>
        </View>

        {/* Name + city */}
        <Text style={styles.name}>{reader.fullName}</Text>
        {reader.city && <Text style={styles.city}>📍 {reader.city}</Text>}

        {/* Shared genres badge */}
        {sharedCount > 0 && (
          <View style={styles.sharedBadge}>
            <Text style={styles.sharedText}>
              {sharedCount} género{sharedCount > 1 ? 's' : ''} en común
            </Text>
          </View>
        )}

        {/* Reader bio */}
        {reader.readerBio ? <Text style={styles.bio}>"{reader.readerBio}"</Text> : null}

        {/* Genres */}
        <View style={styles.genresRow}>
          {reader.genres.slice(0, 4).map(g => (
            <GenreChip key={g} genre={g} selected={sharedCount > 0} small />
          ))}
          {reader.genres.length > 4 && (
            <Text style={styles.moreGenres}>+{reader.genres.length - 4}</Text>
          )}
        </View>
      </Animated.View>

      {/* Action buttons */}
      {isTop && (
        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.btn, styles.passBtn]} onPress={handlePass}>
            <Text style={styles.passIcon}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.likeBtn]} onPress={handleLike}>
            <Text style={styles.likeIcon}>♥</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  card: {
    width: SCREEN_WIDTH - 32,
    backgroundColor: '#161009',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C8853A30',
    padding: 24,
    alignItems: 'center',
    minHeight: 420,
    shadowColor: '#C8853A',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  label: {
    position: 'absolute',
    top: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    zIndex: 10,
  },
  likeLabel: {
    right: 16,
    borderColor: '#C8853A',
    transform: [{ rotate: '15deg' }],
  },
  likeText: {
    color: '#C8853A',
    fontFamily: 'SpaceMono',
    fontSize: 13,
    fontWeight: 'bold',
  },
  passLabel: {
    left: 16,
    borderColor: '#666',
    transform: [{ rotate: '-15deg' }],
  },
  passText: {
    color: '#666',
    fontFamily: 'SpaceMono',
    fontSize: 13,
    fontWeight: 'bold',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0D0A06',
    borderWidth: 2,
    borderColor: '#C8853A30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  avatarIcon: {
    fontSize: 40,
  },
  name: {
    color: '#F2E8D5',
    fontSize: 22,
    fontFamily: 'Georgia',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  city: {
    color: '#F2E8D560',
    fontSize: 13,
    fontFamily: 'SpaceMono',
    marginBottom: 12,
  },
  sharedBadge: {
    backgroundColor: '#C8853A22',
    borderWidth: 1,
    borderColor: '#C8853A',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  sharedText: {
    color: '#C8853A',
    fontSize: 12,
    fontFamily: 'SpaceMono',
  },
  bio: {
    color: '#F2E8D580',
    fontSize: 14,
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
    lineHeight: 20,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  moreGenres: {
    color: '#F2E8D540',
    fontSize: 12,
    fontFamily: 'SpaceMono',
    alignSelf: 'center',
    marginLeft: 4,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: 20,
  },
  btn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  passBtn: {
    backgroundColor: '#1a1410',
    borderWidth: 1.5,
    borderColor: '#555',
    shadowColor: '#555',
  },
  likeBtn: {
    backgroundColor: '#C8853A22',
    borderWidth: 1.5,
    borderColor: '#C8853A',
    shadowColor: '#C8853A',
  },
  passIcon: {
    color: '#888',
    fontSize: 24,
    fontWeight: '300',
  },
  likeIcon: {
    color: '#C8853A',
    fontSize: 24,
  },
})
