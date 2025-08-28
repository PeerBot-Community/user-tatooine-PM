let allListings = [];
let filteredListings = [];
let wishlist = [];
let currentBookingListing = null;
let currentTourRoom = 'main';
let tourRotation = 0;
let reviews = {}; // Store reviews by listing ID

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
                <div class="listing-actions">
                    <button class="wishlist-btn ${isInWishlist(listing.id) ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlistItem('${listing.id}')" aria-label="Add to wishlist">
                        ${isInWishlist(listing.id) ? '❤️' : '🤍'}
                    </button>
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
            
            <div class="modal-actions">
                <button class="action-btn book-btn" onclick="openBookingModal('${listing.id}')">
                    📅 Book Now
                </button>
                <button class="action-btn tour-btn" onclick="openTourModal('${listing.id}')">
                    🏠 360° Tour
                </button>
                <button class="action-btn reviews-btn" onclick="openReviewsModal('${listing.id}')">
                    ⭐ Reviews (${listing.reviews + (reviews[listing.id] ? reviews[listing.id].length : 0)})
                </button>
                <button class="action-btn wishlist-btn ${isInWishlist(listing.id) ? 'active' : ''}" onclick="toggleWishlistItem('${listing.id}')">
                    ${isInWishlist(listing.id) ? '❤️ Saved' : '🤍 Save'}
                </button>
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

// Wishlist functionality
function isInWishlist(listingId) {
    return wishlist.includes(listingId);
}

function toggleWishlistItem(listingId) {
    const index = wishlist.indexOf(listingId);
    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(listingId);
    }
    
    saveWishlist();
    updateWishlistUI();
    updateWishlistButton();
    
    // Update the listing cards
    displayListings(filteredListings);
}

function saveWishlist() {
    localStorage.setItem('tatooine-wishlist', JSON.stringify(wishlist));
}

function loadWishlist() {
    const saved = localStorage.getItem('tatooine-wishlist');
    wishlist = saved ? JSON.parse(saved) : [];
    updateWishlistButton();
}

function updateWishlistButton() {
    const wishlistCount = document.getElementById('wishlist-count');
    if (wishlistCount) {
        wishlistCount.textContent = wishlist.length;
    }
}

function toggleWishlist() {
    const modal = document.getElementById('wishlist-modal');
    const wishlistContent = document.getElementById('wishlist-content');
    
    if (wishlist.length === 0) {
        wishlistContent.innerHTML = `
            <div class="empty-wishlist">
                <h3>Your wishlist is empty</h3>
                <p>Save properties you like to view them here later!</p>
            </div>
        `;
    } else {
        const wishlistListings = allListings.filter(listing => wishlist.includes(listing.id));
        wishlistContent.innerHTML = wishlistListings.map(listing => {
            const stars = '★'.repeat(Math.floor(listing.rating));
            return `
                <div class="wishlist-item" onclick="openModal('${listing.id}')">
                    <div class="wishlist-image">${getListingIcon(listing.type)}</div>
                    <div class="wishlist-details">
                        <h4>${listing.title}</h4>
                        <p>${listing.location}</p>
                        <div class="wishlist-price">₹${listing.price_per_night}/night</div>
                        <div class="wishlist-rating">${stars} ${listing.rating}</div>
                    </div>
                    <button class="remove-wishlist" onclick="event.stopPropagation(); toggleWishlistItem('${listing.id}')" aria-label="Remove from wishlist">×</button>
                </div>
            `;
        }).join('');
    }
    
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeWishlistModal() {
    const modal = document.getElementById('wishlist-modal');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
}

function updateWishlistUI() {
    // Update wishlist buttons in listing cards and modals
    const wishlistButtons = document.querySelectorAll('.wishlist-btn');
    wishlistButtons.forEach(button => {
        const listingId = button.onclick.toString().match(/'([^']+)'/)?.[1];
        if (listingId) {
            const inWishlist = isInWishlist(listingId);
            button.textContent = inWishlist ? '❤️' : '🤍';
            button.classList.toggle('active', inWishlist);
        }
    });
}

// Booking Calendar functionality
function initializeBookingCalendar() {
    const checkinDate = document.getElementById('checkin-date');
    const checkoutDate = document.getElementById('checkout-date');
    
    if (checkinDate && checkoutDate) {
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        checkinDate.min = today;
        checkoutDate.min = today;
        
        checkinDate.addEventListener('change', updateBookingSummary);
        checkoutDate.addEventListener('change', updateBookingSummary);
        document.getElementById('guest-count').addEventListener('change', updateBookingSummary);
    }
}

function openBookingModal(listingId) {
    currentBookingListing = allListings.find(l => l.id === listingId);
    if (!currentBookingListing) return;
    
    const modal = document.getElementById('booking-modal');
    const priceElement = document.getElementById('booking-price-per-night');
    
    priceElement.textContent = `₹${currentBookingListing.price_per_night}`;
    
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    updateBookingSummary();
}

function closeBookingModal() {
    const modal = document.getElementById('booking-modal');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
    currentBookingListing = null;
}

function updateBookingSummary() {
    if (!currentBookingListing) return;
    
    const checkinDate = document.getElementById('checkin-date').value;
    const checkoutDate = document.getElementById('checkout-date').value;
    const nightsElement = document.getElementById('booking-nights');
    const totalElement = document.getElementById('booking-total');
    
    if (checkinDate && checkoutDate) {
        const checkin = new Date(checkinDate);
        const checkout = new Date(checkoutDate);
        const nights = Math.max(0, Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24)));
        
        nightsElement.textContent = nights;
        const total = nights * currentBookingListing.price_per_night;
        totalElement.textContent = `₹${total}`;
        
        // Ensure checkout is after checkin
        if (checkin >= checkout) {
            document.getElementById('checkout-date').value = '';
            nightsElement.textContent = '0';
            totalElement.textContent = '₹0';
        }
    } else {
        nightsElement.textContent = '0';
        totalElement.textContent = '₹0';
    }
}

function processBooking() {
    const checkinDate = document.getElementById('checkin-date').value;
    const checkoutDate = document.getElementById('checkout-date').value;
    const guestCount = document.getElementById('guest-count').value;
    
    if (!checkinDate || !checkoutDate) {
        alert('Please select both check-in and check-out dates.');
        return;
    }
    
    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);
    const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
    const total = nights * currentBookingListing.price_per_night;
    
    alert(`Booking confirmed!\n\nProperty: ${currentBookingListing.title}\nCheck-in: ${checkinDate}\nCheck-out: ${checkoutDate}\nGuests: ${guestCount}\nTotal: ₹${total}\n\nThank you for choosing Tatooine Stays!`);
    
    closeBookingModal();
}

// 360° Tour functionality
function openTourModal(listingId) {
    const listing = allListings.find(l => l.id === listingId);
    if (!listing) return;
    
    const modal = document.getElementById('tour-modal');
    const title = document.getElementById('tour-modal-title');
    
    title.textContent = `Virtual Tour: ${listing.title}`;
    currentTourRoom = 'main';
    tourRotation = 0;
    
    updateTourView();
    
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeTourModal() {
    const modal = document.getElementById('tour-modal');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
}

function rotateTour(degrees) {
    tourRotation += degrees;
    updateTourView();
}

function switchRoom(room) {
    currentTourRoom = room;
    const roomButtons = document.querySelectorAll('.room-btn');
    roomButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    updateTourView();
}

function updateTourView() {
    const tourPlaceholder = document.querySelector('.tour-placeholder');
    const roomDescriptions = {
        main: 'Main living area with stunning desert views',
        bedroom: 'Comfortable sleeping quarters under twin suns',
        bathroom: 'Modern amenities in the desert',
        exterior: 'Breathtaking panoramic desert landscape'
    };
    
    tourPlaceholder.style.transform = `rotateY(${tourRotation}deg)`;
    
    const description = tourPlaceholder.querySelector('p');
    description.textContent = roomDescriptions[currentTourRoom] || 'Experience this amazing property in 360°';
}

// Review System functionality
function initializeReviewSystem() {
    const starRating = document.getElementById('star-rating');
    if (starRating) {
        const stars = starRating.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const rating = parseInt(this.dataset.rating);
                updateStarRating(rating);
            });
            
            star.addEventListener('mouseover', function() {
                const rating = parseInt(this.dataset.rating);
                highlightStars(rating);
            });
        });
        
        starRating.addEventListener('mouseleave', function() {
            const currentRating = starRating.dataset.currentRating || 0;
            highlightStars(currentRating);
        });
    }
    
    // Load existing reviews from localStorage
    const savedReviews = localStorage.getItem('tatooine-reviews');
    reviews = savedReviews ? JSON.parse(savedReviews) : {};
    
    // Initialize photo upload
    const photoInput = document.getElementById('review-photos');
    if (photoInput) {
        photoInput.addEventListener('change', handlePhotoUpload);
    }
}

function updateStarRating(rating) {
    const starRating = document.getElementById('star-rating');
    starRating.dataset.currentRating = rating;
    highlightStars(rating);
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('#star-rating .star');
    stars.forEach((star, index) => {
        star.textContent = index < rating ? '★' : '☆';
    });
}

function handlePhotoUpload(event) {
    const files = event.target.files;
    const preview = document.getElementById('photo-preview');
    preview.innerHTML = '';
    
    Array.from(files).forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const img = document.createElement('div');
            img.className = 'photo-thumbnail';
            img.innerHTML = `
                <span class="photo-name">${file.name}</span>
                <button class="remove-photo" onclick="removePhoto(${index})">×</button>
            `;
            preview.appendChild(img);
        }
    });
}

function removePhoto(index) {
    const photoInput = document.getElementById('review-photos');
    const dt = new DataTransfer();
    const files = Array.from(photoInput.files);
    
    files.forEach((file, i) => {
        if (i !== index) {
            dt.items.add(file);
        }
    });
    
    photoInput.files = dt.files;
    handlePhotoUpload({ target: photoInput });
}

function openReviewsModal(listingId) {
    const listing = allListings.find(l => l.id === listingId);
    if (!listing) return;
    
    const modal = document.getElementById('reviews-modal');
    const title = document.getElementById('reviews-modal-title');
    const reviewsList = document.getElementById('reviews-list');
    
    title.textContent = `Reviews for ${listing.title}`;
    
    // Display existing reviews
    const listingReviews = reviews[listingId] || [];
    if (listingReviews.length === 0) {
        reviewsList.innerHTML = `
            <div class="no-reviews">
                <h4>No reviews yet</h4>
                <p>Be the first to share your experience!</p>
            </div>
        `;
    } else {
        reviewsList.innerHTML = listingReviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                    <div class="review-date">${new Date(review.date).toLocaleDateString()}</div>
                </div>
                <p class="review-text">${review.text}</p>
                ${review.photos && review.photos.length > 0 ? `
                    <div class="review-photos">
                        ${review.photos.map(photo => `<div class="review-photo">📸 ${photo}</div>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
    
    // Reset form
    document.getElementById('review-text').value = '';
    document.getElementById('review-photos').value = '';
    document.getElementById('photo-preview').innerHTML = '';
    updateStarRating(0);
    
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Store current listing ID for review submission
    modal.dataset.listingId = listingId;
}

function closeReviewsModal() {
    const modal = document.getElementById('reviews-modal');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
}

function submitReview() {
    const modal = document.getElementById('reviews-modal');
    const listingId = modal.dataset.listingId;
    const rating = parseInt(document.getElementById('star-rating').dataset.currentRating || 0);
    const text = document.getElementById('review-text').value.trim();
    const photoFiles = document.getElementById('review-photos').files;
    
    if (rating === 0) {
        alert('Please select a rating.');
        return;
    }
    
    if (!text) {
        alert('Please write a review.');
        return;
    }
    
    // Create review object
    const review = {
        rating: rating,
        text: text,
        date: new Date().toISOString(),
        photos: Array.from(photoFiles).map(file => file.name)
    };
    
    // Add to reviews
    if (!reviews[listingId]) {
        reviews[listingId] = [];
    }
    reviews[listingId].push(review);
    
    // Save to localStorage
    localStorage.setItem('tatooine-reviews', JSON.stringify(reviews));
    
    alert('Thank you for your review!');
    
    // Refresh the reviews display
    openReviewsModal(listingId);
}

window.openModal = openModal;
window.closeModal = closeModal;
window.toggleWishlist = toggleWishlist;
window.closeWishlistModal = closeWishlistModal;
window.toggleWishlistItem = toggleWishlistItem;
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.processBooking = processBooking;
window.openTourModal = openTourModal;
window.closeTourModal = closeTourModal;
window.rotateTour = rotateTour;
window.switchRoom = switchRoom;
window.openReviewsModal = openReviewsModal;
window.closeReviewsModal = closeReviewsModal;
window.submitReview = submitReview;
window.removePhoto = removePhoto;
window.initializeBookingCalendar = initializeBookingCalendar;
window.initializeReviewSystem = initializeReviewSystem;
window.loadWishlist = loadWishlist;