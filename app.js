document.addEventListener('DOMContentLoaded', () => {
    
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // Fetch the scraped JSON data
    fetch('palossantos_data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo cargar el archivo de datos JSON.');
            }
            return response.json();
        })
        .then(data => {
            populateHeader(data);
            populateGrid(data.media.data);
        })
        .catch(error => {
            console.error('Error cargando los datos de Instagram:', error);
            document.getElementById('profile-name').textContent = "Instagram Temporalmente Inactivo";
            document.getElementById('profile-bio').textContent = "No logramos conectar con los datos locales. Revisa la consola.";
        });
});

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function populateHeader(data) {
    // Basic Info
    document.getElementById('profile-name').textContent = data.name || data.username;
    
    // Remove emojis/format bio neatly if necessary, here we just output it as raw text
    // Utilizing innerText over textContent to preserve \n new lines mapped to visual breaks
    document.getElementById('profile-bio').innerText = data.biography || "No biography provided.";

    // Stats
    document.getElementById('followers-count').textContent = formatNumber(data.followers_count || 0);
    document.getElementById('media-count').textContent = formatNumber(data.media_count || 0);

    // Profile Picture Handling
    const profileImg = document.getElementById('profile-picture');
    const skeleton = document.querySelector('.profile-skeleton');
    
    // Create new image to preload and avoid broken image flashes
    const img = new Image();
    img.src = data.profile_picture_url;
    img.onload = () => {
        profileImg.src = data.profile_picture_url;
        profileImg.classList.remove('hidden');
        skeleton.classList.add('hidden');
    };
    img.onerror = () => {
        // Fallback if URL expired
        profileImg.src = 'https://ui-avatars.com/api/?name=Palos+Santos&background=D97706&color=fff&size=250';
        profileImg.classList.remove('hidden');
        skeleton.classList.add('hidden');
    };

    // Update WhatsApp link based on website if it's a wa.link
    const actionBtn = document.getElementById('action-btn');
    if(data.website) {
        actionBtn.href = data.website;
    }
}

function populateGrid(mediaItems) {
    const grid = document.getElementById('media-grid');
    grid.innerHTML = ''; // Clear skeletons

    if (!mediaItems || mediaItems.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No hay publicaciones disponibles.</p>';
        return;
    }

    mediaItems.forEach(item => {
        // Create the anchor wrapping the card
        const cardLink = document.createElement('a');
        cardLink.href = item.permalink;
        cardLink.target = '_blank';
        cardLink.rel = 'noopener noreferrer';
        cardLink.title = 'Ver en Instagram';
        cardLink.className = 'media-card';

        // Format Date
        const dateObj = new Date(item.timestamp);
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString('es-ES', options);

        // Sanitize caption
        const maxCaptionLength = 120;
        let captionSnippet = item.caption || '';
        if (captionSnippet.length > maxCaptionLength) {
            captionSnippet = captionSnippet.substring(0, maxCaptionLength) + '...';
        }

        // Inner HTML
        cardLink.innerHTML = `
            <img src="${item.media_url}" alt="Publicación de ${item.username}" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100%25\\' height=\\'100%25\\' viewBox=\\'0 0 24 24\\' fill=\\'%23333\\' stroke=\\'%23666\\' stroke-width=\\'1\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\' ry=\\'2\\'></rect><circle cx=\\'8.5\\' cy=\\'8.5\\' r=\\'1.5\\'></circle><polyline points=\\'21 15 16 10 5 21\\'></polyline></svg>'">
            <div class="media-overlay">
                <span class="media-date">${formattedDate}</span>
                <p class="media-caption">${captionSnippet}</p>
            </div>
        `;

        grid.appendChild(cardLink);
    });
}
