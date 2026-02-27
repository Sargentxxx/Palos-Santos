"use client";

import { useState, useEffect } from "react";
import { database, auth } from "../../../lib/firebase";
import { ref, onValue, update, set } from "firebase/database";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";

const ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "encargado", label: "Encargado" },
  { value: "insumos", label: "Empleado de Insumos" },
];

export default function UsuariosPage() {
  const { perfil } = useAuth();
  const router = useRouter();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [viendoFicha, setViendoFicha] = useState(null);
  const [form, setForm] = useState({ nombre: "", email: "", password: "", rol: "encargado", sucursal: "", telefono: "", dni: "", notas: "" });
  const [guardando, setGuardando] = useState(false);

  // Solo admin puede entrar
  useEffect(() => {
    if (!cargando && perfil?.rol !== "admin") router.push("/panel");
  }, [perfil, cargando, router]);

  useEffect(() => {
    const unsub = onValue(ref(database, "usuarios"), (snap) => {
      const data = snap.val() || {};
      setUsuarios(Object.entries(data).map(([uid, v]) => ({ uid, ...v })));
      setCargando(false);
    });
    return () => unsub();
  }, []);

  const crearUsuario = async () => {
    if (!form.email || !form.password || !form.nombre) {
      alert("Nombre, email y contraseña son obligatorios.");
      return;
    }
    setGuardando(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = cred.user.uid;
      await set(ref(database, `usuarios/${uid}`), {
        nombre: form.nombre,
        email: form.email,
        rol: form.rol,
        sucursal: form.sucursal,
        telefono: form.telefono,
        dni: form.dni,
        notas: form.notas,
        activo: true,
        photoURL: "",
      });
      setModalAbierto(false);
      setForm({ nombre: "", email: "", password: "", rol: "encargado", sucursal: "", telefono: "", dni: "", notas: "" });
    } catch (err) {
      alert("Error al crear usuario: " + err.message);
    }
    setGuardando(false);
  };

  const toggleActivo = async (uid, actual) => {
    await update(ref(database, `usuarios/${uid}`), { activo: !actual });
  };

  const cambiarRol = async (uid, nuevoRol) => {
    await update(ref(database, `usuarios/${uid}`), { rol: nuevoRol });
  };

  const rolColor = { admin: "#f97316", encargado: "#6366f1", insumos: "#64748b" };

  return (
    <div className="admin-body">
      <div className="dashboard-container">
        <main className="main-content" style={{ width: "100%" }}>
          <header className="top-nav">
            <h1>Gestión de Usuarios</h1>
            <div className="nav-actions">
              <button className="btn btn-cta" onClick={() => setModalAbierto(true)}>
                <i className="fa-solid fa-user-plus"></i> Nuevo Usuario
              </button>
              <a href="/panel" className="btn btn-outline" style={{ textDecoration: "none" }}>
                <i className="fa-solid fa-arrow-left"></i> Volver
              </a>
            </div>
          </header>

          <div className="crm-media-grid">
            {cargando ? (
              Array(3).fill(0).map((_, i) => <div key={i} className="crm-card skeleton-card glass-panel" style={{ height: "180px" }}></div>)
            ) : (
              usuarios.map(u => (
                <div key={u.uid} className="crm-card glass-panel" style={{ padding: "20px", borderLeft: `4px solid ${rolColor[u.rol] || "#888"}`, opacity: u.activo === false ? 0.5 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    {u.photoURL ? (
                      <img src={u.photoURL} alt="Foto" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: rolColor[u.rol] || "#888", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#fff" }}>
                        {u.nombre?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div>
                      <h3 style={{ margin: 0, fontSize: "15px" }}>{u.nombre}</h3>
                      <span style={{ fontSize: "12px", color: rolColor[u.rol], fontWeight: 600 }}>
                        {ROLES.find(r => r.value === u.rol)?.label || u.rol}
                      </span>
                    </div>
                  </div>
                  {u.email && <p style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "4px" }}><i className="fa-solid fa-envelope"></i> {u.email}</p>}
                  {u.sucursal && <p style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "4px" }}><i className="fa-solid fa-store"></i> {u.sucursal}</p>}
                  {u.telefono && <p style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "8px" }}><i className="fa-solid fa-phone"></i> {u.telefono}</p>}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                    <select value={u.rol} onChange={e => cambiarRol(u.uid, e.target.value)}
                      style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "8px", padding: "6px" }}>
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <button className="btn btn-secondary" style={{ fontSize: "12px" }} onClick={() => setViendoFicha(u)}>
                      <i className="fa-solid fa-id-card"></i>
                    </button>
                    <button
                      className={`btn ${u.activo !== false ? "btn-outline" : "btn-cta"}`}
                      style={{ fontSize: "12px", padding: "6px 10px" }}
                      onClick={() => toggleActivo(u.uid, u.activo !== false)}
                    >
                      {u.activo !== false ? <i className="fa-solid fa-ban"></i> : <i className="fa-solid fa-check"></i>}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Modal Nuevo Usuario */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={e => { if (e.target.className === "modal-overlay") setModalAbierto(false); }}>
          <div className="modal-content" style={{ maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h2><i className="fa-solid fa-user-plus"></i> Nuevo Usuario</h2>
              <button className="close-btn" onClick={() => setModalAbierto(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-body">
              {[
                { label: "Nombre completo", key: "nombre", type: "text", placeholder: "Juan Pérez" },
                { label: "Email (usuario de login)", key: "email", type: "email", placeholder: "juan@palossantos.com" },
                { label: "Contraseña inicial", key: "password", type: "password", placeholder: "Mín. 6 caracteres" },
                { label: "DNI", key: "dni", type: "text", placeholder: "XXXXXXXX" },
                { label: "Teléfono", key: "telefono", type: "tel", placeholder: "381-XXXXXXX" },
                { label: "Sucursal", key: "sucursal", type: "text", placeholder: "Ej: Centro" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} className="input-group" style={{ marginBottom: "10px" }}>
                  <label>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} />
                </div>
              ))}
              <div className="input-group" style={{ marginBottom: "12px" }}>
                <label>Rol</label>
                <select value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: "16px" }}>
                <label>Notas internas</label>
                <input type="text" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Opcional" />
              </div>
              <button className="btn btn-cta" style={{ width: "100%" }} onClick={crearUsuario} disabled={guardando}>
                {guardando ? <><i className="fa-solid fa-spinner fa-spin"></i> Creando...</> : <><i className="fa-solid fa-check"></i> Crear Usuario</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ficha Usuario */}
      {viendoFicha && (
        <div className="modal-overlay" onClick={() => setViendoFicha(null)}>
          <div className="modal-content" style={{ maxWidth: "380px" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ficha de Personal</h2>
              <button className="close-btn" onClick={() => setViendoFicha(null)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-body" style={{ textAlign: "center" }}>
              {viendoFicha.photoURL ? (
                <img src={viendoFicha.photoURL} alt="Foto" style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", marginBottom: "12px" }} />
              ) : (
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: rolColor[viendoFicha.rol], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "#fff", margin: "0 auto 12px" }}>
                  {viendoFicha.nombre?.[0]?.toUpperCase()}
                </div>
              )}
              <h3 style={{ marginBottom: "4px" }}>{viendoFicha.nombre}</h3>
              <span style={{ color: rolColor[viendoFicha.rol], fontSize: "13px", fontWeight: 600 }}>{ROLES.find(r => r.value === viendoFicha.rol)?.label}</span>
              <div style={{ marginTop: "16px", textAlign: "left", display: "flex", flexDirection: "column", gap: "8px" }}>
                {[["DNI", viendoFicha.dni], ["Email", viendoFicha.email], ["Teléfono", viendoFicha.telefono], ["Sucursal", viendoFicha.sucursal], ["Notas", viendoFicha.notas]].map(([label, val]) =>
                  val ? <p key={label} style={{ fontSize: "14px", margin: 0 }}><strong>{label}:</strong> {val}</p> : null
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
