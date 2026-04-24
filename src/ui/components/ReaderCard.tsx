import type { ReaderProfile } from '@/src/domain/ReaderProfile'
import { Ionicons } from '@expo/vector-icons'
import React, { useRef } from 'react'
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
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
        {/* LEER JUNTOS swipe label */}
        <Animated.View style={[styles.label, styles.likeLabel, { opacity: likeOpacity }]}>
          <Text style={styles.likeText}>LEER JUNTOS</Text>
        </Animated.View>
        {/* PASAR swipe label */}
        <Animated.View style={[styles.label, styles.passLabel, { opacity: passOpacity }]}>
          <Text style={styles.passText}>PASAR</Text>
        </Animated.View>

        {/* Avatar placeholder — only revealed after match */}
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="book" size={42} color="#C8853A" />
          <View style={styles.avatarGlow} />
        </View>

        {/* Name */}
        <Text style={styles.name}>{reader.fullName}</Text>

        {/* City */}
        {reader.city && (
          <View style={styles.cityRow}>
            <Ionicons name="location-outline" size={13} color="#F2E8D550" />
            <Text style={styles.city}>{reader.city}</Text>
          </View>
        )}

        {/* Shared genres badge */}
        {sharedCount > 0 && (
          <View style={styles.sharedBadge}>
            <Ionicons name="star" size={11} color="#C8853A" />
            <Text style={styles.sharedText}>
              {sharedCount} género{sharedCount > 1 ? 's' : ''} en común
            </Text>
          </View>
        )}

        {/* Bio */}
        {reader.readerBio ? (
          <Text style={styles.bio}>{reader.readerBio}</Text>
        ) : null}

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
          <TouchableOpacity style={[styles.btn, styles.passBtn]} onPress={handlePass} activeOpacity={0.8}>
            <Ionicons name="close" size={28} color="#888" />
          </TouchableOpacity>
          <View style={styles.hintWrap}>
            <Text style={styles.hintText}>desliza o toca</Text>
          </View>
          <TouchableOpacity style={[styles.btn, styles.likeBtn]} onPress={handleLike} activeOpacity={0.8}>
            <Ionicons name="heart" size={26} color="#C8853A" />
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
    alignItems: 'center',
    backgroundColor: '#161009',
    borderColor: '#C8853A25',
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 440,
    padding: 28,
    shadowColor: '#C8853A',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
    width: SCREEN_WIDTH - 32,
  },
  label: {
    borderRadius: 8,
    borderWidth: 2.5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    position: 'absolute',
    top: 28,
    zIndex: 10,
  },
  likeLabel: {
    borderColor: '#C8853A',
    right: 16,
    transform: [{ rotate: '14deg' }],
  },
  likeText: {
    color: '#C8853A',
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  passLabel: {
    borderColor: '#666',
    left: 16,
    transform: [{ rotate: '-14deg' }],
  },
  passText: {
    color: '#666',
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#0D0A06',
    borderColor: '#C8853A30',
    borderRadius: 52,
    borderWidth: 2,
    height: 104,
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 12,
    position: 'relative',
    width: 104,
  },
  avatarGlow: {
    backgroundColor: '#C8853A',
    borderRadius: 40,
    bottom: -8,
    height: 16,
    left: '50%',
    opacity: 0.08,
    position: 'absolute',
    width: 80,
    transform: [{ translateX: -40 }],
  },
  name: {
    color: '#F2E8D5',
    fontFamily: 'Playfair-Bold',
    fontSize: 26,
    marginBottom: 6,
    textAlign: 'center',
  },
  cityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 14,
  },
  city: {
    color: '#F2E8D550',
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
  sharedBadge: {
    alignItems: 'center',
    backgroundColor: '#C8853A18',
    borderColor: '#C8853A60',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  sharedText: {
    color: '#C8853A',
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  bio: {
    color: '#F2E8D575',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  moreGenres: {
    alignSelf: 'center',
    color: '#F2E8D540',
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginLeft: 2,
  },
  buttons: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    marginTop: 22,
  },
  hintWrap: {
    alignItems: 'center',
    width: 72,
  },
  hintText: {
    color: '#F2E8D525',
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    letterSpacing: 0.3,
  },
  btn: {
    alignItems: 'center',
    borderRadius: 36,
    elevation: 4,
    height: 68,
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    width: 68,
  },
  passBtn: {
    backgroundColor: '#1a1410',
    borderColor: '#444',
    borderWidth: 1.5,
    shadowColor: '#000',
  },
  likeBtn: {
    backgroundColor: '#C8853A18',
    borderColor: '#C8853A',
    borderWidth: 1.5,
    shadowColor: '#C8853A',
  },
})
