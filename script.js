let allListings = [];
let filteredListings = [];
let currentRecommendation = null;
let viewedListings = new Set();
let userPreferences = {
    preferredTypes: new Map(),
    priceRange: { min: 0, max: 400 },
    ratingPreference: 0
};

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadListings();
        setupFilters();
        setupRecommendations();
        displayListings(allListings);
        initializeUserTracking();
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
    
    return `
        <div class="listing-card" onclick="openModal('${listing.id}')" role="button" tabindex="0" 
             onkeydown="if(event.key==='Enter'||event.key===' ') openModal('${listing.id}')">
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
    
    trackListingView(listing);
    
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
    const listingsGrid = document.getElementById('listings-grid');
    const noResults = document.getElementById('no-results');
    
    listingsGrid.style.display = 'none';
    noResults.style.display = 'block';
    noResults.innerHTML = `
        <h3>Oops! Something went wrong</h3>
        <p>${message}</p>
    `;
}

function setupRecommendations() {
    const surpriseBtn = document.getElementById('surprise-me-btn');
    const trendingBtn = document.getElementById('trending-btn');
    const similarBtn = document.getElementById('similar-btn');
    const resetBtn = document.getElementById('reset-recommendations');

    surpriseBtn.addEventListener('click', showSurpriseRecommendations);
    trendingBtn.addEventListener('click', showTrendingRecommendations);
    similarBtn.addEventListener('click', showSimilarRecommendations);
    resetBtn.addEventListener('click', resetRecommendations);
}

function initializeUserTracking() {
    const typeFilter = document.getElementById('type-filter');
    const priceRange = document.getElementById('price-range');
    const ratingFilter = document.getElementById('rating-filter');

    typeFilter.addEventListener('change', () => {
        if (typeFilter.value) {
            const count = userPreferences.preferredTypes.get(typeFilter.value) || 0;
            userPreferences.preferredTypes.set(typeFilter.value, count + 1);
        }
    });

    priceRange.addEventListener('change', () => {
        userPreferences.priceRange.max = parseInt(priceRange.value);
    });

    ratingFilter.addEventListener('change', () => {
        if (ratingFilter.value) {
            userPreferences.ratingPreference = Math.max(
                userPreferences.ratingPreference, 
                parseFloat(ratingFilter.value)
            );
        }
    });
}

function trackListingView(listing) {
    viewedListings.add(listing.id);
    
    const count = userPreferences.preferredTypes.get(listing.type) || 0;
    userPreferences.preferredTypes.set(listing.type, count + 1);
    
    document.getElementById('similar-btn').style.display = 'inline-block';
}

function showSurpriseRecommendations() {
    const shuffled = [...allListings].sort(() => Math.random() - 0.5);
    const surprise = shuffled.slice(0, 3);
    
    currentRecommendation = 'surprise';
    updateRecommendationStatus('🎲 Surprise selection! Here are 3 random amazing stays');
    displayListings(surprise);
}

function showTrendingRecommendations() {
    const trending = allListings
        .sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews))
        .slice(0, 6);
    
    currentRecommendation = 'trending';
    updateRecommendationStatus('🔥 Most popular stays based on ratings and reviews');
    displayListings(trending);
}

function showSimilarRecommendations() {
    if (viewedListings.size === 0) {
        updateRecommendationStatus('👀 View some properties first to get similar recommendations');
        return;
    }

    const viewedTypes = new Set();
    const viewedPriceRanges = [];
    
    viewedListings.forEach(id => {
        const listing = allListings.find(l => l.id === id);
        if (listing) {
            viewedTypes.add(listing.type);
            viewedPriceRanges.push(listing.price_per_night);
        }
    });

    const avgPrice = viewedPriceRanges.reduce((a, b) => a + b, 0) / viewedPriceRanges.length;
    const priceThreshold = 50;

    const similar = allListings
        .filter(listing => !viewedListings.has(listing.id))
        .filter(listing => 
            viewedTypes.has(listing.type) || 
            Math.abs(listing.price_per_night - avgPrice) <= priceThreshold
        )
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);

    if (similar.length === 0) {
        updateRecommendationStatus('✨ No similar properties found. Try browsing more listings!');
        return;
    }

    currentRecommendation = 'similar';
    updateRecommendationStatus(`✨ Similar to properties you've viewed`);
    displayListings(similar);
}

function resetRecommendations() {
    currentRecommendation = null;
    updateRecommendationStatus('');
    clearFilters();
}

function updateRecommendationStatus(message) {
    const status = document.getElementById('recommendation-status');
    status.textContent = message;
    status.className = message ? 'recommendation-status active' : 'recommendation-status';
}

window.openModal = openModal;
window.closeModal = closeModal;