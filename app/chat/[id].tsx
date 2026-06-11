import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppAvatar } from '@/components/app-avatar';
import { Palette, Radius } from '@/constants/design';
import { useAuth } from '@/contexts/auth-context';
import {
  getOtherMember,
  markChatRead,
  sendMessage,
  subscribeChat,
  subscribeMessages,
} from '@/services/chat-service';
import { ChatMessage, ChatSummary } from '@/types/user';
import { formatMessageTime } from '@/utils/date';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [chat, setChat] = useState<ChatSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList<ChatMessage> | null>(null);

  useEffect(() => {
    if (!chatId) return undefined;

    const unsubscribeChat = subscribeChat(chatId, (nextChat) => {
      setChat(nextChat);
      setLoading(false);
    });
    const unsubscribeMessages = subscribeMessages(chatId, (nextMessages) => {
      setMessages(nextMessages);
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    });

    return () => {
      unsubscribeChat();
      unsubscribeMessages();
    };
  }, [chatId]);

  useEffect(() => {
    if (!chatId || !user || !chat?.unreadCounts?.[user.uid]) return;

    void markChatRead(chatId, user.uid).catch((error) => {
      console.warn('Unable to mark chat as read:', error);
    });
  }, [chat?.unreadCounts, chatId, user]);

  const otherMember = user && chat ? getOtherMember(chat, user.uid) : null;
  const title = otherMember?.displayName ?? '聊天室';

  const handleSend = async () => {
    if (!chatId || !profile || !draft.trim()) return;

    const messageText = draft;
    setDraft('');
    setSending(true);

    try {
      await sendMessage(chatId, profile, messageText);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === user?.uid;
    const time = formatMessageTime(item.createdAt);
    const currentSender = isMe ? profile : chat?.memberInfo[item.senderId];
    const senderName = currentSender?.displayName ?? item.senderName;
    const senderPhotoURL = currentSender?.photoURL ?? item.senderPhotoURL;

    return (
      <View style={[styles.messageLine, isMe ? styles.messageLineMe : styles.messageLineThem]}>
        {!isMe ? (
          <AppAvatar name={senderName} photoURL={senderPhotoURL} size={32} />
        ) : null}
        <View style={[styles.messageGroup, isMe && styles.messageGroupMe]}>
          {!isMe ? <Text style={styles.senderName}>{senderName}</Text> : null}
          <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
            <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>{item.text}</Text>
          </View>
          <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeThem]}>
            {time || '傳送中'}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Palette.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
      style={styles.container}
    >
      <Stack.Screen options={{ title }} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          accessibilityLabel="返回"
          activeOpacity={0.75}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={Palette.primary} />
        </TouchableOpacity>
        <AppAvatar name={title} photoURL={otherMember?.photoURL} size={42} />
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.headerTitle}>{title}</Text>
          <Text numberOfLines={1} style={styles.headerSubtitle}>{otherMember?.email ?? chatId}</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        contentContainerStyle={messages.length ? styles.messagesContent : styles.emptyMessagesContent}
        data={messages}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={34} color={Palette.primary} />
            </View>
            <Text style={styles.emptyTitle}>尚無訊息</Text>
            <Text style={styles.emptyText}>傳第一則訊息給 {title}。</Text>
          </View>
        }
        renderItem={renderMessage}
      />

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          multiline
          onChangeText={setDraft}
          placeholder="輸入訊息..."
          placeholderTextColor={Palette.faint}
          style={styles.input}
          value={draft}
        />
        <TouchableOpacity
          accessibilityLabel="送出訊息"
          activeOpacity={0.82}
          disabled={!draft.trim() || sending}
          onPress={handleSend}
          style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={19} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.background,
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: Palette.background,
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderBottomColor: Palette.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingBottom: 10,
    paddingHorizontal: 8,
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerText: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0,
  },
  headerTitle: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: Palette.muted,
    fontSize: 13,
    marginTop: 2,
  },
  messagesContent: {
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
  emptyMessagesContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  messageLine: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginBottom: 12,
  },
  messageLineMe: {
    justifyContent: 'flex-end',
  },
  messageLineThem: {
    gap: 8,
    justifyContent: 'flex-start',
  },
  messageGroup: {
    maxWidth: '76%',
  },
  messageGroupMe: {
    alignItems: 'flex-end',
  },
  senderName: {
    color: Palette.muted,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
    marginLeft: 3,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  myBubble: {
    backgroundColor: Palette.primary,
    borderBottomRightRadius: 6,
  },
  theirBubble: {
    backgroundColor: Palette.surface,
    borderBottomLeftRadius: 6,
    borderColor: Palette.border,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myText: {
    color: '#fff',
  },
  theirText: {
    color: Palette.text,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  messageTimeMe: {
    color: Palette.faint,
    marginRight: 4,
  },
  messageTimeThem: {
    color: Palette.faint,
    marginLeft: 4,
  },
  inputBar: {
    alignItems: 'flex-end',
    backgroundColor: Palette.surface,
    borderTopColor: Palette.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  input: {
    backgroundColor: Palette.background,
    borderColor: Palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: Palette.text,
    flex: 1,
    fontSize: 16,
    maxHeight: 112,
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: Palette.primary,
    borderRadius: 21,
    height: 42,
    justifyContent: 'center',
    marginLeft: 8,
    width: 42,
  },
  sendButtonDisabled: {
    backgroundColor: '#b8c7d9',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: Palette.primarySoft,
    borderRadius: Radius.pill,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  emptyTitle: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 14,
  },
  emptyText: {
    color: Palette.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
});
