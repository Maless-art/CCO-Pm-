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

    apiKey: "AIzaSyB8OXd7xWd66cux_TkCGA8OGrHV1b6SMS0",

    authDomain:
        "control-de-cobros-operativos.firebaseapp.com",

    projectId:
        "control-de-cobros-operativos",

    storageBucket:
        "control-de-cobros-operativos.firebasestorage.app",

    messagingSenderId:
        "431214411305",

    appId:
        "1:431214411305:web:a9428c6e05e310e2bb2638"

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