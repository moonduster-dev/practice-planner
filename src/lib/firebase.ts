import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase config is available (env vars are set)
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;

// Initialize Firebase only if config is valid and it hasn't been initialized
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (isConfigValid) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
} else if (typeof window !== 'undefined') {
  // Only warn in browser, not during build
  console.warn('Firebase config is missing. Check your environment variables.');
}

export { app, db };
