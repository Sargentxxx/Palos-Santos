/**
 * employee_app.js - Mobile Progressive Web App logic for Palos Santos employees.
 * Responsibilities:
 * - Load Current Inventory (Realtime Sync)
 * - Push New Order Requests
 * - Receive marked Orders & Increment Stock Back
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue, set, push, update, remove, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// TODO: The user will need to replace these with their actual Firebase Config later.
// For now, we stub an architecture that works with the local module scope.
const firebaseConfig = {
  apiKey: "AIzaSy_INJECTED_DURING_TESTING",
  authDomain: "labmanager-ventas.firebaseapp.com",
  databaseURL: "https://labmanager-ventas-default-rtdb.firebaseio.com",
  projectId: "labmanager-ventas",
  storageBucket: "labmanager-ventas.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Data References
const inventoryRef = ref(db, 'inventory');
const ordersRef = ref(db, 'order_requests');

// State Variables
let currentInventory = {};
let selectedItemId = null;
let currentQuantity = 1;

// Base UI Setup
document.addEventListener('DOMContentLoaded', () => {
    // Basic Navigation Logic
    window.switchTab = function(tabId) {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        
        document.getElementById(tabId).classList.add('active');
        document.querySelector(`.tab-btn[data-tab="${tabId}"]`)?.classList.add('active');
    };

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.getAttribute('data-tab')));
    });

    // Modal Logic
    const initModal = () => {
        document.getElementById('close-modal').addEventListener('click', hideModal);
        
        document.getElementById('qty-plus').addEventListener('click', () => {
            currentQuantity++;
            document.getElementById('qty-input').value = currentQuantity;
        });
        
        document.getElementById('qty-minus').addEventListener('click', () => {
            if (currentQuantity > 1) currentQuantity--;
            document.getElementById('qty-input').value = currentQuantity;
        });

        document.getElementById('submit-order-btn').addEventListener('click', submitOrderRequest);
    };

    initModal();
    setupFirebaseListeners();
});

function showOrderModal(itemId, itemName, itemUnit) {
    selectedItemId = itemId;
    currentQuantity = 1;
    
    document.getElementById('qty-input').value = 1;
    document.getElementById('modal-item-name').innerText = `Pedir ${itemName}`;
    document.getElementById('modal-unit-name').innerText = itemUnit;
    
    document.getElementById('order-modal').classList.add('active');
}

window.hideModal = function() {
    document.getElementById('order-modal').classList.remove('active');
    selectedItemId = null;
};

// [FIREBASE] Sync and Render Lists
function setupFirebaseListeners() {
    // Inventory Listener
    onValue(inventoryRef, (snapshot) => {
        const listDiv = document.getElementById('inventory-list');
        listDiv.innerHTML = ''; // Reset UI
        
        if (snapshot.exists()) {
            currentInventory = snapshot.val();
            // Optional: Sort by those needing restock
            for (const [key, item] of Object.entries(currentInventory)) {
               const needsRestock = item.currentStock <= item.reorderThreshold;
               
               const cardHtml = `
                <div class="inv-card ${needsRestock ? 'card-alert' : ''}">
                    <div class="inv-details">
                        <h3>${item.name}</h3>
                        <p>Stock Actual: <strong>${item.currentStock} ${item.unit}</strong></p>
                        ${needsRestock ? '<span class="alert-badge"><i class="fa-solid fa-triangle-exclamation"></i> Poco Stock</span>' : ''}
                    </div>
                    <div class="inv-actions">
                        <button class="btn btn-brand" onclick="window.showOrderModal('${key}', '${item.name}', '${item.unit}')">
                            <i class="fa-solid fa-cart-plus"></i> Solicitar
                        </button>
                    </div>
                </div>
               `;
               listDiv.insertAdjacentHTML('beforeend', cardHtml);
            }
        } else {
            // Seed DB if it's empty (Testing purposes only)
            seedInitialDatabase();
        }
    });

    // Orders Listener
    onValue(ordersRef, (snapshot) => {
        const ordersDiv = document.getElementById('orders-list');
        ordersDiv.innerHTML = '';
        let pendingCount = 0;

        if (snapshot.exists()) {
            const data = snapshot.val();
            
            for (const [key, order] of Object.entries(data)) {
                // Ignore RECEIVED historical orders to keep UI clean
                if (order.status === 'RECEIVED') continue;
                
                pendingCount++;
                const isPurchased = order.status === 'PURCHASED';
                const statusColor = isPurchased ? 'status-green' : 'status-yellow';
                const statusText = isPurchased ? '¡En Camino!' : 'Esperando Autorización';
                
                const cardHtml = `
                 <div class="order-card">
                     <div class="order-header">
                         <h4>${order.itemName}</h4>
                         <span class="status-chip ${statusColor}">${statusText}</span>
                     </div>
                     <div class="order-body">
                         <p>Pedimos: <strong>${order.quantity} ${order.unit}</strong></p>
                         <p class="meta-date">${new Date(order.requestedAt).toLocaleString('es-AR')}</p>
                     </div>
                     ${isPurchased ? `
                        <div class="order-footer">
                            <button class="btn btn-success full-width" onclick="window.markAsReceived('${key}', '${order.itemId}', ${order.quantity})">
                                <i class="fa-solid fa-check"></i> El Proveedor lo Trajo (Recibido)
                            </button>
                        </div>
                     ` : ''}
                 </div>
                `;
                ordersDiv.insertAdjacentHTML('afterbegin', cardHtml); // prepend so newest is top
            }
        }

        if (pendingCount === 0) {
            ordersDiv.innerHTML = '<div class="empty-state">No hay pedidos pendientes.</div>';
        }
        document.getElementById('pending-badge').innerText = pendingCount;
    });
}

// Global Exports for inline HTML click handlers
window.showOrderModal = showOrderModal;

// [FIREBASE] Submit a new Order Request
async function submitOrderRequest() {
    if (!selectedItemId) return;
    
    const item = currentInventory[selectedItemId];
    const newOrderRef = push(ordersRef);
    
    const payload = {
        itemId: selectedItemId,
        itemName: item.name,
        unit: item.unit,
        quantity: currentQuantity,
        status: 'PENDING',
        requestedAt: Date.now(),
        requestedBy: 'Caja/Salon'
    };

    try {
        await set(newOrderRef, payload);
        hideModal();
        switchTab('tab-orders');
    } catch (error) {
        console.error("Error submitting order: ", error);
        alert("Hubo un error al enviar el pedido.");
    }
}

// [FIREBASE] Receive goods from Provider (Updates Inventory)
window.markAsReceived = async function(orderId, inventoryItemId, quantityReceived) {
    if(!confirm('¿Estás seguro de que llegó la caja/mercadería? Esto aumentará el stock automáticamente.')) return;

    // We do a transaction to safely increment the stock
    const itemStockRef = ref(db, `inventory/${inventoryItemId}/currentStock`);
    
    try {
        await runTransaction(itemStockRef, (currentStock) => {
            return (currentStock || 0) + quantityReceived;
        });

        // Mark the order as RECEIVED
        await update(ref(db, `order_requests/${orderId}`), {
            status: 'RECEIVED',
            receivedAt: Date.now()
        });

        alert("¡Stock actualizado con éxito!");
        
    } catch (error) {
        console.error("Transaction failed: ", error);
        alert("Fallo al actualizar el inventario.");
    }
}

// Development Only: Initial Payload
function seedInitialDatabase() {
    const defaultData = {
        item_harina: { name: "Harina 0000", currentStock: 2, reorderThreshold: 5, unit: "Bolsas (25kg)" },
        item_carne: { name: "Carne Picada Especial", currentStock: 10, reorderThreshold: 15, unit: "KG" },
        item_queso: { name: "Muzzarella", currentStock: 4, reorderThreshold: 10, unit: "Hormas" },
        item_cebolla: { name: "Cebolla", currentStock: 25, reorderThreshold: 30, unit: "KG" },
        item_cajas: { name: "Cajas de Empanadas (Docena)", currentStock: 50, reorderThreshold: 100, unit: "Unidades" },
        item_lena: { name: "Leña de Quebracho", currentStock: 100, reorderThreshold: 150, unit: "KG" }
    };
    set(inventoryRef, defaultData);
}
