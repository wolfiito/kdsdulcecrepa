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
  apiKey: "AIzaSyA_H_rGtLHa_WKzn2DvduS2m6L69C5xCYs",
  authDomain: "dulcecrepapos.firebaseapp.com",
  projectId: "dulcecrepapos",
  storageBucket: "dulcecrepapos.firebasestorage.app",
  messagingSenderId: "1036136584049",
  appId: "1:1036136584049:web:32d7baea5fa295e7dc9cd0"
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