// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD7vdqxEOCuCEkfGKcm5YpATZWVGhEJZc4",
  authDomain: "allgoz-68cf5.firebaseapp.com",
  projectId: "allgoz-68cf5",
  storageBucket: "allgoz-68cf5.appspot.com",
  messagingSenderId: "797698017942",
  appId: "1:797698017942:web:49027243c9ac0bede390b7",
  measurementId: "G-MJYXN2KDR9"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
