// app/chat/[id].tsx
import { useLocalSearchParams, Stack } from 'expo-router';
import { View, Text, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { CONTACTS, INITIAL_MESSAGES } from '../../mock-messenger';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const contact = CONTACTS.find(c => c.id === id); //[cite: 1]
  const messages = INITIAL_MESSAGES[id as string] || []; //[cite: 1]

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: contact?.name || '聊天' }} />
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id} //[cite: 1]
        contentContainerStyle={{ padding: 15 }}
        renderItem={({ item }) => {
          // 判斷 senderId 是否為 "me" 來決定氣泡位置[cite: 1]
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
});