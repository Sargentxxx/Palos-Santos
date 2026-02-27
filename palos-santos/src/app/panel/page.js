"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";


export default function PanelPage() {
  const { perfil, cerrarSesion } = useAuth();
  const [seccion, setSeccion] = useState("inicio");
  const router = useRouter();

  const esAdmin = perfil?.rol === "admin";
  const esEncargado = perfil?.rol === "encargado" || perfil?.rol === "admin";

  const navItems = [
    { id: "inicio", label: "Inicio", icon: "fa-chart-pie", roles: ["admin", "encargado"] },
    { id: "pedidos", label: "Pedidos", icon: "fa-bell-concierge", roles: ["admin", "encargado"] },
    { id: "productos", label: "Productos", icon: "fa-burger", roles: ["admin", "encargado"] },
    { id: "caja", label: "Caja Diaria", icon: "fa-cash-register", roles: ["admin", "encargado"] },
    { id: "proveedores", label: "Proveedores", icon: "fa-truck", roles: ["admin", "encargado"] },
    { id: "insumos", label: "Insumos/Stock", icon: "fa-boxes-stacked", roles: ["admin", "encargado"] },
    { id: "usuarios", label: "Usuarios", icon: "fa-users-gear", roles: ["admin"] },
    { id: "instagram", label: "Instagram", icon: "fab fa-instagram", roles: ["admin", "encargado"] },
  ];

  const navigate = (seccId) => {
    if (seccId === "pedidos") router.push("/panel/pedidos");
    else if (seccId === "productos") router.push("/panel/productos");
    else if (seccId === "caja") router.push("/panel/caja");
    else if (seccId === "proveedores") router.push("/panel/proveedores");
    else if (seccId === "usuarios") router.push("/panel/usuarios");
    else if (seccId === "insumos") router.push("/insumos");
    else setSeccion(seccId);
  };

  return (
    <div className="admin-body">
      <div className="dashboard-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <i className="fa-solid fa-fire logo-icon"></i>
            <h2>Palos Santos</h2>
          </div>
          <ul className="nav-menu">
            {navItems
              .filter(item => item.roles.includes(perfil?.rol))
              .map(item => (
                <li
                  key={item.id}
                  className={`nav-item ${seccion === item.id ? "active" : ""}`}
                  onClick={() => navigate(item.id)}
                >
                  <a href="#" className="nav-link" onClick={e => e.preventDefault()}>
                    <i className={item.id === "instagram" ? "fab fa-instagram" : `fa-solid ${item.icon}`}></i>
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
          </ul>
          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="avatar">
                {perfil?.photoURL ? (
                  <img src={perfil.photoURL} alt="Foto" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <i className="fa-solid fa-user"></i>
                )}
              </div>
              <div className="user-info">
                <strong>{perfil?.nombre || "Usuario"}</strong>
                <span>{perfil?.rol === "admin" ? "Administrador" : perfil?.rol === "encargado" ? "Encargado" : "Insumos"}</span>
              </div>
            </div>
            <button
              className="btn btn-outline"
              style={{ marginTop: "12px", width: "100%", fontSize: "13px" }}
              onClick={cerrarSesion}
            >
              <i className="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <header className="top-nav">
            <h1>
              {seccion === "inicio" && "Resumen General"}
              {seccion === "instagram" && "Instagram"}
            </h1>
          </header>

          {seccion === "inicio" && <SeccionInicio perfil={perfil} />}
          {seccion === "instagram" && <SeccionInstagram />}
        </main>
      </div>
    </div>
  );
}

function SeccionInicio({ perfil }) {
  return (
    <section className="metrics-section" style={{ paddingTop: "2rem" }}>
      <div className="metric-card glass-panel" style={{ borderLeft: "4px solid var(--accent-primary)" }}>
        <div className="metric-icon"><i className="fa-solid fa-bell-concierge"></i></div>
        <div className="metric-data">
          <h3>Pedidos de Hoy</h3>
          <p className="text-glow">—</p>
        </div>
      </div>
      <div className="metric-card glass-panel" style={{ borderLeft: "4px solid var(--status-yellow)" }}>
        <div className="metric-icon"><i className="fa-solid fa-cash-register" style={{ color: "var(--status-yellow)" }}></i></div>
        <div className="metric-data">
          <h3>Caja del Día</h3>
          <p className="text-glow">—</p>
        </div>
      </div>
      <div className="metric-card glass-panel" style={{ borderLeft: "4px solid var(--good-green)" }}>
        <div className="metric-icon"><i className="fa-solid fa-boxes-stacked" style={{ color: "var(--good-green)" }}></i></div>
        <div className="metric-data">
          <h3>Alertas de Stock</h3>
          <p className="text-glow">—</p>
        </div>
      </div>
      <div className="metric-card glass-panel">
        <div className="metric-icon"><i className="fa-solid fa-circle-user"></i></div>
        <div className="metric-data">
          <h3>Bienvenido/a</h3>
          <p className="text-glow" style={{ fontSize: "1rem" }}>{perfil?.nombre || "Usuario"}</p>
        </div>
      </div>
    </section>
  );
}

function SeccionInstagram() {
  return (
    <section className="media-management">
      <div className="section-header">
        <h2>Actividad Reciente en Instagram</h2>
      </div>
      <p style={{ color: "var(--text-dim)", marginTop: "1rem" }}>Integración con @palossantos.sgo próximamente.</p>
    </section>
  );
}
