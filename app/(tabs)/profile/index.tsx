import { useAuth } from '@/src/ui/hooks/useAuth'
import { useProfile } from '@/src/ui/hooks/useProfile'
import { colors } from '@/src/ui/theme'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function Avatar({ url, name, onPress }: { url: string | null; name: string; onPress: () => void }) {
  const initial = name.slice(0, 1).toUpperCase()
  return (
    <TouchableOpacity style={styles.avatarWrap} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.avatarRing}>
        {url ? (
          <Image source={{ uri: url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
      </View>
      <View style={styles.avatarBadge}>
        <Ionicons name="camera" size={11} color="#fff" />
      </View>
    </TouchableOpacity>
  )
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function EditModal({
  visible,
  initialName,
  initialBio,
  onSave,
  onClose,
}: {
  visible: boolean
  initialName: string
  initialBio: string
  onSave: (name: string, bio: string) => Promise<void>
  onClose: () => void
}) {
  const [name, setName] = useState(initialName)
  const [bio, setBio] = useState(initialBio)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(name, bio)
      onClose()
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Editar perfil</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={colors.amber} size="small" />
            ) : (
              <Text style={styles.modalSave}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.modalBody}>
          <Text style={styles.fieldLabel}>NOMBRE</Text>
          <TextInput
            style={styles.fieldInput}
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor={colors.textMuted}
            maxLength={60}
          />
          <Text style={styles.fieldLabel}>BIO</Text>
          <TextInput
            style={[styles.fieldInput, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Cuéntanos algo sobre ti..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={200}
          />
          <Text style={styles.charCount}>{bio.length}/200</Text>
        </View>
      </View>
    </Modal>
  )
}

export default function ProfileScreen() {
  const { user: authUser, signOut } = useAuth()
  const { user, stats, loading, error, update, changeAvatar, refresh } = useProfile(
    authUser?.id ?? '',
  )
  const [editVisible, setEditVisible] = useState(false)

  async function handleAvatarPress() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (result.canceled) return
    const asset = result.assets[0]
    const contentType = asset.mimeType ?? 'image/jpeg'
    try {
      await changeAvatar(asset.uri, contentType)
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el avatar')
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.amber} />
        </View>
      </SafeAreaView>
    )
  }

  if (error || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Perfil no encontrado'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const displayName = user.displayName ?? user.username

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => setEditVisible(true)}>
          <Ionicons name="create-outline" size={17} color={colors.amber} />
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Avatar url={user.avatarUrl} name={displayName} onPress={handleAvatarPress} />
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          {user.bio ? (
            <Text style={styles.bio}>{user.bio}</Text>
          ) : (
            <TouchableOpacity onPress={() => setEditVisible(true)}>
              <Text style={styles.bioPlaceholder}>Añade una bio →</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsRow}>
          <StatBox value={stats.booksRead} label="leídos" />
          <View style={styles.statDivider} />
          <StatBox value={stats.booksReading} label="leyendo" />
          <View style={styles.statDivider} />
          <StatBox value={stats.clubCount} label="clubs" />
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Ionicons name="log-out-outline" size={15} color={colors.textMuted} />
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      <EditModal
        visible={editVisible}
        initialName={user.displayName ?? ''}
        initialBio={user.bio ?? ''}
        onSave={(name, bio) => update({ displayName: name, bio })}
        onClose={() => setEditVisible(false)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  avatar: { borderRadius: 46, height: 92, width: 92 },
  avatarBadge: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderColor: colors.bg,
    borderRadius: 12,
    borderWidth: 2,
    bottom: 0,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 24,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: colors.amberFaint,
    borderRadius: 46,
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  avatarInitial: { color: colors.amber, fontFamily: 'Playfair-Bold', fontSize: 38 },
  avatarRing: {
    borderColor: colors.amber + '40',
    borderRadius: 50,
    borderWidth: 2,
    padding: 3,
  },
  avatarWrap: { marginBottom: 16, position: 'relative' },
  bio: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    textAlign: 'center',
  },
  bioInput: { height: 100, textAlignVertical: 'top' },
  bioPlaceholder: {
    color: colors.amber,
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    marginTop: 10,
  },
  centered: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  charCount: {
    color: colors.textMuted,
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  container: { backgroundColor: colors.bg, flex: 1 },
  displayName: {
    color: colors.textPrimary,
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    marginTop: 2,
  },
  editButton: {
    alignItems: 'center',
    borderColor: colors.amber,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: { color: colors.amber, fontFamily: 'Inter-Medium', fontSize: 13 },
  errorText: { color: colors.error, fontFamily: 'Inter-Regular', fontSize: 14 },
  fieldInput: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 14,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  hero: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 24 },
  modal: { backgroundColor: colors.bg, flex: 1 },
  modalBody: { flex: 1, paddingHorizontal: 20 },
  modalCancel: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 14 },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalSave: { color: colors.amber, fontFamily: 'Inter-SemiBold', fontSize: 14 },
  modalTitle: { color: colors.textPrimary, fontFamily: 'Playfair-Bold', fontSize: 20 },
  retryButton: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { color: colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13 },
  scroll: { paddingBottom: 48 },
  signOutButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 14,
  },
  signOutText: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 14 },
  statBox: { alignItems: 'center', flex: 1, gap: 4 },
  statDivider: { backgroundColor: colors.border, height: 36, width: 1 },
  statLabel: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 11, letterSpacing: 0.3 },
  statValue: { color: colors.textPrimary, fontFamily: 'Playfair-Bold', fontSize: 28 },
  statsRow: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#1A1208',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  title: { color: colors.textPrimary, fontFamily: 'Playfair-Bold', fontSize: 28 },
  username: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 2 },
})
