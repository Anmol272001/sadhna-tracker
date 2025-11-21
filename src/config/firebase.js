import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyB5fQmCYBciqATq3HbaCdqOjIoFUFZmGtk",
    authDomain: "iyf-sadhna-tracker.firebaseapp.com",
    projectId: "iyf-sadhna-tracker",
    storageBucket: "iyf-sadhna-tracker.firebasestorage.app",
    messagingSenderId: "372996148813",
    appId: "1:372996148813:web:b917a3f764efa356519604"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, firebaseConfig };
