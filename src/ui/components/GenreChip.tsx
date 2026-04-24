import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'

interface Props {
  genre: string
  selected?: boolean
  onPress?: () => void
  small?: boolean
  light?: boolean
}

export function GenreChip({
  genre,
  selected = false,
  onPress,
  small = false,
  light = false,
}: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        light ? styles.chipLight : styles.chipDark,
        selected && (light ? styles.selectedLight : styles.selectedDark),
        small && styles.small,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Text
        style={[
          styles.text,
          light ? styles.textLight : styles.textDark,
          selected && (light ? styles.textSelectedLight : styles.textSelectedDark),
          small && styles.textSmall,
        ]}
      >
        {genre}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    margin: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  // Dark variant — discover/swipe screens
  chipDark: {
    backgroundColor: '#161009',
    borderColor: '#C8853A40',
  },
  selectedDark: {
    backgroundColor: '#C8853A22',
    borderColor: '#C8853A',
  },
  textDark: { color: '#F2E8D580' },
  textSelectedDark: { color: '#C8853A' },
  // Light variant — main app screens
  chipLight: {
    backgroundColor: '#EDE8DF',
    borderColor: '#E0D8CE',
  },
  selectedLight: {
    backgroundColor: '#C8853A18',
    borderColor: '#C8853A',
  },
  textLight: { color: '#5C4A35' },
  textSelectedLight: { color: '#C8853A' },
  small: {
    margin: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  textSmall: { fontSize: 12 },
})
