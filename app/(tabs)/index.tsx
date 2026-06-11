import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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
  acceptFriendRequest,
  getOtherMember,
  rejectFriendRequest,
  searchUsers,
  sendFriendRequest,
  subscribeChats,
  subscribeFriendRequests,
  subscribeFriends,
} from '@/services/chat-service';
import { ChatSummary, FriendProfile, FriendRequest, UserProfile } from '@/types/user';
import { formatListTime } from '@/utils/date';

type ListMode = 'chats' | 'friends';

function messagePreview(message: string | null, maxLength = 7) {
  if (!message) return '';

  const normalized = message.trim().replace(/\s+/g, ' ');
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}...`
    : normalized;
}

export default function ChatListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, dataError } = useAuth();
  const [mode, setMode] = useState<ListMode>('chats');
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [searchText, setSearchText] = useState('');
  const [friendResults, setFriendResults] = useState<FriendProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addSearchText, setAddSearchText] = useState('');
  const [addSearchResults, setAddSearchResults] = useState<UserProfile[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [sendingRequestUid, setSendingRequestUid] = useState<string | null>(null);
  const [handlingRequestId, setHandlingRequestId] = useState<string | null>(null);

  const friendIds = useMemo(() => new Set(friends.map((friend) => friend.uid)), [friends]);

  useEffect(() => {
    if (!user) return undefined;

    const unsubscribeFriends = subscribeFriends(user.uid, setFriends);
    const unsubscribeChats = subscribeChats(user.uid, setChats);
    const unsubscribeRequests = subscribeFriendRequests(user.uid, setFriendRequests);

    return () => {
      unsubscribeFriends();
      unsubscribeChats();
      unsubscribeRequests();
    };
  }, [user]);

  const openChat = (chatId: string) => {
    router.push({ pathname: '/chat/[id]', params: { id: chatId } });
  };

  const handleFriendSearch = () => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) {
      setFriendResults([]);
      return;
    }

    setFriendResults(friends.filter((friend) => (
      friend.displayName.toLowerCase().includes(keyword)
      || friend.email.toLowerCase().includes(keyword)
      || friend.uid.toLowerCase().includes(keyword)
    )));
  };

  const handleUserSearch = async () => {
    if (!user || !addSearchText.trim()) return;

    try {
      setSearchingUsers(true);
      const results = await searchUsers(addSearchText, user.uid);
      setAddSearchResults(results);
    } catch (error) {
      Alert.alert('搜尋失敗', error instanceof Error ? error.message : '請稍後再試。');
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleSendRequest = async (recipientUid: string) => {
    if (!profile) return;

    try {
      setSendingRequestUid(recipientUid);
      await sendFriendRequest(profile, recipientUid);
      Alert.alert('已送出邀請', '對方接受後才會成為好友。');
    } catch (error) {
      Alert.alert('無法送出邀請', error instanceof Error ? error.message : '請稍後再試。');
    } finally {
      setSendingRequestUid(null);
    }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    try {
      setHandlingRequestId(request.id);
      await acceptFriendRequest(request);
      Alert.alert('已成為好友', `你和 ${request.sender.displayName} 現在是好友。`);
    } catch (error) {
      Alert.alert('接受失敗', error instanceof Error ? error.message : '請稍後再試。');
    } finally {
      setHandlingRequestId(null);
    }
  };

  const handleRejectRequest = async (request: FriendRequest) => {
    try {
      setHandlingRequestId(request.id);
      await rejectFriendRequest(request.id);
    } catch {
      Alert.alert('拒絕失敗', '請稍後再試。');
    } finally {
      setHandlingRequestId(null);
    }
  };

  const renderChat = ({ item }: { item: ChatSummary }) => {
    if (!user) return null;

    const otherMember = getOtherMember(item, user.uid);
    const title = otherMember?.displayName ?? '未知使用者';
    const time = formatListTime(item.lastMessageAt ?? item.updatedAt);
    const senderPrefix = item.lastMessageSenderId === user.uid ? '你：' : '';
    const unreadCount = item.unreadCounts?.[user.uid] ?? 0;
    const unreadLabel = unreadCount > 3 ? '4+ 則訊息未查看' : `${unreadCount} 則訊息未查看`;
    const unreadPreview = messagePreview(item.lastMessage);

    return (
      <TouchableOpacity activeOpacity={0.74} onPress={() => openChat(item.id)} style={styles.listRow}>
        <View>
          <AppAvatar name={title} photoURL={otherMember?.photoURL} size={52} />
          {unreadCount > 0 ? <View style={styles.unreadDot} /> : null}
        </View>
        <View style={styles.listRowBody}>
          <View style={styles.listRowTop}>
            <Text numberOfLines={1} style={[styles.listTitle, unreadCount > 0 && styles.unreadTitle]}>
              {title}
            </Text>
            {time ? (
              <Text style={[styles.listTime, unreadCount > 0 && styles.unreadTime]}>{time}</Text>
            ) : null}
          </View>
          <Text
            numberOfLines={1}
            style={[styles.listSubtitle, unreadCount > 0 && styles.unreadSubtitle]}
          >
            {unreadCount > 0
              ? `${unreadLabel}${unreadPreview ? `・${unreadPreview}` : ''}`
              : item.lastMessage
                ? `${senderPrefix}${item.lastMessage}`
                : '尚無訊息'}
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

  const renderFriendResult = ({ item }: { item: FriendProfile }) => (
    <TouchableOpacity
      activeOpacity={0.76}
      onPress={() => openChat(item.chatId)}
      style={styles.searchResultRow}
    >
      <AppAvatar name={item.displayName} photoURL={item.photoURL} size={42} />
      <View style={styles.searchResultBody}>
        <Text numberOfLines={1} style={styles.searchResultName}>{item.displayName}</Text>
        <Text numberOfLines={1} style={styles.searchResultEmail}>{item.email}</Text>
      </View>
      <Ionicons name="chatbubble-ellipses" size={20} color={Palette.primary} />
    </TouchableOpacity>
  );

  const renderAddResult = ({ item }: { item: UserProfile }) => {
    const isFriend = friendIds.has(item.uid);
    const isSending = sendingRequestUid === item.uid;

    return (
      <View style={styles.searchResultRow}>
        <AppAvatar name={item.displayName} photoURL={item.photoURL} size={42} />
        <View style={styles.searchResultBody}>
          <Text numberOfLines={1} style={styles.searchResultName}>{item.displayName}</Text>
          <Text numberOfLines={1} style={styles.searchResultEmail}>{item.email}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.82}
          disabled={isFriend || isSending}
          onPress={() => handleSendRequest(item.uid)}
          style={[styles.addButton, isFriend && styles.addButtonDone, isSending && styles.addButtonDisabled]}
        >
          {isSending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name={isFriend ? 'checkmark' : 'paper-plane'} size={16} color={isFriend ? Palette.success : '#fff'} />
              <Text style={[styles.addButtonText, isFriend && styles.addButtonDoneText]}>
                {isFriend ? '已是好友' : '邀請'}
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
        <TouchableOpacity
          accessibilityLabel="前往帳號頁"
          activeOpacity={0.75}
          hitSlop={8}
          onPress={() => router.push('/(tabs)/profile')}
          style={styles.profileButton}
        >
          <AppAvatar name={profile?.displayName ?? 'Me'} photoURL={profile?.photoURL} size={46} />
        </TouchableOpacity>
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

        <View style={styles.searchActions}>
          <View style={styles.searchInputRow}>
            <Ionicons name="search" size={20} color={Palette.faint} />
            <TextInput
              autoCapitalize="none"
              onChangeText={(text) => {
                setSearchText(text);
                if (!text.trim()) setFriendResults([]);
              }}
              onSubmitEditing={handleFriendSearch}
              placeholder="搜尋現有好友"
              placeholderTextColor={Palette.faint}
              returnKeyType="search"
              style={styles.searchInput}
              value={searchText}
            />
            <TouchableOpacity
              accessibilityLabel="搜尋現有好友"
              activeOpacity={0.82}
              onPress={handleFriendSearch}
              style={styles.searchButton}
            >
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            accessibilityLabel="新增好友"
            activeOpacity={0.82}
            onPress={() => setAddModalVisible(true)}
            style={styles.addFriendButton}
          >
            <Ionicons name="person-add" size={18} color="#fff" />
            <Text style={styles.addFriendButtonText}>新增好友</Text>
          </TouchableOpacity>
        </View>

        {friendResults.length > 0 ? (
          <View style={styles.searchResults}>
            <FlatList
              data={friendResults}
              keyExtractor={(item) => item.uid}
              renderItem={renderFriendResult}
              scrollEnabled={false}
            />
          </View>
        ) : null}
      </View>

      {friendRequests.length > 0 ? (
        <View style={styles.requestPanel}>
          <View style={styles.requestHeader}>
            <Text style={styles.requestTitle}>好友邀請</Text>
            <View style={styles.requestBadge}>
              <Text style={styles.requestBadgeText}>{friendRequests.length}</Text>
            </View>
          </View>
          {friendRequests.map((request) => {
            const isHandling = handlingRequestId === request.id;

            return (
              <View key={request.id} style={styles.requestRow}>
                <AppAvatar
                  name={request.sender.displayName}
                  photoURL={request.sender.photoURL}
                  size={44}
                />
                <View style={styles.requestBody}>
                  <Text numberOfLines={1} style={styles.requestName}>
                    {request.sender.displayName}
                  </Text>
                  <Text numberOfLines={1} style={styles.requestEmail}>
                    {request.sender.email}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isHandling}
                  onPress={() => handleRejectRequest(request)}
                  style={styles.rejectButton}
                >
                  <Text style={styles.rejectButtonText}>拒絕</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isHandling}
                  onPress={() => handleAcceptRequest(request)}
                  style={styles.acceptButton}
                >
                  {isHandling ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.acceptButtonText}>接受</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ) : null}

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

      <Modal
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
        transparent
        visible={addModalVisible}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>新增好友</Text>
                <Text style={styles.modalSubtitle}>搜尋後送出邀請，對方接受才會成為好友。</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="關閉"
                onPress={() => setAddModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={22} color={Palette.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchRow}>
              <Ionicons name="search" size={20} color={Palette.faint} />
              <TextInput
                autoCapitalize="none"
                autoFocus
                onChangeText={(text) => {
                  setAddSearchText(text);
                  if (!text.trim()) setAddSearchResults([]);
                }}
                onSubmitEditing={handleUserSearch}
                placeholder="輸入名字、Email 或 UID"
                placeholderTextColor={Palette.faint}
                returnKeyType="search"
                style={styles.modalSearchInput}
                value={addSearchText}
              />
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={handleUserSearch}
                style={styles.modalSearchButton}
              >
                {searchingUsers ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSearchButtonText}>搜尋</Text>
                )}
              </TouchableOpacity>
            </View>

            <FlatList
              contentContainerStyle={styles.modalResults}
              data={addSearchResults}
              keyExtractor={(item) => item.uid}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.modalEmpty}>
                  <Ionicons name="person-add-outline" size={30} color={Palette.faint} />
                  <Text style={styles.modalEmptyText}>
                    {addSearchText.trim() ? '找不到符合的使用者' : '輸入資料來搜尋新朋友'}
                  </Text>
                </View>
              }
              renderItem={renderAddResult}
            />
          </View>
        </View>
      </Modal>
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
  profileButton: {
    borderRadius: 23,
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
  searchActions: {
    flexDirection: 'row',
    gap: 10,
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
    flex: 1,
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
  addFriendButton: {
    alignItems: 'center',
    backgroundColor: Palette.primary,
    borderRadius: Radius.control,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 16,
  },
  addFriendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
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
  requestPanel: {
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderRadius: Radius.card,
    borderWidth: 1,
    marginBottom: 12,
    marginHorizontal: 18,
    padding: 12,
  },
  requestHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
  },
  requestTitle: {
    color: Palette.text,
    fontSize: 15,
    fontWeight: '900',
  },
  requestBadge: {
    alignItems: 'center',
    backgroundColor: Palette.danger,
    borderRadius: 10,
    justifyContent: 'center',
    marginLeft: 7,
    minHeight: 20,
    minWidth: 20,
    paddingHorizontal: 6,
  },
  requestBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  requestRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
    paddingVertical: 7,
  },
  requestBody: {
    flex: 1,
    minWidth: 0,
  },
  requestName: {
    color: Palette.text,
    fontSize: 15,
    fontWeight: '900',
  },
  requestEmail: {
    color: Palette.muted,
    fontSize: 12,
    marginTop: 2,
  },
  rejectButton: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceAlt,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 13,
  },
  rejectButtonText: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  acceptButton: {
    alignItems: 'center',
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    minHeight: 34,
    minWidth: 58,
    paddingHorizontal: 13,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
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
  unreadTime: {
    color: Palette.danger,
    fontWeight: '900',
  },
  listSubtitle: {
    color: Palette.muted,
    fontSize: 14,
    marginTop: 4,
  },
  unreadDot: {
    backgroundColor: Palette.danger,
    borderColor: Palette.surface,
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    position: 'absolute',
    right: -1,
    top: -1,
    width: 14,
  },
  unreadTitle: {
    fontWeight: '900',
  },
  unreadSubtitle: {
    color: Palette.danger,
    fontWeight: '800',
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
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Palette.surface,
    borderRadius: 22,
    maxHeight: '78%',
    maxWidth: 560,
    padding: 20,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    width: '100%',
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: Palette.text,
    fontSize: 22,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: Palette.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  modalCloseButton: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceAlt,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginLeft: 14,
    width: 36,
  },
  modalSearchRow: {
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderColor: Palette.border,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 18,
    minHeight: 52,
    paddingLeft: 13,
  },
  modalSearchInput: {
    color: Palette.text,
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 10,
  },
  modalSearchButton: {
    alignItems: 'center',
    backgroundColor: Palette.primary,
    borderRadius: 11,
    justifyContent: 'center',
    marginRight: 5,
    minHeight: 42,
    minWidth: 62,
    paddingHorizontal: 12,
  },
  modalSearchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  modalResults: {
    flexGrow: 1,
    paddingTop: 10,
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  modalEmptyText: {
    color: Palette.muted,
    fontSize: 14,
    marginTop: 9,
  },
});
