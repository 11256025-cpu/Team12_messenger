import {
  EmailAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { auth, db, storage } from '@/firebaseConfig';
import { UserProfile } from '@/types/user';
import { buildSearchKeywords } from '@/utils/search';

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  dataError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateAccount: (updates: { displayName?: string; photoURL?: string | null }) => Promise<void>;
  changePassword: (currentPassword: string, nextPassword: string) => Promise<void>;
  uploadAvatar: (uri: string, file?: Blob | null, mimeType?: string | null) => Promise<string>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function fallbackName(email: string) {
  return email.split('@')[0] || 'New user';
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

async function ensureUserProfile(currentUser: User) {
  const email = normalizeEmail(currentUser.email ?? '');
  const displayName = currentUser.displayName?.trim() || fallbackName(email);
  const photoURL = currentUser.photoURL ?? null;

  await setDoc(
    doc(db, 'users', currentUser.uid),
    {
      uid: currentUser.uid,
      email,
      displayName,
      photoURL,
      searchKeywords: buildSearchKeywords(currentUser.uid, email, displayName),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

function createFallbackProfile(currentUser: User): UserProfile {
  const email = normalizeEmail(currentUser.email ?? '');
  const displayName = currentUser.displayName?.trim() || fallbackName(email);

  return {
    uid: currentUser.uid,
    email,
    displayName,
    photoURL: currentUser.photoURL ?? null,
    searchKeywords: buildSearchKeywords(currentUser.uid, email, displayName),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      unsubscribeProfile?.();
      setUser(currentUser);
      setProfile(null);
      setDataError(null);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        await ensureUserProfile(currentUser);
      } catch (error) {
        console.warn('Unable to create/update user profile:', error);
        setProfile(createFallbackProfile(currentUser));
        setDataError('Firebase Firestore 權限尚未開啟，會員資料暫時無法同步。');
        setLoading(false);
        return;
      }

      unsubscribeProfile = onSnapshot(
        doc(db, 'users', currentUser.uid),
        (snapshot) => {
          setProfile(snapshot.exists() ? snapshot.data() as UserProfile : createFallbackProfile(currentUser));
          setLoading(false);
        },
        (error) => {
          console.warn('Unable to subscribe to user profile:', error);
          setProfile(createFallbackProfile(currentUser));
          setDataError('Firebase Firestore 權限尚未開啟，會員資料暫時無法同步。');
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    loading,
    dataError,
    signIn: async (email, password) => {
      await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
    },
    signUp: async (email, password, displayName) => {
      const normalizedEmail = normalizeEmail(email);
      const cleanName = displayName.trim() || fallbackName(normalizedEmail);
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

      await updateProfile(credential.user, { displayName: cleanName });
      await setDoc(doc(db, 'users', credential.user.uid), {
        uid: credential.user.uid,
        email: normalizedEmail,
        displayName: cleanName,
        photoURL: null,
        searchKeywords: buildSearchKeywords(credential.user.uid, normalizedEmail, cleanName),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
    signOut: async () => {
      await firebaseSignOut(auth);
    },
    updateAccount: async (updates) => {
      if (!auth.currentUser) {
        throw new Error('尚未登入');
      }

      const nextDisplayName = updates.displayName?.trim();
      const nextPhotoURL = updates.photoURL;
      const profileUpdates: { displayName?: string; photoURL?: string | null } = {};
      const firestoreUpdates: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      if (nextDisplayName) {
        profileUpdates.displayName = nextDisplayName;
        firestoreUpdates.displayName = nextDisplayName;
        firestoreUpdates.searchKeywords = buildSearchKeywords(
          auth.currentUser.uid,
          auth.currentUser.email ?? '',
          nextDisplayName,
        );
      }

      if (nextPhotoURL !== undefined) {
        profileUpdates.photoURL = nextPhotoURL;
        firestoreUpdates.photoURL = nextPhotoURL;
      }

      await updateProfile(auth.currentUser, profileUpdates);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), firestoreUpdates);
    },
    changePassword: async (currentPassword, nextPassword) => {
      if (!auth.currentUser?.email) {
        throw new Error('尚未登入');
      }

      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, nextPassword);
    },
    uploadAvatar: async (uri, file, mimeType) => {
      if (!auth.currentUser) {
        throw new Error('尚未登入');
      }

      let uploadData: Blob;

      if (file) {
        uploadData = file;
      } else {
        const response = await withTimeout(fetch(uri), 15000, '讀取圖片逾時，請重新選擇圖片。');

        if (!response.ok) {
          throw new Error(`無法讀取圖片 (${response.status})`);
        }

        uploadData = await withTimeout(response.blob(), 15000, '處理圖片逾時，請重新選擇圖片。');
      }

      const extension = mimeType?.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      const avatarRef = ref(storage, `avatars/${auth.currentUser.uid}/avatar-${Date.now()}.${extension}`);
      const uploadResult = await withTimeout(
        uploadBytes(avatarRef, uploadData, {
          contentType: mimeType || uploadData.type || 'image/jpeg',
        }),
        30000,
        '圖片上傳逾時，請檢查 Firebase Storage 設定與網路連線。',
      );

      return withTimeout(
        getDownloadURL(uploadResult.ref),
        15000,
        '取得頭像網址逾時，請稍後再試。',
      );
    },
  }), [dataError, loading, profile, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
