import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONTACTS, INITIAL_MESSAGES } from '../../constants/mock-messenger';

export default function ChatListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [headerImage, setHeaderImage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const savedImage = await AsyncStorage.getItem('profileImage');
        if (savedImage) setHeaderImage(savedImage);
      } catch {
        // ignore load errors
      }
    };

    loadProfileData();
  }, []);

  const renderItem = ({ item }: { item: typeof CONTACTS[0] }) => {
    const contactMessages = INITIAL_MESSAGES[item.id] || [];
    const lastMessage = contactMessages[contactMessages.length - 1];

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => router.push(`/chat/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: item.accentColor }]}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>聊天</Text>
        <View style={styles.headerAvatarContainer}>
          {headerImage ? (
            <Image source={{ uri: headerImage }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Ionicons name="person-circle-outline" size={32} color="#fff" />
            </View>
          )}
        </View>
      </View>
      <FlatList
        data={CONTACTS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#000' },
  headerAvatarContainer: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  headerAvatar: { width: 44, height: 44, borderRadius: 22 },
  headerAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0a84ff', justifyContent: 'center', alignItems: 'center' },
  headerAvatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  chatItem: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#31a24c', borderWidth: 3, borderColor: '#fff' },
  chatInfo: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 10 },
  name: { fontSize: 15, fontWeight: '600', marginBottom: 4, color: '#000' },
  lastMessage: { fontSize: 13, color: '#8e8e93' },
});