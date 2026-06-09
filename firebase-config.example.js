// ============================================
// FIREBASE CONFIG TEMPLATE
// ============================================
// Salin file ini menjadi firebase-config.js
// dan isi dengan kredensial Firebase Anda.
//
// cp firebase-config.example.js public/js/firebase-config.js
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, startAfter, where, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, onAuthStateChanged, signInWithEmailAndPassword, signOut, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, startAfter, where, onSnapshot, serverTimestamp };
