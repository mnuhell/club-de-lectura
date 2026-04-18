import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useReaderPreferences } from '@/src/ui/hooks/useDiscover'
import { GenreSelector } from '@/src/ui/components/GenreSelector'

export default function DiscoverSetupScreen() {
  const { user } = useAuth()
  const { genres, loading, saving, saveGenres, saveReaderProfile } = useReaderPreferences(
    user?.id ?? '',
  )
  const [selected, setSelected] = useState<string[]>(genres)
  const [city, setCity] = useState('')
  const [readerBio, setReaderBio] = useState('')
  const [initialized, setInitialized] = useState(false)

  React.useEffect(() => {
    if (!loading && !initialized) {
      setSelected(genres)
      setInitialized(true)
    }
  }, [loading, genres, initialized])

  const handleSave = async () => {
    if (selected.length === 0) {
      Alert.alert('Elige tus géneros', 'Selecciona al menos un género literario para continuar')
      return
    }
    try {
      await saveGenres(selected)
      await saveReaderProfile({
        city: city.trim() || undefined,
        readerBio: readerBio.trim() || undefined,
      })
      router.back()
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar')
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#C8853A" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tu perfil lector</Text>
      <Text style={styles.subtitle}>
        Así es como otros lectores te van a conocer. La foto se revela solo si hay match.
      </Text>

      <Text style={styles.sectionLabel}>Ciudad (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Madrid, Barcelona, Buenos Aires…"
        placeholderTextColor="#F2E8D530"
        value={city}
        onChangeText={setCity}
        autoCapitalize="words"
      />

      <Text style={styles.sectionLabel}>Frase lectora (opcional)</Text>
      <TextInput
        style={[styles.input, styles.inputMulti]}
        placeholder="Lo que te define como lector en una frase…"
        placeholderTextColor="#F2E8D530"
        value={readerBio}
        onChangeText={setReaderBio}
        multiline
        maxLength={120}
      />

      <Text style={styles.sectionLabel}>Géneros que te apasionan</Text>
      <GenreSelector selected={selected} onChange={setSelected} max={5} />

      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#0D0A06" />
        ) : (
          <Text style={styles.buttonText}>Guardar perfil lector</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A06' },
  content: { padding: 24, paddingBottom: 48 },
  center: { flex: 1, backgroundColor: '#0D0A06', alignItems: 'center', justifyContent: 'center' },
  title: {
    color: '#F2E8D5',
    fontSize: 26,
    fontFamily: 'Georgia',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    color: '#F2E8D560',
    fontSize: 14,
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  sectionLabel: {
    color: '#C8853A',
    fontSize: 12,
    fontFamily: 'SpaceMono',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#161009',
    borderWidth: 1,
    borderColor: '#C8853A30',
    borderRadius: 12,
    color: '#F2E8D5',
    fontFamily: 'Georgia',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputMulti: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#C8853A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: '#0D0A06',
    fontSize: 15,
    fontFamily: 'SpaceMono',
    fontWeight: '700',
  },
})
