import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { Auth, Persistence, getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBt_kuIE0bmd-PhcT5WGMeO8v0FqbuX2Ik',
  authDomain: 'chatapp-team12-ede47.firebaseapp.com',
  projectId: 'chatapp-team12-ede47',
  storageBucket: 'chatapp-team12-ede47.firebasestorage.app',
  messagingSenderId: '1037252753564',
  appId: '1:1037252753564:web:215c818dc49762a8175559',
  measurementId: 'G-E8T00020EF',
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

const authStorage = createAsyncStorage('team12-auth');
type ReactNativeAuthModule = typeof FirebaseAuth & {
  getReactNativePersistence?: (storage: typeof authStorage) => Persistence;
};

let auth: Auth;

try {
  // The RN Firebase bundle provides this at runtime. Keeping the lookup dynamic
  // avoids TypeScript issues with the web-only public declarations.
  const getReactNativePersistence = (FirebaseAuth as ReactNativeAuthModule).getReactNativePersistence;

  if (typeof getReactNativePersistence === 'function') {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(authStorage),
    });
  } else {
    auth = getAuth(app);
  }
} catch {
  auth = getAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
