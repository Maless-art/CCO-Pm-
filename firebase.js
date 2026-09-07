/*=========================================================
FIREBASE
=========================================================*/

import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    limit
} from
"https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from
"https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyB6-4cIM2s5sHGxkNfLvREEfVnbQtrd2jg",
  authDomain: "cco-pma.firebaseapp.com",
  projectId: "cco-pma",
  storageBucket: "cco-pma.firebasestorage.app",
  messagingSenderId: "258875434069",
  appId: "1:258875434069:web:5cff50eb14e0b56c3320dc"
};

const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);

export const db = getFirestore(firebaseApp);

await setPersistence(
    auth,
    browserLocalPersistence
);

export {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    doc,
    getDoc,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    limit
};