"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { auth, database } from "../lib/firebase";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null); // datos del usuario en la DB
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // fetch user profile from RTDB
        const perfilRef = ref(database, `usuarios/${firebaseUser.uid}`);
        const unsubscribeDB = onValue(perfilRef, (snapshot) => {
          if (snapshot.exists()) {
            setPerfil(snapshot.val());
          } else {
            setPerfil({ rol: "insumos", nombre: firebaseUser.email });
          }
          setCargando(false);
        });
        return () => unsubscribeDB();
      } else {
        setUser(null);
        setPerfil(null);
        setCargando(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const cerrarSesion = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, perfil, cargando, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
