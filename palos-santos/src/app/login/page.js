"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/panel");
    } catch (err) {
      setError("Usuario o contraseña incorrectos.");
      setCargando(false);
    }
  };

  return (
    <div className="login-body">
      <div className="login-container">
        <div className="login-header">
          <i className="fa-solid fa-fire login-logo"></i>
          <h1>Palos Santos</h1>
          <p>Sistema de Gestión Interno</p>
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">
              <i className="fa-solid fa-envelope"></i> Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@palossantos.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">
              <i className="fa-solid fa-lock"></i> Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div className="login-error">
              <i className="fa-solid fa-circle-exclamation"></i> {error}
            </div>
          )}
          <button type="submit" className="btn btn-cta btn-login" disabled={cargando}>
            {cargando ? (
              <><i className="fa-solid fa-spinner fa-spin"></i> Ingresando...</>
            ) : (
              <><i className="fa-solid fa-right-to-bracket"></i> Ingresar</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
