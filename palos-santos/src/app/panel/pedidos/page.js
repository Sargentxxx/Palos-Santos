"use client";

import { useState, useEffect, useRef } from "react";
import { database } from "../../../lib/firebase";
import { ref, onValue, push, set, update } from "firebase/database";
import { useAuth } from "../../../context/AuthContext";

const ESTADOS = ["Pendiente", "En Preparación", "Listo", "Entregado"];
const METODOS_PAGO = ["Efectivo", "Transferencia", "Billetera Virtual"];

export default function PedidosPage() {
  const { perfil } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtrando, setFiltrando] = useState("todos");

  // Formulario nuevo pedido
  const [form, setForm] = useState({
    clienteNombre: "",
    clienteTelefono: "",
    items: [],
    metodoPago: "Efectivo",
    notas: "",
  });
  const [buscandoProd, setBuscandoProd] = useState("");

  useEffect(() => {
    const unsubPedidos = onValue(ref(database, "pedidos"), (snap) => {
      const data = snap.val() || {};
      const arr = Object.entries(data)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setPedidos(arr);
      setCargando(false);
    });

    const unsubProd = onValue(ref(database, "productos"), (snap) => {
      const data = snap.val() || {};
      setProductos(Object.entries(data).map(([id, v]) => ({ id, ...v })));
    });

    return () => { unsubPedidos(); unsubProd(); };
  }, []);

  const topVendidos = productos.filter(p => p.topVendido);
  const productosFiltrados = productos.filter(p =>
    p.nombre?.toLowerCase().includes(buscandoProd.toLowerCase())
  );

  const agregarItem = (producto) => {
    setForm(prev => {
      const existe = prev.items.find(i => i.id === producto.id);
      if (existe) {
        return { ...prev, items: prev.items.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i) };
      }
      return { ...prev, items: [...prev.items, { id: producto.id, nombre: producto.nombre, precio: producto.precio || 0, cantidad: 1 }] };
    });
  };

  const cambiarCantidad = (id, val) => {
    const n = parseInt(val) || 0;
    if (n <= 0) {
      setForm(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
    } else {
      setForm(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? { ...i, cantidad: n } : i) }));
    }
  };

  const totalPedido = form.items.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);

  const confirmarPedido = async () => {
    if (!form.clienteNombre.trim() || form.items.length === 0) {
      alert("Completá el nombre del cliente y agregá al menos un producto.");
      return;
    }
    const nuevo = {
      clienteNombre: form.clienteNombre,
      clienteTelefono: form.clienteTelefono,
      items: form.items,
      total: totalPedido,
      metodoPago: form.metodoPago,
      notas: form.notas,
      estado: "Pendiente",
      timestamp: Date.now(),
      creadoPor: perfil?.nombre || "Encargado",
    };

    const newRef = push(ref(database, "pedidos"));
    await set(newRef, nuevo);

    // descuento de stock
    for (const item of form.items) {
      const prodSnap = productos.find(p => p.id === item.id);
      if (prodSnap && prodSnap.stock !== undefined) {
        const nuevoStock = Math.max(0, (prodSnap.stock || 0) - item.cantidad);
        await update(ref(database, `productos/${item.id}`), { stock: nuevoStock });
      }
    }

    setModalAbierto(false);
    setForm({ clienteNombre: "", clienteTelefono: "", items: [], metodoPago: "Efectivo", notas: "" });
  };

  const avanzarEstado = async (pedido) => {
    const idx = ESTADOS.indexOf(pedido.estado);
    if (idx < ESTADOS.length - 1) {
      await update(ref(database, `pedidos/${pedido.id}`), { estado: ESTADOS[idx + 1] });
    }
  };

  const estadoColor = { "Pendiente": "#f59e0b", "En Preparación": "#6366f1", "Listo": "#22c55e", "Entregado": "#64748b" };

  const pedidosFiltrados = filtrando === "todos" ? pedidos : pedidos.filter(p => p.estado === filtrando);

  return (
    <div className="admin-body">
      <div className="dashboard-container">
        <main className="main-content" style={{ width: "100%" }}>
          <header className="top-nav">
            <h1>Pedidos</h1>
            <div className="nav-actions">
              <button className="btn btn-cta" onClick={() => setModalAbierto(true)}>
                <i className="fa-solid fa-plus"></i> Nuevo Pedido
              </button>
              <a href="/panel" className="btn btn-outline" style={{ textDecoration: "none" }}>
                <i className="fa-solid fa-arrow-left"></i> Volver
              </a>
            </div>
          </header>

          {/* Filtros */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            {["todos", ...ESTADOS].map(e => (
              <button key={e} className={`filter-btn ${filtrando === e ? "active" : ""}`} onClick={() => setFiltrando(e)}>
                {e === "todos" ? "Todos" : e}
              </button>
            ))}
          </div>

          {/* Lista Pedidos */}
          <div className="crm-media-grid">
            {cargando ? (
              Array(3).fill(0).map((_, i) => <div key={i} className="crm-card skeleton-card glass-panel" style={{ height: "180px" }}></div>)
            ) : pedidosFiltrados.length === 0 ? (
              <div style={{ color: "var(--text-dim)", padding: "2rem" }}>No hay pedidos en esta categoría.</div>
            ) : (
              pedidosFiltrados.map(ped => (
                <div key={ped.id} className="crm-card glass-panel" style={{ padding: "20px", borderLeft: `4px solid ${estadoColor[ped.estado] || "#888"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px" }}>{ped.clienteNombre}</h3>
                    <span style={{ background: estadoColor[ped.estado], color: "#fff", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>
                      {ped.estado}
                    </span>
                  </div>
                  {ped.clienteTelefono && <p style={{ color: "var(--text-dim)", fontSize: "13px", marginBottom: "8px" }}><i className="fa-solid fa-phone"></i> {ped.clienteTelefono}</p>}
                  <div style={{ marginBottom: "8px" }}>
                    {ped.items?.map((item, i) => (
                      <span key={i} style={{ display: "inline-block", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "8px", fontSize: "12px", margin: "2px" }}>
                        {item.cantidad}x {item.nombre}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                    <strong style={{ color: "var(--text-glow, #f97316)" }}>$ {ped.total?.toLocaleString("es-AR") || 0}</strong>
                    <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>{ped.metodoPago}</span>
                    {ped.estado !== "Entregado" && (
                      <button className="btn btn-cta" style={{ fontSize: "12px", padding: "6px 12px" }} onClick={() => avanzarEstado(ped)}>
                        <i className="fa-solid fa-circle-arrow-right"></i> {ESTADOS[ESTADOS.indexOf(ped.estado) + 1]}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Modal Nuevo Pedido */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={e => { if (e.target.className === "modal-overlay") setModalAbierto(false); }}>
          <div className="modal-content" style={{ maxWidth: "620px", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h2><i className="fa-solid fa-bell-concierge"></i> Nuevo Pedido</h2>
              <button className="close-btn" onClick={() => setModalAbierto(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-body">
              <div className="input-group" style={{ marginBottom: "12px" }}>
                <label>Nombre del cliente</label>
                <input type="text" value={form.clienteNombre} onChange={e => setForm(f => ({ ...f, clienteNombre: e.target.value }))} placeholder="Ej: María García" />
              </div>
              <div className="input-group" style={{ marginBottom: "12px" }}>
                <label>Teléfono (opcional)</label>
                <input type="tel" value={form.clienteTelefono} onChange={e => setForm(f => ({ ...f, clienteTelefono: e.target.value }))} placeholder="Ej: 381-4XXXXXX" />
              </div>

              {/* Top Vendidos - íconos rápidos */}
              {topVendidos.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: "var(--text-dim)" }}>
                    <i className="fa-solid fa-star" style={{ color: "#f59e0b" }}></i> Acceso Rápido — Más Vendidos
                  </label>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {topVendidos.map(p => (
                      <button key={p.id} onClick={() => agregarItem(p)}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                          background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)",
                          borderRadius: "12px", padding: "10px 14px", cursor: "pointer", color: "#fff", fontSize: "12px", fontWeight: 600 }}>
                        {p.imageURL ? (
                          <img src={p.imageURL} alt={p.nombre} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} />
                        ) : (
                          <i className="fa-solid fa-burger" style={{ fontSize: "28px", color: "#f97316" }}></i>
                        )}
                        {p.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Buscador de productos */}
              <div className="input-group" style={{ marginBottom: "8px" }}>
                <label>Buscar producto</label>
                <input type="text" value={buscandoProd} onChange={e => setBuscandoProd(e.target.value)} placeholder="Escribe para filtrar..." />
              </div>
              <div style={{ maxHeight: "160px", overflowY: "auto", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {productosFiltrados.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 10px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", cursor: "pointer" }}
                    onClick={() => agregarItem(p)}>
                    <span>{p.nombre} <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>[{p.categoria || "Sin cat."}]</span></span>
                    <span style={{ color: "#f97316", fontWeight: 600 }}>+ ${p.precio || 0}</span>
                  </div>
                ))}
              </div>

              {/* Items seleccionados */}
              {form.items.length > 0 && (
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px", marginBottom: "14px" }}>
                  <strong style={{ marginBottom: "8px", display: "block" }}>Productos seleccionados:</strong>
                  {form.items.map(item => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "14px" }}>{item.nombre}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input type="number" min="1" value={item.cantidad}
                          onChange={e => cambiarCantidad(item.id, e.target.value)}
                          style={{ width: "55px", textAlign: "center" }} />
                        <span style={{ color: "#f97316", fontSize: "13px" }}>= ${(item.precio * item.cantidad).toLocaleString("es-AR")}</span>
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px", marginTop: "8px", textAlign: "right" }}>
                    <strong>Total: ${totalPedido.toLocaleString("es-AR")}</strong>
                  </div>
                </div>
              )}

              <div className="input-group" style={{ marginBottom: "12px" }}>
                <label>Método de pago</label>
                <select value={form.metodoPago} onChange={e => setForm(f => ({ ...f, metodoPago: e.target.value }))}>
                  {METODOS_PAGO.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: "16px" }}>
                <label>Notas (opcional)</label>
                <input type="text" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Ej: Sin cebolla, para llevar..." />
              </div>

              <button className="btn btn-cta" style={{ width: "100%" }} onClick={confirmarPedido}>
                <i className="fa-solid fa-check"></i> Confirmar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
