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
  SafeAreaView,
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
  const match = matches.find((m) => m.matchId === matchId)
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
        {showTime && (
          <Text style={styles.timeDivider}>{timeAgo(item.createdAt)}</Text>
        )}
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
      {/* Header */}
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

      {/* Messages */}
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
            keyExtractor={(item) => item.id}
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

        {/* Input */}
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
  container: { flex: 1, backgroundColor: '#0D0A06' },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#C8853A20',
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: '#C8853A', fontSize: 22 },
  headerProfile: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: '#C8853A' },
  headerAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#C8853A22',
    borderWidth: 1.5,
    borderColor: '#C8853A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarInitial: { color: '#C8853A', fontSize: 16, fontFamily: 'Georgia', fontWeight: '700' },
  headerName: { color: '#F2E8D5', fontSize: 15, fontFamily: 'Georgia', fontWeight: '600' },
  headerSub: { color: '#C8853A80', fontSize: 10, fontFamily: 'SpaceMono' },
  list: { padding: 16, paddingBottom: 8 },
  timeDivider: {
    color: '#F2E8D530',
    fontSize: 10,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    marginVertical: 8,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginVertical: 3,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#C8853A',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: '#161009',
    borderWidth: 1,
    borderColor: '#C8853A30',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextMe: { color: '#0D0A06', fontFamily: 'Georgia' },
  bubbleTextThem: { color: '#F2E8D5', fontFamily: 'Georgia' },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#C8853A20',
  },
  input: {
    flex: 1,
    backgroundColor: '#161009',
    borderWidth: 1,
    borderColor: '#C8853A30',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#F2E8D5',
    fontFamily: 'Georgia',
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#C8853A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#C8853A40' },
  sendIcon: { color: '#0D0A06', fontSize: 20, fontWeight: '700' },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyChatIcon: { fontSize: 40, marginBottom: 12 },
  emptyChatText: {
    color: '#F2E8D550',
    fontSize: 14,
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
})
