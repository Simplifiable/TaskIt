import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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