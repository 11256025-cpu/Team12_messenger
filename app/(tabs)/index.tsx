import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppAvatar } from '@/components/app-avatar';
import { Palette, Radius, Shadow } from '@/constants/design';
import { useAuth } from '@/contexts/auth-context';
import {
  addFriend,
  getOtherMember,
  searchUsers,
  subscribeChats,
  subscribeFriends,
} from '@/services/chat-service';
import { ChatSummary, FriendProfile, UserProfile } from '@/types/user';
import { formatListTime } from '@/utils/date';

type ListMode = 'chats' | 'friends';

export default function ChatListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, dataError } = useAuth();
  const [mode, setMode] = useState<ListMode>('chats');
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingUid, setAddingUid] = useState<string | null>(null);

  const friendIds = useMemo(() => new Set(friends.map((friend) => friend.uid)), [friends]);

  useEffect(() => {
    if (!user) return undefined;

    const unsubscribeFriends = subscribeFriends(user.uid, setFriends);
    const unsubscribeChats = subscribeChats(user.uid, setChats);

    return () => {
      unsubscribeFriends();
      unsubscribeChats();
    };
  }, [user]);

  const openChat = (chatId: string) => {
    router.push({ pathname: '/chat/[id]', params: { id: chatId } });
  };

  const handleSearch = async () => {
    if (!user) return;

    const keyword = searchText.trim();

    if (!keyword) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const results = await searchUsers(keyword, user.uid);
      setSearchResults(results);
    } catch {
      Alert.alert('搜尋失敗', '請稍後再試一次。');
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (friendUid: string) => {
    if (!user) return;

    try {
      setAddingUid(friendUid);
      const chatId = await addFriend(user.uid, friendUid);
      setMode('chats');
      setSearchText('');
      setSearchResults([]);
      openChat(chatId);
    } catch (error) {
      Alert.alert('加入失敗', error instanceof Error ? error.message : '請稍後再試。');
    } finally {
      setAddingUid(null);
    }
  };

  const renderChat = ({ item }: { item: ChatSummary }) => {
    if (!user) return null;

    const otherMember = getOtherMember(item, user.uid);
    const title = otherMember?.displayName ?? '未知使用者';
    const time = formatListTime(item.lastMessageAt ?? item.updatedAt);
    const senderPrefix = item.lastMessageSenderId === user.uid ? '你：' : '';

    return (
      <TouchableOpacity activeOpacity={0.74} onPress={() => openChat(item.id)} style={styles.listRow}>
        <AppAvatar name={title} photoURL={otherMember?.photoURL} size={52} />
        <View style={styles.listRowBody}>
          <View style={styles.listRowTop}>
            <Text numberOfLines={1} style={styles.listTitle}>{title}</Text>
            {time ? <Text style={styles.listTime}>{time}</Text> : null}
          </View>
          <Text numberOfLines={1} style={styles.listSubtitle}>
            {item.lastMessage ? `${senderPrefix}${item.lastMessage}` : '尚無訊息'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFriend = ({ item }: { item: FriendProfile }) => (
    <TouchableOpacity activeOpacity={0.74} onPress={() => openChat(item.chatId)} style={styles.listRow}>
      <AppAvatar name={item.displayName} photoURL={item.photoURL} size={52} />
      <View style={styles.listRowBody}>
        <Text numberOfLines={1} style={styles.listTitle}>{item.displayName}</Text>
        <Text numberOfLines={1} style={styles.listSubtitle}>{item.email}</Text>
      </View>
      <View style={styles.rowIconButton}>
        <Ionicons name="chatbubble-ellipses" size={19} color={Palette.primary} />
      </View>
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }: { item: UserProfile }) => {
    const isFriend = friendIds.has(item.uid);
    const isAdding = addingUid === item.uid;

    return (
      <View style={styles.searchResultRow}>
        <AppAvatar name={item.displayName} photoURL={item.photoURL} size={42} />
        <View style={styles.searchResultBody}>
          <Text numberOfLines={1} style={styles.searchResultName}>{item.displayName}</Text>
          <Text numberOfLines={1} style={styles.searchResultEmail}>{item.email}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.82}
          disabled={isFriend || isAdding}
          onPress={() => handleAddFriend(item.uid)}
          style={[styles.addButton, isFriend && styles.addButtonDone, isAdding && styles.addButtonDisabled]}
        >
          {isAdding ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name={isFriend ? 'checkmark' : 'person-add'} size={16} color={isFriend ? Palette.success : '#fff'} />
              <Text style={[styles.addButtonText, isFriend && styles.addButtonDoneText]}>
                {isFriend ? '已加入' : '加入'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const dataCount = mode === 'chats' ? chats.length : friends.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.headerEyebrow}>Messenger</Text>
          <Text style={styles.headerTitle}>聊天</Text>
        </View>
        <AppAvatar name={profile?.displayName ?? 'Me'} photoURL={profile?.photoURL} size={46} />
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{chats.length}</Text>
          <Text style={styles.summaryLabel}>聊天室</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{friends.length}</Text>
          <Text style={styles.summaryLabel}>好友</Text>
        </View>
      </View>

      <View style={styles.searchPanel}>
        {dataError ? (
          <View style={styles.warningBanner}>
            <Ionicons name="alert-circle" size={18} color={Palette.warning} />
            <Text style={styles.warningText}>{dataError}</Text>
          </View>
        ) : null}

        <View style={styles.searchInputRow}>
          <Ionicons name="search" size={20} color={Palette.faint} />
          <TextInput
            autoCapitalize="none"
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            placeholder="名字、Email 或 UID"
            placeholderTextColor={Palette.faint}
            returnKeyType="search"
            style={styles.searchInput}
            value={searchText}
          />
          <TouchableOpacity
            accessibilityLabel="搜尋好友"
            activeOpacity={0.82}
            onPress={handleSearch}
            style={styles.searchButton}
          >
            {searching ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="arrow-forward" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>

        {searchResults.length > 0 ? (
          <View style={styles.searchResults}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.uid}
              renderItem={renderSearchResult}
              scrollEnabled={false}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.segmentedControl}>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => setMode('chats')}
          style={[styles.segmentButton, mode === 'chats' && styles.segmentButtonActive]}
        >
          <Ionicons name="chatbubbles" size={17} color={mode === 'chats' ? Palette.primary : Palette.muted} />
          <Text style={[styles.segmentText, mode === 'chats' && styles.segmentTextActive]}>聊天室</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => setMode('friends')}
          style={[styles.segmentButton, mode === 'friends' && styles.segmentButtonActive]}
        >
          <Ionicons name="people" size={17} color={mode === 'friends' ? Palette.primary : Palette.muted} />
          <Text style={[styles.segmentText, mode === 'friends' && styles.segmentTextActive]}>好友</Text>
        </TouchableOpacity>
      </View>

      {mode === 'chats' ? (
        <FlatList
          contentContainerStyle={dataCount ? styles.listContent : styles.emptyListContent}
          data={chats}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={32} color={Palette.primary} />
              </View>
              <Text style={styles.emptyTitle}>目前沒有聊天室</Text>
              <Text style={styles.emptyText}>加入好友後會出現在這裡。</Text>
            </View>
          }
          renderItem={renderChat}
        />
      ) : (
        <FlatList
          contentContainerStyle={dataCount ? styles.listContent : styles.emptyListContent}
          data={friends}
          keyExtractor={(item) => item.uid}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={32} color={Palette.primary} />
              </View>
              <Text style={styles.emptyTitle}>還沒有好友</Text>
              <Text style={styles.emptyText}>搜尋帳號並加入好友。</Text>
            </View>
          }
          renderItem={renderFriend}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerText: {
    flex: 1,
    paddingRight: 14,
  },
  headerEyebrow: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  headerTitle: {
    color: Palette.text,
    fontSize: 34,
    fontWeight: '900',
    marginTop: 2,
  },
  summaryRow: {
    ...Shadow.soft,
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderRadius: Radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 18,
    marginBottom: 12,
    paddingVertical: 12,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    color: Palette.text,
    fontSize: 20,
    fontWeight: '900',
  },
  summaryLabel: {
    color: Palette.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  summaryDivider: {
    backgroundColor: Palette.border,
    height: 34,
    width: 1,
  },
  searchPanel: {
    marginHorizontal: 18,
    marginBottom: 12,
  },
  warningBanner: {
    alignItems: 'center',
    backgroundColor: '#fff7e6',
    borderColor: '#fedf89',
    borderRadius: Radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    padding: 10,
  },
  warningText: {
    color: Palette.warning,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  searchInputRow: {
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderRadius: Radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 50,
    paddingLeft: 13,
  },
  searchInput: {
    color: Palette.text,
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 10,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: Palette.primary,
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    marginRight: 6,
    width: 42,
  },
  searchResults: {
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderRadius: Radius.card,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchResultRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 8,
  },
  searchResultBody: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0,
  },
  searchResultName: {
    color: Palette.text,
    fontSize: 15,
    fontWeight: '800',
  },
  searchResultEmail: {
    color: Palette.muted,
    fontSize: 13,
    marginTop: 2,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    minHeight: 34,
    minWidth: 72,
    paddingHorizontal: 12,
  },
  addButtonDone: {
    backgroundColor: Palette.successSoft,
  },
  addButtonDisabled: {
    opacity: 0.72,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  addButtonDoneText: {
    color: Palette.success,
  },
  segmentedControl: {
    backgroundColor: Palette.surfaceAlt,
    borderRadius: Radius.card,
    flexDirection: 'row',
    marginHorizontal: 18,
    padding: 4,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  segmentButtonActive: {
    backgroundColor: Palette.surface,
  },
  segmentText: {
    color: Palette.muted,
    fontSize: 14,
    fontWeight: '900',
  },
  segmentTextActive: {
    color: Palette.primary,
  },
  listContent: {
    paddingBottom: 28,
    paddingTop: 10,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  listRow: {
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderRadius: Radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 18,
    marginVertical: 5,
    padding: 12,
  },
  listRowBody: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 12,
    minHeight: 46,
    minWidth: 0,
  },
  listRowTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  listTitle: {
    color: Palette.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
  },
  listTime: {
    color: Palette.faint,
    fontSize: 12,
    fontWeight: '700',
  },
  listSubtitle: {
    color: Palette.muted,
    fontSize: 14,
    marginTop: 4,
  },
  rowIconButton: {
    alignItems: 'center',
    backgroundColor: Palette.primarySoft,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: Palette.primarySoft,
    borderRadius: 22,
    height: 58,
    justifyContent: 'center',
    width: 58,
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
