import { Timestamp } from 'firebase/firestore';

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  searchKeywords: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type FriendProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  chatId: string;
  addedAt?: Timestamp;
};

export type ChatSummary = {
  id: string;
  members: string[];
  memberInfo: Record<string, {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
  }>;
  lastMessage: string | null;
  lastMessageAt?: Timestamp | null;
  lastMessageSenderId?: string | null;
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL: string | null;
  text: string;
  createdAt?: Timestamp | null;
};
