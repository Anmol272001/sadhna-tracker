import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD2Tn8P-uxW6mF4y6qAOSTczivjtvaja04",
  authDomain: "react-sadhana-av-27.firebaseapp.com",
  projectId: "react-sadhana-av-27",
  storageBucket: "react-sadhana-av-27.firebasestorage.app",
  messagingSenderId: "116299810862",
  appId: "1:116299810862:web:8f9afc1f6efac78f7ef7bf"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, firebaseConfig };
