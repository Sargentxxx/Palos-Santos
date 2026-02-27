import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Proyecto: palos-santos-app (Palos Santos)
const firebaseConfig = {
  apiKey: "AIzaSyDa9b9hj6lCk0QpU2fV6tTJxTz2fmQEfJ4",
  authDomain: "palos-santos-app.firebaseapp.com",
  projectId: "palos-santos-app",
  storageBucket: "palos-santos-app.firebasestorage.app",
  messagingSenderId: "645907157655",
  appId: "1:645907157655:web:37ad0cf0bbb16ad4d4cfd2",
  databaseURL: "https://palos-santos-app-default-rtdb.firebaseio.com"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, database, auth, storage };
