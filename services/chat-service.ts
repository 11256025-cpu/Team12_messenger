import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/firebaseConfig';
import {
  ChatMessage,
  ChatSummary,
  FriendProfile,
  FriendRequest,
  UserProfile,
} from '@/types/user';

function createChatId(uidA: string, uidB: string) {
  return [uidA, uidB].sort().join('_');
}

function publicUser(profile: UserProfile) {
  return {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.displayName,
    photoURL: profile.photoURL ?? null,
  };
}

function timestampMillis(value?: { toMillis: () => number } | null) {
  return value?.toMillis() ?? 0;
}

export function getOtherMember(chat: ChatSummary, currentUid: string) {
  const otherUid = chat.members.find((uid) => uid !== currentUid);

  if (!otherUid) return null;

  return chat.memberInfo[otherUid] ?? null;
}

export async function searchUsers(searchText: string, currentUid: string) {
  const normalized = searchText.trim().toLowerCase();

  if (!normalized) return [];

  const results = new Map<string, UserProfile>();
  const exactUid = await getDoc(doc(db, 'users', searchText.trim()));

  if (exactUid.exists()) {
    const user = exactUid.data() as UserProfile;
    if (user.uid !== currentUid) results.set(user.uid, user);
  }

  const keywordQuery = query(
    collection(db, 'users'),
    where('searchKeywords', 'array-contains', normalized),
    limit(10),
  );
  const keywordSnapshot = await getDocs(keywordQuery);

  keywordSnapshot.forEach((snapshot) => {
    const user = snapshot.data() as UserProfile;
    if (user.uid !== currentUid) results.set(user.uid, user);
  });

  return Array.from(results.values());
}

export async function addFriend(currentUid: string, friendUid: string) {
  if (currentUid === friendUid) {
    throw new Error('不能加入自己');
  }

  const currentRef = doc(db, 'users', currentUid);
  const friendRef = doc(db, 'users', friendUid);
  const existingFriendRef = doc(db, 'users', currentUid, 'friends', friendUid);
  const [currentSnapshot, friendSnapshot, existingFriendSnapshot] = await Promise.all([
    getDoc(currentRef),
    getDoc(friendRef),
    getDoc(existingFriendRef),
  ]);

  if (!currentSnapshot.exists() || !friendSnapshot.exists()) {
    throw new Error('找不到使用者');
  }

  if (existingFriendSnapshot.exists()) {
    throw new Error('已經是好友');
  }

  const currentProfile = currentSnapshot.data() as UserProfile;
  const friendProfile = friendSnapshot.data() as UserProfile;
  const chatId = createChatId(currentUid, friendUid);
  const chatRef = doc(db, 'chats', chatId);
  const currentFriendRef = doc(db, 'users', currentUid, 'friends', friendUid);
  const friendFriendRef = doc(db, 'users', friendUid, 'friends', currentUid);
  const batch = writeBatch(db);

  batch.set(chatRef, {
    id: chatId,
    members: [currentUid, friendUid],
    memberInfo: {
      [currentUid]: publicUser(currentProfile),
      [friendUid]: publicUser(friendProfile),
    },
    lastMessage: null,
    lastMessageAt: null,
    lastMessageSenderId: null,
    unreadCounts: {
      [currentUid]: 0,
      [friendUid]: 0,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  batch.set(currentFriendRef, {
    ...publicUser(friendProfile),
    chatId,
    addedAt: serverTimestamp(),
  });

  batch.set(friendFriendRef, {
    ...publicUser(currentProfile),
    chatId,
    addedAt: serverTimestamp(),
  });

  await batch.commit();

  return chatId;
}

export async function sendFriendRequest(sender: UserProfile, recipientUid: string) {
  if (sender.uid === recipientUid) {
    throw new Error('不能邀請自己');
  }

  const recipientRef = doc(db, 'users', recipientUid);
  const existingFriendRef = doc(db, 'users', sender.uid, 'friends', recipientUid);
  const outgoingRef = doc(db, 'friendRequests', `${sender.uid}_${recipientUid}`);
  const incomingRef = doc(db, 'friendRequests', `${recipientUid}_${sender.uid}`);
  const [recipientSnapshot, friendSnapshot, outgoingSnapshot, incomingSnapshot] = await Promise.all([
    getDoc(recipientRef),
    getDoc(existingFriendRef),
    getDoc(outgoingRef),
    getDoc(incomingRef),
  ]);

  if (!recipientSnapshot.exists()) {
    throw new Error('找不到使用者');
  }

  if (friendSnapshot.exists()) {
    throw new Error('已經是好友');
  }

  if (outgoingSnapshot.exists()) {
    throw new Error('已送出好友邀請');
  }

  if (incomingSnapshot.exists()) {
    throw new Error('對方已邀請你，請直接接受邀請');
  }

  const recipient = recipientSnapshot.data() as UserProfile;

  await setDoc(outgoingRef, {
    senderId: sender.uid,
    recipientId: recipient.uid,
    sender: publicUser(sender),
    recipient: publicUser(recipient),
    createdAt: serverTimestamp(),
  });
}

export function subscribeFriendRequests(
  uid: string,
  onChange: (requests: FriendRequest[]) => void,
) {
  const requestsQuery = query(
    collection(db, 'friendRequests'),
    where('recipientId', '==', uid),
  );

  return onSnapshot(
    requestsQuery,
    (snapshot) => {
      const requests = snapshot.docs
        .map((requestDoc) => ({
          id: requestDoc.id,
          ...requestDoc.data(),
        }) as FriendRequest)
        .sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));

      onChange(requests);
    },
    (error) => {
      console.warn('Unable to subscribe to friend requests:', error);
      onChange([]);
    },
  );
}

export async function acceptFriendRequest(request: FriendRequest) {
  const senderRef = doc(db, 'users', request.senderId);
  const recipientRef = doc(db, 'users', request.recipientId);
  const [senderSnapshot, recipientSnapshot] = await Promise.all([
    getDoc(senderRef),
    getDoc(recipientRef),
  ]);

  if (!senderSnapshot.exists() || !recipientSnapshot.exists()) {
    throw new Error('使用者資料不存在');
  }

  const sender = senderSnapshot.data() as UserProfile;
  const recipient = recipientSnapshot.data() as UserProfile;
  const chatId = createChatId(sender.uid, recipient.uid);
  const batch = writeBatch(db);

  batch.set(doc(db, 'chats', chatId), {
    id: chatId,
    members: [sender.uid, recipient.uid],
    memberInfo: {
      [sender.uid]: publicUser(sender),
      [recipient.uid]: publicUser(recipient),
    },
    lastMessage: null,
    lastMessageAt: null,
    lastMessageSenderId: null,
    unreadCounts: {
      [sender.uid]: 0,
      [recipient.uid]: 0,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  batch.set(doc(db, 'users', sender.uid, 'friends', recipient.uid), {
    ...publicUser(recipient),
    chatId,
    addedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'users', recipient.uid, 'friends', sender.uid), {
    ...publicUser(sender),
    chatId,
    addedAt: serverTimestamp(),
  });
  batch.delete(doc(db, 'friendRequests', request.id));

  await batch.commit();
  return chatId;
}

export async function rejectFriendRequest(requestId: string) {
  await deleteDoc(doc(db, 'friendRequests', requestId));
}

export function subscribeFriends(uid: string, onChange: (friends: FriendProfile[]) => void) {
  return onSnapshot(
    collection(db, 'users', uid, 'friends'),
    (snapshot) => {
      const friends = snapshot.docs
        .map((friendDoc) => friendDoc.data() as FriendProfile)
        .sort((a, b) => a.displayName.localeCompare(b.displayName));

      onChange(friends);
    },
    (error) => {
      console.warn('Unable to subscribe to friends:', error);
      onChange([]);
    },
  );
}

export function subscribeChats(uid: string, onChange: (chats: ChatSummary[]) => void) {
  const chatsQuery = query(collection(db, 'chats'), where('members', 'array-contains', uid));

  return onSnapshot(
    chatsQuery,
    (snapshot) => {
      const chats = snapshot.docs
        .map((chatDoc) => ({ id: chatDoc.id, ...chatDoc.data() }) as ChatSummary)
        .sort((a, b) => (
          timestampMillis(b.lastMessageAt ?? b.updatedAt) - timestampMillis(a.lastMessageAt ?? a.updatedAt)
        ));

      onChange(chats);
    },
    (error) => {
      console.warn('Unable to subscribe to chats:', error);
      onChange([]);
    },
  );
}

export function subscribeChat(chatId: string, onChange: (chat: ChatSummary | null) => void) {
  return onSnapshot(
    doc(db, 'chats', chatId),
    (snapshot) => {
      onChange(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() }) as ChatSummary : null);
    },
    (error) => {
      console.warn('Unable to subscribe to chat:', error);
      onChange(null);
    },
  );
}

export function subscribeMessages(chatId: string, onChange: (messages: ChatMessage[]) => void) {
  const messagesQuery = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc'),
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      onChange(snapshot.docs.map((messageDoc) => ({
        id: messageDoc.id,
        chatId,
        ...messageDoc.data(),
      }) as ChatMessage));
    },
    (error) => {
      console.warn('Unable to subscribe to messages:', error);
      onChange([]);
    },
  );
}

export async function sendMessage(chatId: string, sender: UserProfile, text: string) {
  const trimmed = text.trim();

  if (!trimmed) return;

  const chatRef = doc(db, 'chats', chatId);
  const chatSnapshot = await getDoc(chatRef);

  if (!chatSnapshot.exists()) {
    throw new Error('找不到聊天室');
  }

  const chat = chatSnapshot.data() as ChatSummary;
  const recipientUid = chat.members.find((uid) => uid !== sender.uid);
  const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
  const batch = writeBatch(db);

  batch.set(messageRef, {
    chatId,
    senderId: sender.uid,
    senderName: sender.displayName,
    senderPhotoURL: sender.photoURL ?? null,
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  const chatUpdates: Record<string, unknown> = {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: sender.uid,
    updatedAt: serverTimestamp(),
    [`unreadCounts.${sender.uid}`]: 0,
  };

  if (recipientUid) {
    chatUpdates[`unreadCounts.${recipientUid}`] = increment(1);
  }

  batch.update(chatRef, chatUpdates);

  await batch.commit();
}

export async function markChatRead(chatId: string, uid: string) {
  await updateDoc(doc(db, 'chats', chatId), {
    [`unreadCounts.${uid}`]: 0,
  });
}

export async function createOrUpdateChatMember(uid: string, profile: UserProfile) {
  const friendSnapshots = await getDocs(collection(db, 'users', uid, 'friends'));
  const updates = friendSnapshots.docs.map(async (friendDoc) => {
    const chatId = (friendDoc.data() as FriendProfile).chatId;
    const chatRef = doc(db, 'chats', chatId);

    await updateDoc(chatRef, {
      [`memberInfo.${uid}`]: publicUser(profile),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'users', friendDoc.id, 'friends', uid), {
      ...publicUser(profile),
      chatId,
      addedAt: friendDoc.data().addedAt ?? serverTimestamp(),
    }, { merge: true });
  });

  await Promise.all(updates);
}
