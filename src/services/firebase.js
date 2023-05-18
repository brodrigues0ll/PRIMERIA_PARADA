import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

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

// Verificar se a persistência já está habilitada
if (!database._initialized && !database._settings.persistenceEnabled) {
  enableIndexedDbPersistence(database)
    .then(() => {
      console.log("Persistência de cache habilitada com sucesso");
      // Continuar com a inicialização da aplicação ou outras operações
    })
    .catch((error) => {
      if (error.code === "failed-precondition") {
        console.log("Persistência de cache já foi ativada em outra aba");
      } else if (error.code === "unimplemented") {
        console.log("Persistência de cache não suportada");
      }
    });
}

export { app, database };
