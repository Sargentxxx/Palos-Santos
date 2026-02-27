"use client";

import { useState, useEffect } from "react";
import { database } from "../lib/firebase";
import { ref, push, onValue, serverTimestamp } from "firebase/database";

export default function EmployeeApp() {
  const [selectedBranch, setSelectedBranch] = useState("Sucursal Centro");
  const [requestText, setRequestText] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentRequests, setRecentRequests] = useState([]);

  useEffect(() => {
    // Listen to recent orders
    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert to array and sort by newest first
        const ordersArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        setRecentRequests(ordersArray.slice(0, 5)); // Keep last 5
      } else {
        setRecentRequests([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requestText.trim()) return;

    setLoading(true);
    try {
      const ordersRef = ref(database, 'orders');
      await push(ordersRef, {
        branch: selectedBranch,
        text: requestText,
        status: 'pending',
        timestamp: serverTimestamp(),
      });
      setRequestText("");
      // Add custom visual feedback
      alert("¡Solicitud enviada exitosamente!");
    } catch (error) {
      console.error("Error al enviar solicitud:", error);
      alert("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-container">
      <header className="header">
        <div className="logo-container">
          <i className="fa-solid fa-fire text-primary text-2xl"></i>
          <h1>Palos Santos</h1>
        </div>
        <div className="status-badge online">
          <span className="dot"></span> Conectado
        </div>
      </header>

      <section className="request-section glass-card">
        <h2><i className="fa-solid fa-paper-plane text-primary"></i> Nueva Solicitud</h2>
        <p className="subtitle">Notifica al administrador sobre stock bajo o insumos necesarios.</p>
        
        <form id="requestForm" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="branchSelect">Sucursal</label>
            <div className="select-wrapper">
              <select 
                id="branchSelect" 
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="Sucursal Centro">Sucursal Centro</option>
                <option value="Sucursal Norte">Sucursal Norte</option>
                <option value="Sucursal Sur">Sucursal Sur</option>
              </select>
              <i className="fa-solid fa-chevron-down select-icon"></i>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="requestText">¿Qué se necesita?</label>
            <textarea 
              id="requestText" 
              placeholder="Ej: Faltan sahumerios de Palo Santo (Quedan 2 cajas)..."
              required
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
            ></textarea>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} id="submitBtn">
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
            <span>{loading ? "Enviando..." : "Enviar Solicitud"}</span>
          </button>
        </form>
      </section>

      <section className="history-section">
        <h3><i className="fa-solid fa-clock-rotate-left"></i> Actividad Reciente</h3>
        <ul className="history-list" id="historyList">
          {recentRequests.length === 0 ? (
            <li className="history-item text-center text-muted" style={{justifyContent: 'center', border: 'none'}}>
               No hay solicitudes recientes.
            </li>
          ) : (
            recentRequests.map(req => (
              <li key={req.id} className="history-item">
                <div className="history-content">
                  <strong>{req.text}</strong>
                  <span><i className="fa-solid fa-store" style={{fontSize: "12px", marginRight: "4px"}}></i>{req.branch}</span>
                </div>
                <div className={`status-tag ${req.status === 'purchased' ? 'status-purchased' : 'status-pending'}`}>
                  {req.status === 'purchased' ? 'Comprado' : 'Pendiente'}
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
