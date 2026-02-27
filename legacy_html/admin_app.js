import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSy_INJECTED_DURING_TESTING",
  authDomain: "labmanager-ventas.firebaseapp.com",
  databaseURL: "https://labmanager-ventas-default-rtdb.firebaseio.com",
  projectId: "labmanager-ventas",
  storageBucket: "labmanager-ventas.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {

    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn.addEventListener('click', loadData);

    // Initial load
    loadData();

    // Sidebar Navigation Logic
    const navSocial = document.getElementById('nav-social');
    const navInventory = document.getElementById('nav-inventory');
    const socialSection = document.getElementById('social-section');
    const inventorySection = document.getElementById('inventory-section');
    const pageTitle = document.getElementById('page-title');

    navSocial?.addEventListener('click', (e) => {
        e.preventDefault();
        navSocial.classList.add('active');
        navInventory.classList.remove('active');
        socialSection.style.display = 'block';
        inventorySection.style.display = 'none';
        pageTitle.innerText = 'Instagram Hub';
    });

    navInventory?.addEventListener('click', (e) => {
        e.preventDefault();
        navInventory.classList.add('active');
        navSocial.classList.remove('active');
        inventorySection.style.display = 'block';
        socialSection.style.display = 'none';
        pageTitle.innerText = 'Inventory Hub';
    });

    function loadData() {
        refreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sincronizando...';
        
        fetch('palossantos_data.json')
            .then(res => {
                if(!res.ok) throw new Error("No data found localy.");
                return res.json();
            })
            .then(data => {
                populateMetrics(data);
                populateAdminGrid(data.media.data);
                
                setTimeout(() => {
                    refreshBtn.innerHTML = '<i class="fa-solid fa-check"></i> Updated';
                    setTimeout(() => {
                        refreshBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Sincronizar';
                    }, 2000);
                }, 500);
            })
            .catch(err => {
                console.error('Error fetching admin data:', err);
                refreshBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Error';
            });
    }

    function populateMetrics(data) {
        // Fallback or format thousands (e.g. 2111 -> 2.1k)
        const formatNumber = num => {
            if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
            return num;
        };

        const followersEl = document.getElementById('crm-followers');
        const postsEl = document.getElementById('crm-posts');

        followersEl.textContent = formatNumber(data.followers_count);
        postsEl.textContent = data.media_count;
    }

    function populateAdminGrid(mediaItems) {
        const grid = document.getElementById('crm-media-grid');
        grid.innerHTML = ''; // clear skeletons

        mediaItems.forEach(item => {
            const card = document.createElement('article');
            card.className = 'crm-card glass-panel';

            // Safe image resolution
            const mediaUrl = item.media_url || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" fill="%23FF6B00"><rect width="100%" height="100%" fill="%231c1c21"/><text x="50%" y="50%" fill="%23fff" font-family="sans-serif" font-size="20" text-anchor="middle">Imagen Expireda</text></svg>`;

            const isVideo = item.media_type === 'VIDEO';
            const iconBadge = isVideo ? '<i class="fa-solid fa-video"></i>' : '<i class="fa-solid fa-image"></i>';

            // Clean caption (truncate)
            const cleanCaption = (item.caption || "Sin descripción proporcionada.").substring(0, 80) + '...';

            const localDate = new Date(item.timestamp).toLocaleDateString('es-AR', {
                month: 'short', day: 'numeric', year: 'numeric'
            });

            card.innerHTML = `
                <div class="media-thumbnail-wrapper">
                    <img src="${mediaUrl}" alt="Instagram Media" class="media-thumbnail" loading="lazy">
                    <div class="media-type-badge">${iconBadge}</div>
                </div>
                <div class="card-details">
                    <p class="caption-preview">${cleanCaption}</p>
                    <div class="card-meta">
                        <span><i class="fa-regular fa-calendar"></i> ${localDate}</span>
                    </div>
                    
                    <div class="card-actions">
                        <button class="btn btn-secondary" onclick="window.open('${item.permalink}', '_blank')">
                            Manage
                        </button>
                        <button class="btn btn-cta">
                            Promote
                        </button>
                    </div>
                </div>
            `;

            grid.appendChild(card);
            
            // Re-bind fallback onerror locally incase CDN goes bad while viewing
            const cardImg = card.querySelector('img');
            cardImg.onerror = () => {
                 cardImg.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" fill="%23FF6B00"><rect width="100%" height="100%" fill="%231c1c21"/><text x="50%" y="50%" fill="%23fff" font-family="sans-serif" font-size="20" text-anchor="middle">CDN Expired</text></svg>`;
            };
        });
    }

    // Firebase Realtime Database Integration
    function setupFirebaseAdmin() {
        const inventoryRef = ref(db, 'inventory');
        const ordersRef = ref(db, 'order_requests');

        // Monitor Low Stock
        onValue(inventoryRef, (snapshot) => {
            let lowStockCount = 0;
            if (snapshot.exists()) {
                const data = snapshot.val();
                for (const key in data) {
                    const item = data[key];
                    if (item.currentStock <= item.reorderThreshold) {
                        lowStockCount++;
                    }
                }
            }
            document.getElementById('low-stock-count').innerText = lowStockCount;
        });

        // Monitor Orders
        onValue(ordersRef, (snapshot) => {
            const grid = document.getElementById('admin-orders-grid');
            grid.innerHTML = '';
            let pendingCount = 0;

            if (snapshot.exists()) {
                const data = snapshot.val();
                
                for (const [key, order] of Object.entries(data)) {
                    // We only show PENDING and PURCHASED on Admin side.
                    // (RECEIVED means it is fully resolved and added to stock).
                    if (order.status === 'RECEIVED') continue;
                    
                    if (order.status === 'PENDING') pendingCount++;

                    const isPurchased = order.status === 'PURCHASED';
                    const statusColor = isPurchased ? 'status-green' : 'status-yellow';
                    const statusText = isPurchased ? 'Comprado (En Transito)' : 'Pendiente';
                    
                    const card = document.createElement('article');
                    card.className = 'crm-card glass-panel';
                    card.style.display = 'flex';
                    card.style.flexDirection = 'column';
                    
                    card.innerHTML = `
                        <div class="card-details" style="padding-top: 1rem; flex: 1;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
                                <h3>${order.itemName}</h3>
                                <span class="status-chip ${statusColor}" style="font-size:0.75rem; padding: 4px 8px; border-radius: 12px; border: 1px solid var(--${statusColor});">${statusText}</span>
                            </div>
                            <p>Cantidad Solicitada: <strong style="color:var(--text-main); font-size:1.1rem;">${order.quantity} ${order.unit}</strong></p>
                            <div class="card-meta" style="margin-top: 1rem;">
                                <span><i class="fa-regular fa-calendar"></i> ${new Date(order.requestedAt).toLocaleString('es-AR')}</span>
                            </div>
                            
                            ${!isPurchased ? `
                            <div class="card-actions" style="margin-top: 1.5rem;">
                                <button class="btn btn-cta" style="width: 100%;" onclick="window.markAsPurchased('${key}')">
                                    <i class="fa-solid fa-cart-shopping"></i> Marcar como Comprado
                                </button>
                            </div>
                            ` : `
                            <div class="card-actions" style="margin-top: 1.5rem;">
                                <p class="text-dim" style="text-align:center; width:100%; font-size: 0.85rem;"><i class="fa-solid fa-truck"></i> Esperando recepción en sucursal.</p>
                            </div>
                            `}
                        </div>
                    `;
                    grid.insertAdjacentElement('afterbegin', card);
                }
            }

            if (grid.innerHTML === '') {
                grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-dim);">No hay pedidos activos.</div>';
            }
            document.getElementById('pending-orders-count').innerText = pendingCount;
        });
    }

    setupFirebaseAdmin();

    // Export function to global scope for inline onclick handler
    window.markAsPurchased = async function(orderId) {
        if(!confirm('¿Has encargado este insumo al proveedor? Esto notificará a los empleados.')) return;
        
        try {
            await update(ref(db, `order_requests/${orderId}`), {
                status: 'PURCHASED',
                purchasedAt: Date.now()
            });
        } catch (error) {
            console.error("Error updating order:", error);
            alert("Error al actualizar el pedido.");
        }
    };
});
