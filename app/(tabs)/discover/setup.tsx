import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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

  // Hero animation
  const heroAnim = useRef(new Animated.Value(0)).current
  const formAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.spring(heroAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
      Animated.spring(formAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 10 }),
    ]).start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
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

  const heroTranslateY = heroAnim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] })
  const formTranslateY = formAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] })

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#C8853A" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Ambient glow */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <Animated.View
          style={[styles.hero, { opacity: heroAnim, transform: [{ translateY: heroTranslateY }] }]}
        >
          <View style={styles.heroIconWrap}>
            <Ionicons name="book" size={36} color="#C8853A" />
          </View>
          <Text style={styles.title}>Tu perfil lector</Text>
          <Text style={styles.subtitle}>
            Así te conocerán otros lectores antes de que decidan si quieren leer contigo.
          </Text>

          {/* Privacy callout */}
          <View style={styles.privacyCard}>
            <Ionicons name="eye-off-outline" size={16} color="#C8853A" />
            <View style={styles.privacyBody}>
              <Text style={styles.privacyTitle}>Foto revelada solo en coincidencia</Text>
              <Text style={styles.privacyText}>
                Lo que importa primero es lo que lees, no cómo te ves.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Form */}
        <Animated.View
          style={[styles.form, { opacity: formAnim, transform: [{ translateY: formTranslateY }] }]}
        >
          {/* City */}
          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <Ionicons name="location-outline" size={13} color="#C8853A" />
              <Text style={styles.fieldLabel}>CIUDAD</Text>
              <Text style={styles.fieldOptional}>opcional</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Madrid, Barcelona, Buenos Aires…"
              placeholderTextColor="#F2E8D525"
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
            />
          </View>

          {/* Bio */}
          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <Ionicons name="chatbubble-ellipses-outline" size={13} color="#C8853A" />
              <Text style={styles.fieldLabel}>FRASE LECTORA</Text>
              <Text style={styles.fieldOptional}>opcional</Text>
            </View>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Lo que te define como lector en una frase…"
              placeholderTextColor="#F2E8D525"
              value={readerBio}
              onChangeText={setReaderBio}
              multiline
              maxLength={120}
            />
            <Text style={styles.charCount}>{readerBio.length}/120</Text>
          </View>

          {/* Genres */}
          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <Ionicons name="library-outline" size={13} color="#C8853A" />
              <Text style={styles.fieldLabel}>GÉNEROS QUE TE APASIONAN</Text>
            </View>
            <Text style={styles.fieldHint}>
              Elige hasta 5. Los compartidos con otros lectores se resaltan.
            </Text>
            <GenreSelector selected={selected} onChange={setSelected} max={5} />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* CTA */}
          <TouchableOpacity
            style={[styles.button, (saving || selected.length === 0) && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving || selected.length === 0}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#0D0A06" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#0D0A06" />
                <Text style={styles.buttonText}>Guardar perfil lector</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  ambientGlow: {
    backgroundColor: '#C8853A',
    borderRadius: 250,
    height: 250,
    left: '50%',
    opacity: 0.05,
    position: 'absolute',
    top: -80,
    transform: [{ translateX: -125 }],
    width: 250,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#C8853A',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: {
    color: '#0D0A06',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    color: '#F2E8D535',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  center: { alignItems: 'center', backgroundColor: '#0D0A06', flex: 1, justifyContent: 'center' },
  charCount: {
    color: '#F2E8D530',
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  divider: {
    backgroundColor: '#C8853A18',
    height: 1,
    marginBottom: 24,
    marginTop: 8,
  },
  field: { marginBottom: 20 },
  fieldHint: {
    color: '#F2E8D535',
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
    marginTop: -2,
  },
  fieldLabel: {
    color: '#C8853A',
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  fieldLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  fieldOptional: {
    color: '#F2E8D530',
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    marginLeft: 2,
  },
  form: { paddingTop: 8 },
  hero: {
    alignItems: 'center',
    paddingBottom: 32,
    paddingTop: 16,
  },
  heroIconWrap: {
    alignItems: 'center',
    backgroundColor: '#C8853A15',
    borderColor: '#C8853A35',
    borderRadius: 44,
    borderWidth: 1,
    elevation: 8,
    height: 88,
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#C8853A',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    width: 88,
  },
  input: {
    backgroundColor: '#161009',
    borderColor: '#C8853A28',
    borderRadius: 12,
    borderWidth: 1,
    color: '#F2E8D5',
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  inputMulti: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  privacyBody: { flex: 1, gap: 2 },
  privacyCard: {
    alignItems: 'flex-start',
    backgroundColor: '#C8853A10',
    borderColor: '#C8853A28',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  privacyText: {
    color: '#F2E8D545',
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  privacyTitle: {
    color: '#C8853A',
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  safeArea: { backgroundColor: '#0D0A06', flex: 1 },
  subtitle: {
    color: '#F2E8D555',
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    color: '#F2E8D5',
    fontFamily: 'Playfair-Bold',
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
})
