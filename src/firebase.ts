// kdsdulcecrepafront/src/firebase.ts
import { initializeApp } from "firebase/app";
import { 
    collection, 
    doc, 
    getDocs,
    updateDoc, 
    onSnapshot, 
    query, 
    where, 
    orderBy,
    initializeFirestore, 
    persistentLocalCache, 
    persistentMultipleTabManager,
    type DocumentData,
    type QuerySnapshot, 
    type QueryDocumentSnapshot,
    type Timestamp 
} from "firebase/firestore";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
const app = initializeApp(firebaseConfig);

// Habilitar caché offline y entre pestañas
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export { collection, doc, getDocs, updateDoc, onSnapshot, query, where, orderBy };
export type { DocumentData, QuerySnapshot, QueryDocumentSnapshot, Timestamp };