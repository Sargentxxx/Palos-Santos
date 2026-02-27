"use client";

import { useState, useEffect } from "react";
import "./admin.css";
import { database } from "../../lib/firebase";
import { ref, onValue, update } from "firebase/database";

// This simulates the data we'd fetch from Instagram
const MOCK_INSTAGRAM_DATA = {
  followers: "24.5K",
  posts: "1,248",
  media: [
    {
      id: "media_1",
      type: "image",
      url: "https://images.unsplash.com/photo-1544025162-8111140024f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      caption: "Nuevo stock de sahumerios disponible \u2728 #palossantos",
      date: "Hace 2 horas"
    },
    {
      id: "media_2",
      type: "video",
      url: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      caption: "\u00bfYa conoces nuestra l\u00ednea premium? \ud83c\udfbf",
      date: "Ayer"
    }
  ]
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("social");
  const [instagramData, setInstagramData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate IG fetch delay
    const timer = setTimeout(() => {
      setInstagramData(MOCK_INSTAGRAM_DATA);
    }, 1000);

    // Realtime Database Connection for Orders
    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ordersArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setOrders(ordersArray);
      } else {
        setOrders([]);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const lowStockCount = orders.filter(o => o.text.toLowerCase().includes("faltan") || o.text.toLowerCase().includes("quedan") || o.text.toLowerCase().includes("pocos")).length;
  const pendingOrdersCount = orders.filter(o => o.status === "pending").length;

  const handleMarkPurchased = async (id) => {
    try {
      const orderRef = ref(database, `orders/${id}`);
      await update(orderRef, { status: "purchased" });
    } catch (error) {
      console.error("Error al actualizar la orden:", error);
      alert("Error de conexión al marcar como comprado.");
    }
  };

  return (
    <div className="admin-body">
      <div className="dashboard-container" style={{width: '100%', height: '100vh'}}>
        {/* Sidebar Navigation */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <i className="fa-solid fa-fire logo-icon"></i>
            <h2>Palos Santos</h2>
          </div>
          <ul className="nav-menu">
            <li className="nav-item">
              <a href="#" className="nav-link">
                <i className="fa-solid fa-chart-pie"></i>
                <span>Overview</span>
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link">
                <i className="fa-solid fa-bell-concierge"></i>
                <span>Online Orders</span>
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab("inventory"); }}>
              <a href="#inventory" className="nav-link">
                <i className="fa-solid fa-boxes-stacked"></i>
                <span>Inventory Hub</span>
              </a>
            </li>
            <li className={`nav-item ${activeTab === 'social' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab("social"); }}>
              <a href="#social" className="nav-link">
                <i className="fab fa-instagram"></i>
                <span>Social Integrations</span>
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link">
                <i className="fa-solid fa-gear"></i>
                <span>Settings</span>
              </a>
            </li>
          </ul>

          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="avatar"><i className="fa-solid fa-user"></i></div>
              <div className="user-info">
                <strong>Administrador</strong>
                <span>Admin</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content" style={{flex: 1, overflowY: 'auto'}}>
          <header className="top-nav">
            <h1>{activeTab === 'social' ? 'Instagram Hub' : 'Inventory Hub'}</h1>
            <div className="nav-actions">
              <button className="btn btn-outline" onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 800);
              }}>
                <i className="fa-solid fa-rotate-right"></i> Sincronizar
              </button>
            </div>
          </header>

          {activeTab === "social" && (
            <>
              <section className="metrics-section">
                <div className="metric-card glass-panel">
                  <div className="metric-icon"><i className="fa-solid fa-users"></i></div>
                  <div className="metric-data">
                    <h3>Total Followers</h3>
                    <p className="text-glow">{loading ? "..." : instagramData?.followers}</p>
                  </div>
                </div>
                <div className="metric-card glass-panel">
                  <div className="metric-icon"><i className="fa-solid fa-images"></i></div>
                  <div className="metric-data">
                    <h3>Total Posts</h3>
                    <p className="text-glow">{loading ? "..." : instagramData?.posts}</p>
                  </div>
                </div>
                <div className="metric-card glass-panel">
                  <div className="metric-icon"><i className="fa-solid fa-chart-line"></i></div>
                  <div className="metric-data">
                    <h3>Engagement Rate</h3>
                    <p className="text-glow">4.8% <span className="trend up"><i className="fa-solid fa-arrow-up"></i> 1.2%</span></p>
                  </div>
                </div>
              </section>

              <section className="media-management">
                <div className="section-header">
                  <h2>Recent Media Activity</h2>
                  <div className="filters">
                    <button className="filter-btn active">All</button>
                    <button className="filter-btn">Images</button>
                    <button className="filter-btn">Videos / Reels</button>
                  </div>
                </div>

                <div className="crm-media-grid">
                  {loading ? (
                    Array(4).fill(0).map((_, i) => <div key={i} className="crm-card skeleton-card glass-panel"></div>)
                  ) : (
                    instagramData?.media.map(item => (
                      <div key={item.id} className="crm-card glass-panel">
                        <div className="media-thumbnail-wrapper">
                          <img src={item.url} alt="Post" className="media-thumbnail" />
                          <span className="media-type-badge">
                            <i className={item.type === 'video' ? 'fa-solid fa-video' : 'fa-solid fa-image'}></i>
                          </span>
                        </div>
                        <div className="card-details">
                          <p className="caption-preview">{item.caption}</p>
                          <div className="card-meta">
                            <span>{item.date}</span>
                            <span>@palossantos.sgo</span>
                          </div>
                          <div className="card-actions">
                            <button className="btn btn-secondary"><i className="fa-solid fa-eye"></i> View</button>
                            <button className="btn btn-cta"><i className="fa-solid fa-share-nodes"></i> Share</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}

          {activeTab === "inventory" && (
            <section className="media-management">
              <div className="section-header">
                <h2>Solicitudes de Empleados</h2>
                <div className="filters">
                  <p className="text-dim">Marca como "Comprado" cuando encargues la mercadería al proveedor. El sistema notificará a la sucursal.</p>
                </div>
              </div>

              <div className="metrics-section" style={{marginBottom: "2rem"}}>
                <div className="metric-card glass-panel" style={{borderLeft: "4px solid var(--status-red)"}}>
                  <div className="metric-icon"><i className="fa-solid fa-triangle-exclamation" style={{color: "var(--status-red)"}}></i></div>
                  <div className="metric-data">
                    <h3>Bajo Stock</h3>
                    <p className="text-glow">{loading ? "..." : lowStockCount}</p>
                  </div>
                </div>
                <div className="metric-card glass-panel" style={{borderLeft: "4px solid var(--status-yellow)"}}>
                  <div className="metric-icon"><i className="fa-solid fa-clipboard-list" style={{color: "var(--status-yellow)"}}></i></div>
                  <div className="metric-data">
                    <h3>Pedidos Staff</h3>
                    <p className="text-glow">{loading ? "..." : pendingOrdersCount}</p>
                  </div>
                </div>
              </div>

              <div className="crm-media-grid">
                {loading ? (
                  Array(3).fill(0).map((_, i) => <div key={i} className="crm-card skeleton-card glass-panel" style={{height: "200px"}}></div>)
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="crm-card glass-panel" style={{padding: "20px", display: "flex", flexDirection: "column", gap: "12px", borderLeft: order.status === 'pending' ? '4px solid var(--accent-primary)' : '4px solid var(--good-green)'}}>
                      <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start"}}>
                        <h3 style={{fontSize: "16px", fontWeight: "600", lineHeight: "1.4", margin: 0}}>{order.text}</h3>
                        {order.status === "purchased" && <i className="fa-solid fa-circle-check" style={{color: "var(--good-green)", fontSize: "20px"}}></i>}
                      </div>
                      <p style={{color: "var(--text-dim)", fontSize: "14px"}}><i className="fa-solid fa-store" style={{marginRight: "6px"}}></i> {order.branch}</p>
                      <div style={{marginTop: "auto", paddingTop: "12px"}}>
                        {order.status === "pending" ? (
                          <button className="btn btn-cta" style={{width: "100%"}} onClick={() => handleMarkPurchased(order.id)}>
                            <i className="fa-solid fa-bag-shopping"></i> Marcar Comprado
                          </button>
                        ) : (
                          <button className="btn btn-secondary" style={{width: "100%", opacity: 0.7}} disabled>
                            Comprado
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
}
