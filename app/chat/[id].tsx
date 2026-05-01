// app/chat/[id].tsx
import { Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { CONTACTS, INITIAL_MESSAGES } from '../../constants/mock-messenger';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const contact = CONTACTS.find(c => c.id === id); //[cite: 1]
  const initialMessages = INITIAL_MESSAGES[id as string] || []; //[cite: 1]
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<typeof initialMessages[0]> | null>(null);

  const handleSend = () => {
    if (!draft.trim()) return;

    const newMessage = {
      id: `sent-${Date.now()}`,
      senderId: 'me',
      text: draft.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((current) => [...current, newMessage]);
    setDraft('');

    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: contact?.name || '聊天' }} />
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id} //[cite: 1]
        contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
        renderItem={({ item }) => {
          const isMe = item.senderId === 'me';
          return (
            <View style={[
              styles.messageWrapper,
              isMe ? styles.messageWrapperMe : styles.messageWrapperThem
            ]}>
              <View style={[
                styles.messageBubble, 
                isMe ? styles.myBubble : styles.theirBubble
              ]}>
                <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
                  {item.text}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="輸入訊息..."
          placeholderTextColor="#8e8e93"
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} activeOpacity={0.7}>
          <IconSymbol name="paperplane.fill" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  messageWrapper: { flexDirection: 'row', marginBottom: 10 },
  messageWrapperMe: { justifyContent: 'flex-end' },
  messageWrapperThem: { justifyContent: 'flex-start' },
  messageBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, maxWidth: '75%' },
  myBubble: { backgroundColor: '#0a84ff' }, // 原版 Messenger 藍色[cite: 1]
  theirBubble: { backgroundColor: '#f0f0f0' },
  messageText: { fontSize: 16, lineHeight: 22 },
  myText: { color: '#fff' },
  theirText: { color: '#000' },
  inputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5ea',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: '#f2f2f7',
    borderRadius: 20,
    fontSize: 16,
    color: '#000',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0a84ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});