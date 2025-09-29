// Import the functions you need from the SDKs you need
import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyAkMaPYej5Y8UjTMpWu5VzXJa6nP-xblKQ",
  authDomain: "pooyeshyar.firebaseapp.com",
  projectId: "pooyeshyar",
  storageBucket: "pooyeshyar.firebasestorage.app",
  messagingSenderId: "870978399581",
  appId: "1:870978399581:web:6510a769102ad6ccd24cb4",
  measurementId: "G-XPFBCZDL4V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);