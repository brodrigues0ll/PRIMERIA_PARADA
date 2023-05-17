import { initializeApp } from "firebase/app";
import firebase from "firebase/app";

import { getFirestore, disableNetwork } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const database = getFirestore(app);

const offlineOrOnline = (database) => {
  if (typeof window !== "undefined") {
    if (window.navigator.onLine) {
      console.log("online");
      firebase.firestore().enableNetwork();
    } else {
      console.log("offline");
      firebase.firestore().disableNetwork();
    }
  }
};

export { app, database, offlineOrOnline };
