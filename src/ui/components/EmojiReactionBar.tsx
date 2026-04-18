import { colors } from '../theme'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { ReactionSummary } from '../../domain'
import { useState } from 'react'

const EMOJI_SET = ['📚', '❤️', '😂', '👏', '🤔', '💡']

interface Props {
  reactions: ReactionSummary[]
  onToggle: (emoji: string) => void
}

export function EmojiReactionBar({ reactions, onToggle }: Props) {
  const [pickerVisible, setPickerVisible] = useState(false)

  function handleEmoji(emoji: string) {
    onToggle(emoji)
    setPickerVisible(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.badgesRow}>
        {reactions.map(r => (
          <TouchableOpacity
            key={r.emoji}
            style={[styles.badge, r.reactedByMe && styles.badgeActive]}
            onPress={() => onToggle(r.emoji)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{r.emoji}</Text>
            <Text style={[styles.count, r.reactedByMe && styles.countActive]}>{r.count}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setPickerVisible(v => !v)}
          activeOpacity={0.7}
        >
          <Text style={styles.addText}>{pickerVisible ? '✕' : '+'}</Text>
        </TouchableOpacity>
      </View>

      {pickerVisible && (
        <View style={styles.picker}>
          {EMOJI_SET.map(emoji => (
            <TouchableOpacity
              key={emoji}
              style={styles.pickerItem}
              onPress={() => handleEmoji(emoji)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 12,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  addText: { color: colors.textMuted, fontSize: 16, lineHeight: 20 },
  badge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeActive: {
    backgroundColor: colors.amberFaint,
    borderColor: colors.amber,
  },
  badgesRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  container: { gap: 8, marginTop: 10 },
  count: { color: colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 11 },
  countActive: { color: colors.amber },
  emoji: { fontSize: 14 },
  picker: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pickerEmoji: { fontSize: 22 },
  pickerItem: { padding: 6 },
})
