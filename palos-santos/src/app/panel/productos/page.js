"use client";

import { useState, useEffect, useRef } from "react";
import { database, storage } from "../../../lib/firebase";
import { ref as dbRef, onValue, push, set, update, remove } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const CATEGORIAS_DEFAULT = ["Empanadas", "Gaseosas", "Tartas", "Postres", "Otros"];

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState(CATEGORIAS_DEFAULT);
  const [cargando, setCargando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [subiendoImg, setSubiendoImg] = useState(false);
  const fileRef = useRef();

  const [form, setForm] = useState({
    nombre: "", categoria: "", precio: "", stock: "", unidad: "unidad", topVendido: false, imageURL: ""
  });

  useEffect(() => {
    const unsub = onValue(dbRef(database, "productos"), (snap) => {
      const data = snap.val() || {};
      setProductos(Object.entries(data).map(([id, v]) => ({ id, ...v })));
      setCargando(false);
    });
    const unsubCats = onValue(dbRef(database, "categorias"), (snap) => {
      const data = snap.val();
      if (data) setCategorias(Object.values(data).map(c => c.nombre));
    });
    return () => { unsub(); unsubCats(); };
  }, []);

  const abrirModal = (prod = null) => {
    if (prod) {
      setEditando(prod.id);
      setForm({ nombre: prod.nombre, categoria: prod.categoria || "", precio: prod.precio || "", stock: prod.stock || 0, unidad: prod.unidad || "unidad", topVendido: prod.topVendido || false, imageURL: prod.imageURL || "" });
    } else {
      setEditando(null);
      setForm({ nombre: "", categoria: categorias[0] || "", precio: "", stock: "", unidad: "unidad", topVendido: false, imageURL: "" });
    }
    setModalAbierto(true);
  };

  const subirImagen = async (file) => {
    if (!file) return "";
    setSubiendoImg(true);
    try {
      const sRef = storageRef(storage, `productos/${Date.now()}_${file.name}`);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      setForm(f => ({ ...f, imageURL: url }));
      setSubiendoImg(false);
      return url;
    } catch (err) {
      alert("Error al subir imagen.");
      setSubiendoImg(false);
      return "";
    }
  };

  const guardarProducto = async () => {
    if (!form.nombre.trim()) { alert("El nombre es obligatorio."); return; }
    const datos = {
      nombre: form.nombre,
      categoria: form.categoria,
      precio: parseFloat(form.precio) || 0,
      stock: parseInt(form.stock) || 0,
      unidad: form.unidad,
      topVendido: form.topVendido,
      imageURL: form.imageURL,
    };
    if (editando) {
      await update(dbRef(database, `productos/${editando}`), datos);
    } else {
      await push(dbRef(database, "productos"), datos);
    }
    setModalAbierto(false);
  };

  const eliminarProducto = async (id) => {
    if (confirm("¿Eliminar este producto?")) {
      await remove(dbRef(database, `productos/${id}`));
    }
  };

  const toggleTop = async (prod) => {
    await update(dbRef(database, `productos/${prod.id}`), { topVendido: !prod.topVendido });
  };

  const productosFiltrados = filtroCategoria === "todas" ? productos : productos.filter(p => p.categoria === filtroCategoria);

  return (
    <div className="admin-body">
      <div className="dashboard-container">
        <main className="main-content" style={{ width: "100%" }}>
          <header className="top-nav">
            <h1>Productos</h1>
            <div className="nav-actions">
              <button className="btn btn-cta" onClick={() => abrirModal()}>
                <i className="fa-solid fa-plus"></i> Nuevo Producto
              </button>
              <a href="/panel" className="btn btn-outline" style={{ textDecoration: "none" }}>
                <i className="fa-solid fa-arrow-left"></i> Volver
              </a>
            </div>
          </header>

          {/* Filtro por categoría */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            <button className={`filter-btn ${filtroCategoria === "todas" ? "active" : ""}`} onClick={() => setFiltroCategoria("todas")}>Todas</button>
            {categorias.map(c => (
              <button key={c} className={`filter-btn ${filtroCategoria === c ? "active" : ""}`} onClick={() => setFiltroCategoria(c)}>{c}</button>
            ))}
          </div>

          {/* Grid Productos */}
          <div className="crm-media-grid">
            {cargando ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="crm-card skeleton-card glass-panel" style={{ height: "220px" }}></div>)
            ) : productosFiltrados.map(prod => (
              <div key={prod.id} className="crm-card glass-panel" style={{ padding: "16px", position: "relative" }}>
                {prod.topVendido && (
                  <span style={{ position: "absolute", top: "10px", right: "10px", background: "#f59e0b", color: "#000", borderRadius: "20px", padding: "2px 8px", fontSize: "11px", fontWeight: 700 }}>
                    ⭐ Top
                  </span>
                )}
                {prod.imageURL ? (
                  <img src={prod.imageURL} alt={prod.nombre} style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "8px", marginBottom: "10px" }} />
                ) : (
                  <div style={{ width: "100%", height: "80px", background: "rgba(249,115,22,0.1)", borderRadius: "8px", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="fa-solid fa-burger" style={{ fontSize: "2rem", color: "rgba(249,115,22,0.4)" }}></i>
                  </div>
                )}
                <h3 style={{ fontSize: "15px", marginBottom: "4px" }}>{prod.nombre}</h3>
                <p style={{ color: "var(--text-dim)", fontSize: "12px", marginBottom: "6px" }}>{prod.categoria || "Sin categoría"}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ color: "#f97316", fontWeight: 700 }}>$ {(prod.precio || 0).toLocaleString("es-AR")}</span>
                  <span style={{ fontSize: "13px", color: prod.stock <= 5 ? "#ef4444" : "var(--text-dim)" }}>
                    Stock: {prod.stock || 0} {prod.unidad}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button className="btn btn-secondary" style={{ flex: 1, fontSize: "12px" }} onClick={() => abrirModal(prod)}>
                    <i className="fa-solid fa-pen"></i> Editar
                  </button>
                  <button className="btn btn-outline" style={{ fontSize: "12px", padding: "6px 8px" }} onClick={() => toggleTop(prod)} title="Toggle Top Vendido">
                    {prod.topVendido ? "★" : "☆"}
                  </button>
                  <button className="btn btn-outline" style={{ fontSize: "12px", padding: "6px 8px", color: "#ef4444", borderColor: "#ef4444" }} onClick={() => eliminarProducto(prod.id)}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Modal */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={e => { if (e.target.className === "modal-overlay") setModalAbierto(false); }}>
          <div className="modal-content" style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <h2>{editando ? "Editar Producto" : "Nuevo Producto"}</h2>
              <button className="close-btn" onClick={() => setModalAbierto(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-body">
              {form.imageURL && <img src={form.imageURL} alt="Preview" style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "8px", marginBottom: "12px" }} />}
              <div className="input-group" style={{ marginBottom: "10px" }}>
                <label>Nombre del producto</label>
                <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Empanada de Carne" />
              </div>
              <div className="input-group" style={{ marginBottom: "10px" }}>
                <label>Categoría</label>
                <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                  {categorias.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div className="input-group">
                  <label>Precio ($)</label>
                  <input type="number" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Stock</label>
                  <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: "10px" }}>
                <label>Unidad</label>
                <select value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))}>
                  <option>unidad</option><option>kg</option><option>litro</option><option>porción</option>
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: "12px" }}>
                <label>Imagen del producto</label>
                <input type="file" accept="image/*" ref={fileRef} onChange={e => subirImagen(e.target.files[0])} />
                {subiendoImg && <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>Subiendo...</span>}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: "16px" }}>
                <input type="checkbox" checked={form.topVendido} onChange={e => setForm(f => ({ ...f, topVendido: e.target.checked }))} />
                <span>⭐ Marcar como <strong>Top Vendido</strong> (aparece en acceso rápido de pedidos)</span>
              </label>
              <button className="btn btn-cta" style={{ width: "100%" }} onClick={guardarProducto}>
                <i className="fa-solid fa-check"></i> {editando ? "Guardar Cambios" : "Crear Producto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
