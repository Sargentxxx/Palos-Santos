// This file serves as the main employee dashboard (previously employee.html)
"use client";

import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function EmpleadoDashboard() {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'orders'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Mocks for UI building
  const [inventory, setInventory] = useState([
    { id: 'item1', name: 'Leña Misionera', currentStock: 250, unit: 'kg', reorderThreshold: 300 },
    { id: 'item2', name: 'Harina 0000', currentStock: 80, unit: 'kg', reorderThreshold: 50 },
  ]);

  const [orders, setOrders] = useState([
    { id: 'ord1', itemName: 'Leña Misionera', status: 'PENDING', quantity: 100, unit: 'kg', timestamp: new Date().toISOString() }
  ]);

  return (
    <>
      <Head>
        <title>Staff | Palos Santos</title>
      </Head>

      <div className="employee-layout">
        <header className="app-header">
            <div className="header-content">
                <i className="fa-solid fa-fire header-icon"></i>
                <div>
                    <h1>Staff de Salón</h1>
                    <p>Palos Santos - Gestión</p>
                </div>
            </div>
            <div className="admin-link">
              <a href="/admin"><i className="fa-solid fa-user-shield"></i></a>
            </div>
        </header>

        <main className="app-content">
            <div className="tabs">
                <button 
                  className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
                  onClick={() => setActiveTab('inventory')}
                >
                    <i className="fa-solid fa-boxes-stacked"></i>
                    Inventario Físico
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                  onClick={() => setActiveTab('orders')}
                >
                    <i className="fa-solid fa-truck-fast"></i>
                    Pedidos Pendientes
                    {orders.length > 0 && <span className="badge" id="pending-badge">{orders.length}</span>}
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'inventory' && (
                  <div className="inventory-grid">
                    {inventory.map((item) => {
                      const needsRestock = item.currentStock <= item.reorderThreshold;
                      return (
                        <div key={item.id} className={`inv-card ${needsRestock ? 'card-alert' : ''}`}>
                            <div className="inv-details">
                                <h3>{item.name}</h3>
                                <p>Stock Actual: <strong>{item.currentStock} {item.unit}</strong></p>
                                {needsRestock && <span className="alert-badge"><i className="fa-solid fa-triangle-exclamation"></i> Poco Stock</span>}
                            </div>
                            <div className="inv-actions">
                                <button className="btn btn-brand" onClick={() => {
                                  setSelectedItem(item);
                                  setIsModalOpen(true);
                                }}>
                                    <i className="fa-solid fa-cart-plus"></i> Solicitar
                                </button>
                            </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div className="orders-grid">
                    {orders.length === 0 ? <div className="empty-state">No hay pedidos pendientes.</div> : null}
                    {orders.map((order) => {
                      const isPurchased = order.status === 'PURCHASED';
                      const statusColor = isPurchased ? 'status-green' : 'status-yellow';
                      const statusText = isPurchased ? '¡En Camino!' : 'Esperando Autorización';
                      
                      return (
                        <div key={order.id} className="order-card">
                            <div className="order-header">
                                <h4>{order.itemName}</h4>
                                <span className={`status-chip ${statusColor}`}>{statusText}</span>
                            </div>
                            <div className="order-body">
                                <p>Pedimos: <strong>{order.quantity} {order.unit}</strong></p>
                                <p className="meta-date">{new Date(order.timestamp).toLocaleString('es-AR')}</p>
                            </div>
                            {isPurchased && (
                                <div className="order-footer">
                                    <button className="btn btn-success full-width" onClick={() => alert('Feature coming soon')}>
                                        <i className="fa-solid fa-check"></i> El Proveedor lo Trajo (Recibido)
                                    </button>
                                </div>
                            )}
                        </div>
                      )
                    })}
                  </div>
                )}
            </div>
        </main>

        {isModalOpen && selectedItem && (
          <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setIsModalOpen(false) }}>
              <div className="modal-content">
                  <div className="modal-header">
                      <h2>Solicitar {selectedItem.name}</h2>
                      <button className="close-btn" onClick={() => setIsModalOpen(false)}><i className="fa-solid fa-xmark"></i></button>
                  </div>
                  <div className="modal-body">
                      <p>El stock actual es de {selectedItem.currentStock} {selectedItem.unit}. ¿Cuánto necesitas pedir?</p>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const qty = e.target.elements.quantity.value;
                        alert(`Requesting ${qty} ${selectedItem.unit} of ${selectedItem.name}`);
                        setIsModalOpen(false);
                      }}>
                          <div className="input-group">
                              <label htmlFor="order-qty">Cantidad a pedir ({selectedItem.unit})</label>
                              <input type="number" id="order-qty" name="quantity" min="1" required placeholder="Ej: 50" />
                          </div>
                          <button type="submit" className="btn btn-brand full-width">Enviar Pedido al Admin</button>
                      </form>
                  </div>
              </div>
          </div>
        )}
      </div>
    </>
  );
}
