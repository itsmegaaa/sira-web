import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, startAfter, where, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCfoyVBf7sK2K2NlfoBXd3s4wOqAyW3b8o",
  authDomain: "gabutinc.firebaseapp.com",
  projectId: "gabutinc",
  storageBucket: "gabutinc.firebasestorage.app",
  messagingSenderId: "689228076617",
  appId: "1:689228076617:web:c8c8f8a184e0d699ea9198"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, onAuthStateChanged, signInWithEmailAndPassword, signOut, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, startAfter, where, onSnapshot, serverTimestamp };
