import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const isEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

const firebaseConfig = {
  apiKey: isEmulator ? "demo-api-key" : import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: isEmulator ? "demo-project.firebaseapp.com" : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: isEmulator ? "demo-project" : import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: isEmulator ? "demo-project.appspot.com" : import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: isEmulator ? "demo-sender" : import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: isEmulator ? "demo-app-id" : import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

if (isEmulator) {
  console.log("🔥 Connecting to Firebase Emulators (demo-project) on 127.0.0.1:8090...");
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8090);
}
