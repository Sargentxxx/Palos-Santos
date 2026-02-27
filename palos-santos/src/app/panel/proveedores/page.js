"use client";

import { useState, useEffect } from "react";
import { database } from "../../../lib/firebase";
import { ref, onValue, push, set, update, remove } from "firebase/database";

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: "", cuit: "", telefono: "", email: "", productos: "", notas: "" });

  useEffect(() => {
    const unsub = onValue(ref(database, "proveedores"), (snap) => {
      const data = snap.val() || {};
      setProveedores(Object.entries(data).map(([id, v]) => ({ id, ...v })));
      setCargando(false);
    });
    return () => unsub();
  }, []);

  const abrirModal = (prov = null) => {
    if (prov) {
      setEditando(prov.id);
      setForm({ nombre: prov.nombre || "", cuit: prov.cuit || "", telefono: prov.telefono || "", email: prov.email || "", productos: prov.productos || "", notas: prov.notas || "" });
    } else {
      setEditando(null);
      setForm({ nombre: "", cuit: "", telefono: "", email: "", productos: "", notas: "" });
    }
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) { alert("El nombre es obligatorio."); return; }
    const datos = { ...form };
    if (editando) {
      await update(ref(database, `proveedores/${editando}`), datos);
    } else {
      await push(ref(database, "proveedores"), datos);
    }
    setModalAbierto(false);
  };

  const eliminar = async (id) => {
    if (confirm("¿Eliminar este proveedor?")) await remove(ref(database, `proveedores/${id}`));
  };

  return (
    <div className="admin-body">
      <div className="dashboard-container">
        <main className="main-content" style={{ width: "100%" }}>
          <header className="top-nav">
            <h1>Proveedores</h1>
            <div className="nav-actions">
              <button className="btn btn-cta" onClick={() => abrirModal()}>
                <i className="fa-solid fa-plus"></i> Nuevo Proveedor
              </button>
              <a href="/panel" className="btn btn-outline" style={{ textDecoration: "none" }}>
                <i className="fa-solid fa-arrow-left"></i> Volver
              </a>
            </div>
          </header>

          <div className="crm-media-grid">
            {cargando ? (
              Array(3).fill(0).map((_, i) => <div key={i} className="crm-card skeleton-card glass-panel" style={{ height: "180px" }}></div>)
            ) : proveedores.length === 0 ? (
              <div style={{ color: "var(--text-dim)", padding: "2rem" }}>No hay proveedores registrados.</div>
            ) : (
              proveedores.map(prov => (
                <div key={prov.id} className="crm-card glass-panel" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px" }}>{prov.nombre}</h3>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className="btn btn-secondary" style={{ fontSize: "12px" }} onClick={() => abrirModal(prov)}>
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button className="btn btn-outline" style={{ fontSize: "12px", color: "#ef4444", borderColor: "#ef4444" }} onClick={() => eliminar(prov.id)}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  {prov.cuit && <p style={{ color: "var(--text-dim)", fontSize: "13px", marginBottom: "4px" }}><strong>CUIT:</strong> {prov.cuit}</p>}
                  {prov.telefono && <p style={{ color: "var(--text-dim)", fontSize: "13px", marginBottom: "4px" }}><i className="fa-solid fa-phone"></i> {prov.telefono}</p>}
                  {prov.email && <p style={{ color: "var(--text-dim)", fontSize: "13px", marginBottom: "4px" }}><i className="fa-solid fa-envelope"></i> {prov.email}</p>}
                  {prov.productos && (
                    <div style={{ marginTop: "8px", padding: "8px", background: "rgba(255,255,255,0.03)", borderRadius: "6px", fontSize: "13px" }}>
                      <i className="fa-solid fa-box" style={{ marginRight: "6px", color: "#f97316" }}></i>
                      {prov.productos}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {modalAbierto && (
        <div className="modal-overlay" onClick={e => { if (e.target.className === "modal-overlay") setModalAbierto(false); }}>
          <div className="modal-content" style={{ maxWidth: "460px" }}>
            <div className="modal-header">
              <h2>{editando ? "Editar Proveedor" : "Nuevo Proveedor"}</h2>
              <button className="close-btn" onClick={() => setModalAbierto(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-body">
              {[
                { label: "Nombre / Razón Social", key: "nombre", placeholder: "Ej: Distribuidora Norte" },
                { label: "CUIT", key: "cuit", placeholder: "20-XXXXXXXX-X" },
                { label: "Teléfono", key: "telefono", placeholder: "381-XXXXXXX" },
                { label: "Email", key: "email", placeholder: "contacto@empresa.com" },
                { label: "Productos que provee", key: "productos", placeholder: "Ej: Harinas, Aceite, Sal" },
                { label: "Notas", key: "notas", placeholder: "Ej: Solo entrega los martes" },
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="input-group" style={{ marginBottom: "10px" }}>
                  <label>{label}</label>
                  <input type="text" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} />
                </div>
              ))}
              <button className="btn btn-cta" style={{ width: "100%", marginTop: "8px" }} onClick={guardar}>
                <i className="fa-solid fa-check"></i> {editando ? "Guardar Cambios" : "Crear Proveedor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
