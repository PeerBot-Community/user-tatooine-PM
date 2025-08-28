let allListings = [];
let filteredListings = [];
let favorites = JSON.parse(localStorage.getItem('tatooine-favorites') || '[]');

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadListings();
        setupFilters();
        displayListings(allListings);
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load listings. Please refresh the page.');
    }
});

async function loadListings() {
    try {
        const response = await fetch('./data/listings.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allListings = await response.json();
        filteredListings = [...allListings];
    } catch (error) {
        console.error('Error loading listings:', error);
        throw error;
    }
}

function setupFilters() {
    const typeFilter = document.getElementById('type-filter');
    const priceRange = document.getElementById('price-range');
    const priceDisplay = document.getElementById('price-display');
    const ratingFilter = document.getElementById('rating-filter');
    const clearFiltersBtn = document.getElementById('clear-filters');

    typeFilter.addEventListener('change', applyFilters);
    priceRange.addEventListener('input', function() {
        priceDisplay.textContent = `₹${priceRange.value}`;
        applyFilters();
    });
    ratingFilter.addEventListener('change', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);

    priceDisplay.textContent = `₹${priceRange.value}`;
    
    // Setup navigation
    setupNavigation();
    updateFavoritesCount();
}

function setupNavigation() {
    const favoritesLink = document.querySelector('a[href=\"#favorites\"]');
    const staysLink = document.querySelector('a[href=\"#listings\"]');
    
    favoritesLink.addEventListener('click', function(e) {
        e.preventDefault();
        showFavoritesSection();
    });
    
    staysLink.addEventListener('click', function(e) {
        e.preventDefault();
        showListingsSection();
    });
}

function showFavoritesSection() {
    document.getElementById('listings').style.display = 'none';
    document.getElementById('favorites').style.display = 'block';
    displayFavorites();
}

function showListingsSection() {
    document.getElementById('favorites').style.display = 'none';
    document.getElementById('listings').style.display = 'block';
}

function displayFavorites() {
    const favoritesGrid = document.getElementById('favorites-grid');
    const noFavorites = document.getElementById('no-favorites');
    
    const favoriteListings = allListings.filter(listing => favorites.includes(listing.id));
    
    if (favoriteListings.length === 0) {
        favoritesGrid.style.display = 'none';
        noFavorites.style.display = 'block';
        return;
    }
    
    favoritesGrid.style.display = 'grid';
    noFavorites.style.display = 'none';
    
    favoritesGrid.innerHTML = favoriteListings.map(listing => createListingCard(listing)).join('');
}

function updateFavoritesCount() {
    const countElement = document.getElementById('favorites-count');
    if (favorites.length > 0) {
        countElement.textContent = `(${favorites.length})`;
        countElement.style.display = 'inline';
    } else {
        countElement.style.display = 'none';
    }
}

function applyFilters() {
    const typeFilter = document.getElementById('type-filter').value;
    const maxPrice = parseInt(document.getElementById('price-range').value);
    const minRating = parseFloat(document.getElementById('rating-filter').value);

    filteredListings = allListings.filter(listing => {
        const matchesType = !typeFilter || listing.type === typeFilter;
        const matchesPrice = listing.price_per_night <= maxPrice;
        const matchesRating = !minRating || listing.rating >= minRating;
        
        return matchesType && matchesPrice && matchesRating;
    });

    displayListings(filteredListings);
}

function clearFilters() {
    document.getElementById('type-filter').value = '';
    document.getElementById('price-range').value = '400';
    document.getElementById('price-display').textContent = '₹400';
    document.getElementById('rating-filter').value = '';
    
    filteredListings = [...allListings];
    displayListings(filteredListings);
}

function displayListings(listings) {
    const listingsGrid = document.getElementById('listings-grid');
    const noResults = document.getElementById('no-results');
    
    if (listings.length === 0) {
        listingsGrid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    listingsGrid.style.display = 'grid';
    noResults.style.display = 'none';
    
    listingsGrid.innerHTML = listings.map(listing => createListingCard(listing)).join('');
}

function createListingCard(listing) {
    const stars = '★'.repeat(Math.floor(listing.rating)) + 
                 (listing.rating % 1 !== 0 ? '☆' : '');
    
    const amenitiesHtml = listing.amenities.slice(0, 3).map(amenity => 
        `<span class="amenity-tag">${amenity}</span>`
    ).join('');
    
    const isFavorite = favorites.includes(listing.id);
    
    return `
        <div class="listing-card" onclick="openModal('${listing.id}')" role="button" tabindex="0" 
             onkeydown="if(event.key==='Enter'||event.key===' ') openModal('${listing.id}')">
            <div class="listing-image">
                ${getListingIcon(listing.type)}
                <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" 
                        onclick="event.stopPropagation(); toggleFavorite('${listing.id}')"
                        aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                    ${isFavorite ? '❤️' : '🤍'}
                </button>
            </div>
            <div class="listing-content">
                <div class="listing-header">
                    <h3 class="listing-title">${listing.title}</h3>
                    <span class="property-type-badge">${listing.type}</span>
                </div>
                <div class="listing-location">${listing.location}</div>
                <div class="listing-details">
                    <span>${listing.beds} bed${listing.beds !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>${listing.baths} bath${listing.baths !== 1 ? 's' : ''}</span>
                </div>
                <div class="listing-amenities">
                    ${amenitiesHtml}
                    ${listing.amenities.length > 3 ? `<span class="amenity-tag">+${listing.amenities.length - 3} more</span>` : ''}
                </div>
                <div class="listing-footer">
                    <div class="listing-price">₹${listing.price_per_night}/night</div>
                    <div class="listing-rating">
                        <span class="star">${stars}</span>
                        <span>${listing.rating} (${listing.reviews})</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getListingIcon(type) {
    const icons = {
        'Dome': '🏛️',
        'Loft': '🏢',
        'Villa': '🏰',
        'Farm': '🚜',
        'Studio': '🏠',
        'Tent': '⛺',
        'Apartment': '🏨',
        'Cave': '🕳️',
        'Suite': '🏯',
        'Bungalow': '🏡',
        'Fortress': '🏰',
        'Lodge': '🏔️'
    };
    return icons[type] || '🏠';
}

function openModal(listingId) {
    const listing = allListings.find(l => l.id === listingId);
    if (!listing) return;
    
    const modal = document.getElementById('listing-modal');
    const modalBody = document.getElementById('modal-body');
    
    const stars = '★'.repeat(Math.floor(listing.rating));
    const amenitiesHtml = listing.amenities.map(amenity => 
        `<div class="amenity-item">${amenity}</div>`
    ).join('');
    
    const isFavorite = favorites.includes(listing.id);
    
    modalBody.innerHTML = `
        <div class="modal-image">
            ${getListingIcon(listing.type)}
            <button class="favorite-btn modal-favorite ${isFavorite ? 'favorited' : ''}" 
                    onclick="toggleFavorite('${listing.id}')"
                    aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                ${isFavorite ? '❤️' : '🤍'}
            </button>
        </div>
        <div class="modal-header">
            <h2 id="modal-title" class="modal-title">${listing.title}</h2>
            <div class="modal-location">${listing.location}</div>
            <div class="modal-actions">
                <div class="sharing-buttons">
                    <button class="share-btn" onclick="shareToTwitter('${listing.id}')" aria-label="Share on Twitter">🐦</button>
                    <button class="share-btn" onclick="shareToFacebook('${listing.id}')" aria-label="Share on Facebook">📘</button>
                    <button class="share-btn" onclick="shareToWhatsApp('${listing.id}')" aria-label="Share on WhatsApp">💬</button>
                    <button class="share-btn" onclick="copyListingLink('${listing.id}')" aria-label="Copy link">🔗</button>
                </div>
            </div>
        </div>
        <div class="modal-body">
            <div class="modal-details">
                <div class="detail-item">
                    <div class="detail-value">₹${listing.price_per_night}</div>
                    <div class="detail-label">per night</div>
                </div>
                <div class="detail-item">
                    <div class="detail-value">${listing.rating}</div>
                    <div class="detail-label">${stars} (${listing.reviews} reviews)</div>
                </div>
                <div class="detail-item">
                    <div class="detail-value">${listing.beds}</div>
                    <div class="detail-label">bedroom${listing.beds !== 1 ? 's' : ''}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-value">${listing.baths}</div>
                    <div class="detail-label">bathroom${listing.baths !== 1 ? 's' : ''}</div>
                </div>
            </div>
            
            <p class="modal-description">${listing.description}</p>
            
            <div class="modal-amenities">
                <h4>What this place offers</h4>
                <div class="amenities-grid">
                    ${amenitiesHtml}
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    
    const modalCloseBtn = modal.querySelector('.modal-close');
    modalCloseBtn.focus();
    
    document.addEventListener('keydown', handleModalKeyDown);
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('listing-modal');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    
    document.removeEventListener('keydown', handleModalKeyDown);
    document.body.style.overflow = 'auto';
}

function handleModalKeyDown(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
}

function showError(message) {
    const listingsGrid = document.getElementById('listings-grid');
    const noResults = document.getElementById('no-results');
    
    listingsGrid.style.display = 'none';
    noResults.style.display = 'block';
    noResults.innerHTML = `
        <h3>Oops! Something went wrong</h3>
        <p>${message}</p>
    `;
}

function toggleFavorite(listingId) {
    const index = favorites.indexOf(listingId);
    if (index === -1) {
        favorites.push(listingId);
    } else {
        favorites.splice(index, 1);
    }
    
    localStorage.setItem('tatooine-favorites', JSON.stringify(favorites));
    
    // Update favorites count
    updateFavoritesCount();
    
    // Update UI
    displayListings(filteredListings);
    
    // Update favorites display if currently viewing favorites
    if (document.getElementById('favorites').style.display !== 'none') {
        displayFavorites();
    }
    
    // Update modal if open
    const modal = document.getElementById('listing-modal');
    if (modal.classList.contains('show')) {
        const modalFavoriteBtn = modal.querySelector('.modal-favorite');
        if (modalFavoriteBtn) {
            const isFavorite = favorites.includes(listingId);
            modalFavoriteBtn.classList.toggle('favorited', isFavorite);
            modalFavoriteBtn.innerHTML = isFavorite ? '❤️' : '🤍';
            modalFavoriteBtn.setAttribute('aria-label', isFavorite ? 'Remove from favorites' : 'Add to favorites');
        }
    }
}

function getListingUrl(listingId) {
    return `${window.location.origin}${window.location.pathname}?listing=${listingId}`;
}

function shareToTwitter(listingId) {
    const listing = allListings.find(l => l.id === listingId);
    if (!listing) return;
    
    const url = getListingUrl(listingId);
    const text = `Check out this amazing ${listing.type.toLowerCase()} on Tatooine: ${listing.title} - Only ₹${listing.price_per_night}/night!`;
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
}

function shareToFacebook(listingId) {
    const url = getListingUrl(listingId);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=580,height=296');
}

function shareToWhatsApp(listingId) {
    const listing = allListings.find(l => l.id === listingId);
    if (!listing) return;
    
    const url = getListingUrl(listingId);
    const text = `Check out this amazing ${listing.type.toLowerCase()} on Tatooine: ${listing.title} - Only ₹${listing.price_per_night}/night! ${url}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
}

async function copyListingLink(listingId) {
    const url = getListingUrl(listingId);
    
    try {
        await navigator.clipboard.writeText(url);
        
        // Show feedback
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅';
        btn.style.backgroundColor = '#4CAF50';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = '';
        }, 2000);
    } catch (err) {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Show feedback
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅';
        btn.style.backgroundColor = '#4CAF50';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = '';
        }, 2000);
    }
}

// Handle URL parameters to show specific listing
function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const listingId = params.get('listing');
    
    if (listingId && allListings.some(l => l.id === listingId)) {
        setTimeout(() => openModal(listingId), 100);
    }
}

// Update the DOMContentLoaded listener to include URL params
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadListings();
        setupFilters();
        displayListings(allListings);
        handleUrlParams();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load listings. Please refresh the page.');
    }
});

window.openModal = openModal;
window.closeModal = closeModal;
window.toggleFavorite = toggleFavorite;
window.shareToTwitter = shareToTwitter;
window.shareToFacebook = shareToFacebook;
window.shareToWhatsApp = shareToWhatsApp;
window.copyListingLink = copyListingLink;