import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'

interface Props {
  genre: string
  selected?: boolean
  onPress?: () => void
  small?: boolean
}

export function GenreChip({ genre, selected = false, onPress, small = false }: Props) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.selected, small && styles.small]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Text style={[styles.text, selected && styles.textSelected, small && styles.textSmall]}>
        {genre}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C8853A40',
    backgroundColor: '#161009',
    margin: 4,
  },
  selected: {
    backgroundColor: '#C8853A22',
    borderColor: '#C8853A',
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    margin: 2,
  },
  text: {
    color: '#F2E8D580',
    fontSize: 13,
    fontFamily: 'SpaceMono',
  },
  textSelected: {
    color: '#C8853A',
  },
  textSmall: {
    fontSize: 11,
  },
})
