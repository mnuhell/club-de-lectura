import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useChat } from '@/src/ui/hooks/useChat'
import { useMatches } from '@/src/ui/hooks/useDiscover'
import type { Message } from '@/src/domain/Message'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>()
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const { matches } = useMatches(userId)
  const match = matches.find(m => m.matchId === matchId)
  const reader = match?.reader

  const { messages, loading, sending, send } = useChat(matchId, userId)
  const [text, setText] = useState('')
  const listRef = useRef<FlatList>(null)

  const handleSend = async () => {
    if (!text.trim()) return
    const content = text
    setText('')
    await send(content)
  }

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === userId
    const prev = messages[index - 1]
    const showTime =
      !prev || new Date(item.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60000

    return (
      <View>
        {showTime && <Text style={styles.timeDivider}>{timeAgo(item.createdAt)}</Text>}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
            {item.content}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerProfile}
          onPress={() => router.push(`/discover/match/${matchId}`)}
        >
          {reader?.avatarUrl ? (
            <Image source={{ uri: reader.avatarUrl }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarFallback}>
              <Text style={styles.headerAvatarInitial}>
                {reader?.fullName.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.headerName}>{reader?.fullName ?? '...'}</Text>
            <Text style={styles.headerSub}>♥ Coincidencia literaria</Text>
          </View>
        </TouchableOpacity>

        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#C8853A" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatIcon}>✉️</Text>
                <Text style={styles.emptyChatText}>
                  Sois los primeros en hablar.{'\n'}¿De qué libro empezáis?
                </Text>
              </View>
            }
          />
        )}

        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Escribe un mensaje…"
            placeholderTextColor="#F2E8D530"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#0D0A06" size="small" />
            ) : (
              <Text style={styles.sendIcon}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  backIcon: { color: '#C8853A', fontSize: 22 },
  bubble: {
    borderRadius: 18,
    marginVertical: 3,
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#C8853A',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: '#161009',
    borderBottomLeftRadius: 4,
    borderColor: '#C8853A30',
    borderWidth: 1,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextMe: { color: '#0D0A06', fontFamily: 'Georgia' },
  bubbleTextThem: { color: '#F2E8D5', fontFamily: 'Georgia' },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  container: { backgroundColor: '#0D0A06', flex: 1 },
  emptyChat: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingTop: 80 },
  emptyChatIcon: { fontSize: 40, marginBottom: 12 },
  emptyChatText: {
    color: '#F2E8D550',
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  flex: { flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomColor: '#C8853A20',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerAvatar: {
    borderColor: '#C8853A',
    borderRadius: 19,
    borderWidth: 1.5,
    height: 38,
    width: 38,
  },
  headerAvatarFallback: {
    alignItems: 'center',
    backgroundColor: '#C8853A22',
    borderColor: '#C8853A',
    borderRadius: 19,
    borderWidth: 1.5,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  headerAvatarInitial: { color: '#C8853A', fontFamily: 'Georgia', fontSize: 16, fontWeight: '700' },
  headerName: { color: '#F2E8D5', fontFamily: 'Georgia', fontSize: 15, fontWeight: '600' },
  headerProfile: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  headerSub: { color: '#C8853A80', fontFamily: 'SpaceMono', fontSize: 10 },
  input: {
    backgroundColor: '#161009',
    borderColor: '#C8853A30',
    borderRadius: 20,
    borderWidth: 1,
    color: '#F2E8D5',
    flex: 1,
    fontFamily: 'Georgia',
    fontSize: 15,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputArea: {
    alignItems: 'flex-end',
    borderTopColor: '#C8853A20',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  list: { padding: 16, paddingBottom: 8 },
  sendBtn: {
    alignItems: 'center',
    backgroundColor: '#C8853A',
    borderRadius: 21,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sendBtnDisabled: { backgroundColor: '#C8853A40' },
  sendIcon: { color: '#0D0A06', fontSize: 20, fontWeight: '700' },
  timeDivider: {
    color: '#F2E8D530',
    fontFamily: 'SpaceMono',
    fontSize: 10,
    marginVertical: 8,
    textAlign: 'center',
  },
})
