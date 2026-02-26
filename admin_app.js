document.addEventListener('DOMContentLoaded', () => {

    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn.addEventListener('click', loadData);

    // Initial load
    loadData();

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
});
