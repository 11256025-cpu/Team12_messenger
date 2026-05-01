// app/(tabs)/index.tsx
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// 請確認這裡的路徑正確指向你的 mock-messenger.ts
import { CONTACTS, INITIAL_MESSAGES } from '../../constants/mock-messenger';

export default function ChatListScreen() {
  const router = useRouter();

  const renderItem = ({ item }: { item: typeof CONTACTS[0] }) => {
    // 抓取該聯絡人的所有訊息，並顯示最後一則
    const contactMessages = INITIAL_MESSAGES[item.id] || []; 
    const lastMessage = contactMessages[contactMessages.length - 1]; 

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        {/* 使用你設定的 accentColor 作為預設頭像背景[cite: 1] */}
        <View style={[styles.avatar, { backgroundColor: item.accentColor }]}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          {/* 在線狀態標示[cite: 1] */}
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.chatInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessage ? lastMessage.text : '尚無訊息'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={CONTACTS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  chatItem: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#31a24c', borderWidth: 2, borderColor: '#fff' },
  chatInfo: { flex: 1, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e5ea', paddingBottom: 15 },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  lastMessage: { fontSize: 14, color: '#8e8e93' },
});