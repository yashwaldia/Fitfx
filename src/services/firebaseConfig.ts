import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';  // ← ADD THIS LINE

const firebaseConfig = {
  apiKey: "AIzaSyC5mLUi8AFfqtYWkmQQx2ZsrKdYB94wujI",
  authDomain: "fitfx-mobile.firebaseapp.com",
  projectId: "fitfx-mobile",
  storageBucket: "fitfx-mobile.firebasestorage.app",
  messagingSenderId: "378966673153",
  appId: "1:378966673153:web:d9844c42166a9a86c33d00"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const db = getFirestore(app);  // ← ADD THIS LINE
