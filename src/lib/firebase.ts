import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA3bRiseNDYF-61ZWCLII8PJxTJmi920WM",
  authDomain: "taskit-c85cc.firebaseapp.com",
  projectId: "taskit-c85cc",
  storageBucket: "taskit-c85cc.firebasestorage.app",
  messagingSenderId: "939079060225",
  appId: "1:939079060225:web:c9b8ff4a1b207951b7e900"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence with proper error handling
try {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn('Multiple tabs open, persistence disabled');
    } else if (err.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.warn('Persistence not supported');
    }
  });
} catch (err) {
  console.warn('Error enabling persistence:', err);
}