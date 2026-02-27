"use client";

import { useState, useEffect } from "react";
import { database } from "../../../lib/firebase";
import { ref, onValue, push, set } from "firebase/database";

const METODOS_PAGO = ["Efectivo", "Transferencia", "Billetera Virtual"];
const TIPOS = ["Ingreso", "Egreso"];

export default function CajaPage() {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState({ tipo: "Ingreso", monto: "", metodo: "Efectivo", concepto: "" });

  const fechaHoy = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const cRef = ref(database, `caja/${fechaHoy}`);
    const unsub = onValue(cRef, (snap) => {
      const data = snap.val() || {};
      const arr = Object.entries(data)
        .flatMap(([turno, movs]) =>
          Object.entries(movs || {}).map(([id, v]) => ({ id, turno, ...v }))
        )
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setMovimientos(arr);
      setCargando(false);
    });
    return () => unsub();
  }, [fechaHoy]);

  const registrarMovimiento = async () => {
    if (!form.monto || !form.concepto.trim()) {
      alert("Completá monto y concepto.");
      return;
    }
    const turno = "principal";
    const nuevo = {
      tipo: form.tipo,
      monto: parseFloat(form.monto),
      metodo: form.metodo,
      concepto: form.concepto,
      timestamp: Date.now(),
    };
    await push(ref(database, `caja/${fechaHoy}/${turno}`), nuevo);
    setModalAbierto(false);
    setForm({ tipo: "Ingreso", monto: "", metodo: "Efectivo", concepto: "" });
  };

  const totalesPorMetodo = METODOS_PAGO.map(m => ({
    metodo: m,
    total: movimientos.filter(x => x.metodo === m && x.tipo === "Ingreso").reduce((a, x) => a + (x.monto || 0), 0),
  }));

  const totalGeneral = movimientos.filter(m => m.tipo === "Ingreso").reduce((a, m) => a + (m.monto || 0), 0);
  const totalEgresos = movimientos.filter(m => m.tipo === "Egreso").reduce((a, m) => a + (m.monto || 0), 0);

  return (
    <div className="admin-body">
      <div className="dashboard-container">
        <main className="main-content" style={{ width: "100%" }}>
          <header className="top-nav">
            <h1>Caja Diaria — {fechaHoy}</h1>
            <div className="nav-actions">
              <button className="btn btn-cta" onClick={() => setModalAbierto(true)}>
                <i className="fa-solid fa-plus"></i> Registrar Movimiento
              </button>
              <a href="/panel" className="btn btn-outline" style={{ textDecoration: "none" }}>
                <i className="fa-solid fa-arrow-left"></i> Volver
              </a>
            </div>
          </header>

          {/* Resumen */}
          <section className="metrics-section" style={{ marginBottom: "2rem" }}>
            <div className="metric-card glass-panel" style={{ borderLeft: "4px solid #22c55e" }}>
              <div className="metric-icon"><i className="fa-solid fa-arrow-up" style={{ color: "#22c55e" }}></i></div>
              <div className="metric-data"><h3>Total Ingresos</h3><p className="text-glow">$ {totalGeneral.toLocaleString("es-AR")}</p></div>
            </div>
            <div className="metric-card glass-panel" style={{ borderLeft: "4px solid #ef4444" }}>
              <div className="metric-icon"><i className="fa-solid fa-arrow-down" style={{ color: "#ef4444" }}></i></div>
              <div className="metric-data"><h3>Total Egresos</h3><p className="text-glow">$ {totalEgresos.toLocaleString("es-AR")}</p></div>
            </div>
            {totalesPorMetodo.map(tm => (
              <div key={tm.metodo} className="metric-card glass-panel">
                <div className="metric-icon">
                  <i className={`fa-solid ${tm.metodo === "Efectivo" ? "fa-money-bill" : tm.metodo === "Transferencia" ? "fa-building-columns" : "fa-wallet"}`}></i>
                </div>
                <div className="metric-data">
                  <h3>{tm.metodo}</h3>
                  <p className="text-glow">$ {tm.total.toLocaleString("es-AR")}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Lista */}
          <div>
            {cargando ? (
              <div style={{ color: "var(--text-dim)" }}>Cargando...</div>
            ) : movimientos.length === 0 ? (
              <div style={{ color: "var(--text-dim)", padding: "2rem" }}>No hay movimientos registrados hoy.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: "var(--text-dim)", fontSize: "13px", textAlign: "left" }}>
                    <th style={{ padding: "8px 12px" }}>Tipo</th>
                    <th style={{ padding: "8px 12px" }}>Concepto</th>
                    <th style={{ padding: "8px 12px" }}>Método</th>
                    <th style={{ padding: "8px 12px" }}>Monto</th>
                    <th style={{ padding: "8px 12px" }}>Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map(mov => (
                    <tr key={mov.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ color: mov.tipo === "Ingreso" ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                          {mov.tipo === "Ingreso" ? "↑" : "↓"} {mov.tipo}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>{mov.concepto}</td>
                      <td style={{ padding: "10px 12px", color: "var(--text-dim)", fontSize: "13px" }}>{mov.metodo}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: mov.tipo === "Ingreso" ? "#22c55e" : "#ef4444" }}>
                        $ {(mov.monto || 0).toLocaleString("es-AR")}
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--text-dim)", fontSize: "12px" }}>
                        {new Date(mov.timestamp).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={e => { if (e.target.className === "modal-overlay") setModalAbierto(false); }}>
          <div className="modal-content" style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <h2>Registrar Movimiento</h2>
              <button className="close-btn" onClick={() => setModalAbierto(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-body">
              <div className="input-group" style={{ marginBottom: "12px" }}>
                <label>Tipo</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: "12px" }}>
                <label>Monto ($)</label>
                <input type="number" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} placeholder="0" />
              </div>
              <div className="input-group" style={{ marginBottom: "12px" }}>
                <label>Método de pago</label>
                <select value={form.metodo} onChange={e => setForm(f => ({ ...f, metodo: e.target.value }))}>
                  {METODOS_PAGO.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: "16px" }}>
                <label>Concepto</label>
                <input type="text" value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} placeholder="Ej: Venta mostrador" />
              </div>
              <button className="btn btn-cta" style={{ width: "100%" }} onClick={registrarMovimiento}>
                <i className="fa-solid fa-check"></i> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
