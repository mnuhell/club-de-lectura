import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { LITERARY_GENRES } from '@/src/domain/ReaderProfile'
import { GenreChip } from './GenreChip'

interface Props {
  selected: string[]
  onChange: (genres: string[]) => void
  max?: number
}

export function GenreSelector({ selected, onChange, max = 5 }: Props) {
  const toggle = (genre: string) => {
    if (selected.includes(genre)) {
      onChange(selected.filter((g) => g !== genre))
    } else if (selected.length < max) {
      onChange([...selected, genre])
    }
  }

  return (
    <View>
      <Text style={styles.hint}>
        Elige hasta {max} géneros que te apasionen
      </Text>
      <View style={styles.grid}>
        {LITERARY_GENRES.map((genre) => (
          <GenreChip
            key={genre}
            genre={genre}
            selected={selected.includes(genre)}
            onPress={() => toggle(genre)}
          />
        ))}
      </View>
      {selected.length > 0 && (
        <Text style={styles.counter}>
          {selected.length} de {max} elegidos
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  hint: {
    color: '#F2E8D560',
    fontSize: 13,
    fontFamily: 'SpaceMono',
    marginBottom: 12,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  counter: {
    color: '#C8853A',
    fontSize: 12,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    marginTop: 8,
  },
})
