// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGGOMkcvOlHbOPhbojIvJ-K-FaIwBKaww",
  authDomain: "prepwise977.firebaseapp.com",
  projectId: "prepwise977",
  storageBucket: "prepwise977.firebasestorage.app",
  messagingSenderId: "142427583592",
  appId: "1:142427583592:web:641e91e11086c3c14777dd",
  measurementId: "G-JTNW5TDWBN"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);