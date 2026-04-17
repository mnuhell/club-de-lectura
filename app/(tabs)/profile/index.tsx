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

function Avatar({
  url,
  name,
  onPress,
}: {
  url: string | null
  name: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.avatarWrap} onPress={onPress}>
      {url ? (
        <Image source={{ uri: url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitial}>{name.slice(0, 1).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.avatarBadge}>
        <Ionicons name="camera-outline" size={12} color={colors.textInverse} />
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
          <Text style={styles.fieldLabel}>Nombre</Text>
          <TextInput
            style={styles.fieldInput}
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor={colors.textMuted}
            maxLength={60}
          />
          <Text style={styles.fieldLabel}>Bio</Text>
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
        <TouchableOpacity onPress={() => setEditVisible(true)}>
          <Ionicons name="create-outline" size={22} color={colors.amber} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Avatar url={user.avatarUrl} name={displayName} onPress={handleAvatarPress} />
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        </View>

        <View style={styles.statsRow}>
          <StatBox value={stats.booksRead} label="leídos" />
          <View style={styles.statDivider} />
          <StatBox value={stats.booksReading} label="leyendo" />
          <View style={styles.statDivider} />
          <StatBox value={stats.clubCount} label="clubs" />
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Ionicons name="log-out-outline" size={16} color={colors.textMuted} />
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
  avatar: { borderRadius: 44, height: 88, width: 88 },
  avatarBadge: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: 10,
    bottom: 0,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 20,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 44,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  avatarInitial: { color: colors.amber, fontFamily: 'Georgia', fontSize: 36 },
  avatarWrap: { marginBottom: 14 },
  bio: {
    color: colors.textSecondary,
    fontFamily: 'Georgia',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  bioInput: { height: 100, textAlignVertical: 'top' },
  centered: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  charCount: {
    color: colors.textMuted,
    fontFamily: 'SpaceMono',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  container: { backgroundColor: colors.bg, flex: 1 },
  displayName: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 22 },
  errorText: { color: colors.error, fontFamily: 'SpaceMono', fontSize: 13 },
  fieldInput: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.textPrimary,
    fontFamily: 'SpaceMono',
    fontSize: 14,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontFamily: 'SpaceMono',
    fontSize: 11,
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
    paddingVertical: 16,
  },
  hero: { alignItems: 'center', paddingVertical: 28 },
  modal: { backgroundColor: colors.bg, flex: 1 },
  modalBody: { flex: 1, paddingHorizontal: 20 },
  modalCancel: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 13 },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalSave: { color: colors.amber, fontFamily: 'SpaceMono', fontSize: 13 },
  modalTitle: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 17 },
  retryButton: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { color: colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 12 },
  scroll: { paddingBottom: 40 },
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
  signOutText: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 13 },
  statBox: { alignItems: 'center', flex: 1, gap: 4 },
  statDivider: { backgroundColor: colors.border, height: 32, width: 1 },
  statLabel: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 10 },
  statsRow: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 20,
    paddingVertical: 18,
  },
  statValue: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 22 },
  title: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 24 },
  username: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 12, marginTop: 2 },
})
