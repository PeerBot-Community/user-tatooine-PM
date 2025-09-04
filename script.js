let allListings = [];
let filteredListings = [];

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadListings();
        setupFilters();
        displayAffordableStays();
        displayPremiumStays(allListings);
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

    displayPremiumStays(filteredListings);
}

function clearFilters() {
    document.getElementById('type-filter').value = '';
    document.getElementById('price-range').value = '400';
    document.getElementById('price-display').textContent = '₹400';
    document.getElementById('rating-filter').value = '';
    
    filteredListings = [...allListings];
    displayPremiumStays(filteredListings);
}

function displayAffordableStays() {
    const affordableGrid = document.getElementById('affordable-grid');
    
    const cheapestStays = [...allListings]
        .sort((a, b) => a.price_per_night - b.price_per_night)
        .slice(0, 3);
    
    affordableGrid.innerHTML = cheapestStays.map(listing => createListingCard(listing, false)).join('');
}

function displayPremiumStays(listings) {
    const premiumGrid = document.getElementById('premium-grid');
    const noResults = document.getElementById('no-results');
    
    if (listings.length === 0) {
        premiumGrid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    premiumGrid.style.display = 'grid';
    noResults.style.display = 'none';
    
    const rankedListings = [...listings]
        .sort((a, b) => b.rating - a.rating);
    
    premiumGrid.innerHTML = rankedListings.map((listing, index) => createListingCard(listing, true, index + 1)).join('');
}

function createListingCard(listing, showRank = false, rank = null) {
    const stars = '★'.repeat(Math.floor(listing.rating)) + 
                 (listing.rating % 1 !== 0 ? '☆' : '');
    
    const amenitiesHtml = listing.amenities.slice(0, 3).map(amenity => 
        `<span class="amenity-tag">${amenity}</span>`
    ).join('');
    
    const rankBadge = showRank && rank ? `<div class="rank-badge">#${rank}</div>` : '';
    
    return `
        <div class="listing-card ${showRank ? 'premium-card' : 'affordable-card'}" onclick="openModal('${listing.id}')" role="button" tabindex="0" 
             onkeydown="if(event.key==='Enter'||event.key===' ') openModal('${listing.id}')">
            ${rankBadge}
            <div class="listing-image">
                ${getListingIcon(listing.type)}
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
    
    modalBody.innerHTML = `
        <div class="modal-image">
            ${getListingIcon(listing.type)}
        </div>
        <div class="modal-header">
            <h2 id="modal-title" class="modal-title">${listing.title}</h2>
            <div class="modal-location">${listing.location}</div>
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
    const affordableGrid = document.getElementById('affordable-grid');
    const premiumGrid = document.getElementById('premium-grid');
    
    affordableGrid.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #6b7280; grid-column: 1 / -1;">
            <h3>Oops! Something went wrong</h3>
            <p>${message}</p>
        </div>
    `;
    premiumGrid.style.display = 'none';
}

window.openModal = openModal;
window.closeModal = closeModal;