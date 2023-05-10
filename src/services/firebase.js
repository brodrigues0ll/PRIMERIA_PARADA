import { initializeApp } from "firebase/app";
import firebase from "firebase/app";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAgHD0-W-dS6QCVdiL4cvqBOou6dppZS_I",
  authDomain: "primeira-parada-55f09.firebaseapp.com",
  projectId: "primeira-parada-55f09",
  storageBucket: "primeira-parada-55f09.appspot.com",
  messagingSenderId: "226861101426",
  appId: "1:226861101426:web:9c6b237f6d73f805326deb",
};

const app = initializeApp(firebaseConfig);
const database = getFirestore(app);

export { app, database };
