let allListings = [];
let filteredListings = [];

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
            
            <div class="modal-booking-section">
                <button class="btn-primary book-now-btn" onclick="openBookingModal('${listing.id}')">
                    Book Now - ₹${listing.price_per_night}/night
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

// Booking functionality
let currentBookingListing = null;
let selectedCheckinDate = null;
let selectedCheckoutDate = null;

// Generate availability data (simulated)
function generateAvailability() {
    const availability = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Generate 3 months of availability
    for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Make roughly 80% of dates available (random unavailability)
        availability[dateStr] = Math.random() > 0.2;
    }
    
    return availability;
}

function openBookingModal(listingId) {
    const listing = allListings.find(l => l.id === listingId);
    if (!listing) return;
    
    currentBookingListing = listing;
    selectedCheckinDate = null;
    selectedCheckoutDate = null;
    
    const bookingModal = document.getElementById('booking-modal');
    const propertyInfo = document.getElementById('booking-property-info');
    
    propertyInfo.innerHTML = `
        <div class="booking-property-card">
            <div class="booking-property-icon">${getListingIcon(listing.type)}</div>
            <div class="booking-property-details">
                <h4>${listing.title}</h4>
                <p>${listing.location} • ${listing.beds} bed${listing.beds !== 1 ? 's' : ''} • ${listing.baths} bath${listing.baths !== 1 ? 's' : ''}</p>
            </div>
        </div>
    `;
    
    setupBookingForm();
    generateCalendar();
    updateBookingSummary();
    
    bookingModal.classList.add('show');
    bookingModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    document.addEventListener('keydown', handleBookingModalKeyDown);
}

function closeBookingModal() {
    const bookingModal = document.getElementById('booking-modal');
    bookingModal.classList.remove('show');
    bookingModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
    
    document.removeEventListener('keydown', handleBookingModalKeyDown);
    
    // Reset form
    document.getElementById('booking-form').reset();
    currentBookingListing = null;
    selectedCheckinDate = null;
    selectedCheckoutDate = null;
}

function handleBookingModalKeyDown(event) {
    if (event.key === 'Escape') {
        closeBookingModal();
    }
}

function setupBookingForm() {
    const form = document.getElementById('booking-form');
    const checkinInput = document.getElementById('checkin-date');
    const checkoutInput = document.getElementById('checkout-date');
    const adultsSelect = document.getElementById('adults');
    const childrenSelect = document.getElementById('children');
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    checkinInput.min = today;
    checkoutInput.min = today;
    
    // Add event listeners
    checkinInput.addEventListener('change', handleCheckinChange);
    checkoutInput.addEventListener('change', handleCheckoutChange);
    adultsSelect.addEventListener('change', updateBookingSummary);
    childrenSelect.addEventListener('change', updateBookingSummary);
    
    form.addEventListener('submit', handleBookingSubmit);
}

function handleCheckinChange(event) {
    const checkinDate = new Date(event.target.value);
    selectedCheckinDate = checkinDate;
    
    // Set minimum checkout date to the day after checkin
    const minCheckout = new Date(checkinDate);
    minCheckout.setDate(minCheckout.getDate() + 1);
    document.getElementById('checkout-date').min = minCheckout.toISOString().split('T')[0];
    
    // Clear checkout if it's before new checkin
    const checkoutInput = document.getElementById('checkout-date');
    if (checkoutInput.value && new Date(checkoutInput.value) <= checkinDate) {
        checkoutInput.value = '';
        selectedCheckoutDate = null;
    }
    
    updateBookingSummary();
    updateCalendarSelection();
}

function handleCheckoutChange(event) {
    selectedCheckoutDate = new Date(event.target.value);
    updateBookingSummary();
    updateCalendarSelection();
}

function generateCalendar() {
    const calendar = document.getElementById('availability-calendar');
    const availability = generateAvailability();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get current month and year
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Clear calendar
    calendar.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendar.appendChild(header);
    });
    
    // Generate calendar days for 2 months
    for (let monthOffset = 0; monthOffset < 2; monthOffset++) {
        const month = new Date(currentYear, currentMonth + monthOffset, 1);
        const firstDay = month.getDay();
        const daysInMonth = new Date(currentYear, currentMonth + monthOffset + 1, 0).getDate();
        
        // Add empty cells for days before month starts
        if (monthOffset === 0) {
            for (let i = 0; i < firstDay; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'calendar-day empty';
                calendar.appendChild(emptyDay);
            }
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth + monthOffset, day);
            const dateStr = date.toISOString().split('T')[0];
            const dayElement = document.createElement('div');
            
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            dayElement.dataset.date = dateStr;
            
            // Check if date is available
            if (availability[dateStr] && date >= today) {
                dayElement.classList.add('available');
                dayElement.addEventListener('click', () => handleCalendarDayClick(date));
            } else {
                dayElement.classList.add('unavailable');
            }
            
            calendar.appendChild(dayElement);
        }
    }
}

function handleCalendarDayClick(date) {
    const dateStr = date.toISOString().split('T')[0];
    const checkinInput = document.getElementById('checkin-date');
    const checkoutInput = document.getElementById('checkout-date');
    
    if (!selectedCheckinDate || (selectedCheckinDate && selectedCheckoutDate)) {
        // Select check-in date
        selectedCheckinDate = date;
        selectedCheckoutDate = null;
        checkinInput.value = dateStr;
        checkoutInput.value = '';
        
        // Update minimum checkout date
        const minCheckout = new Date(date);
        minCheckout.setDate(minCheckout.getDate() + 1);
        checkoutInput.min = minCheckout.toISOString().split('T')[0];
        
    } else if (selectedCheckinDate && !selectedCheckoutDate && date > selectedCheckinDate) {
        // Select check-out date
        selectedCheckoutDate = date;
        checkoutInput.value = dateStr;
    }
    
    updateBookingSummary();
    updateCalendarSelection();
}

function updateCalendarSelection() {
    const calendarDays = document.querySelectorAll('.calendar-day.available');
    
    // Clear previous selections
    calendarDays.forEach(day => {
        day.classList.remove('selected', 'in-range');
    });
    
    if (selectedCheckinDate) {
        const checkinStr = selectedCheckinDate.toISOString().split('T')[0];
        const checkinDay = document.querySelector(`[data-date="${checkinStr}"]`);
        if (checkinDay) checkinDay.classList.add('selected');
    }
    
    if (selectedCheckoutDate) {
        const checkoutStr = selectedCheckoutDate.toISOString().split('T')[0];
        const checkoutDay = document.querySelector(`[data-date="${checkoutStr}"]`);
        if (checkoutDay) checkoutDay.classList.add('selected');
        
        // Highlight range
        if (selectedCheckinDate) {
            const rangeDays = document.querySelectorAll('.calendar-day.available');
            rangeDays.forEach(day => {
                const dayDate = new Date(day.dataset.date);
                if (dayDate > selectedCheckinDate && dayDate < selectedCheckoutDate) {
                    day.classList.add('in-range');
                }
            });
        }
    }
}

function updateBookingSummary() {
    const summaryDates = document.getElementById('summary-dates');
    const summaryGuests = document.getElementById('summary-guests');
    const summaryNights = document.getElementById('summary-nights');
    const summaryTotal = document.getElementById('summary-total');
    
    const adults = parseInt(document.getElementById('adults').value) || 1;
    const children = parseInt(document.getElementById('children').value) || 0;
    
    // Update guests
    const guestText = `${adults} Adult${adults !== 1 ? 's' : ''}${children > 0 ? `, ${children} Child${children !== 1 ? 'ren' : ''}` : ''}`;
    summaryGuests.textContent = guestText;
    
    if (selectedCheckinDate && selectedCheckoutDate) {
        // Update dates
        const checkinStr = selectedCheckinDate.toLocaleDateString('en-IN', { 
            day: 'numeric', 
            month: 'short' 
        });
        const checkoutStr = selectedCheckoutDate.toLocaleDateString('en-IN', { 
            day: 'numeric', 
            month: 'short' 
        });
        summaryDates.textContent = `${checkinStr} - ${checkoutStr}`;
        
        // Calculate nights and total
        const nights = Math.ceil((selectedCheckoutDate - selectedCheckinDate) / (1000 * 60 * 60 * 24));
        const total = nights * currentBookingListing.price_per_night;
        
        summaryNights.textContent = `${nights} night${nights !== 1 ? 's' : ''}`;
        summaryTotal.textContent = `₹${total}`;
        
        // Enable booking button
        document.getElementById('confirm-booking-btn').disabled = false;
    } else {
        summaryDates.textContent = 'Select dates';
        summaryNights.textContent = '0 nights';
        summaryTotal.textContent = '₹0';
        document.getElementById('confirm-booking-btn').disabled = true;
    }
}

function handleBookingSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const bookingData = {
        listingId: currentBookingListing.id,
        listingTitle: currentBookingListing.title,
        checkin: formData.get('checkin'),
        checkout: formData.get('checkout'),
        adults: formData.get('adults'),
        children: formData.get('children'),
        guestName: formData.get('guestName'),
        guestEmail: formData.get('guestEmail'),
        guestPhone: formData.get('guestPhone'),
        specialRequests: formData.get('specialRequests'),
        totalPrice: document.getElementById('summary-total').textContent,
        nights: document.getElementById('summary-nights').textContent
    };
    
    // Validate required fields
    if (!bookingData.checkin || !bookingData.checkout || !bookingData.guestName || 
        !bookingData.guestEmail || !bookingData.guestPhone) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Simulate booking confirmation
    showBookingConfirmation(bookingData);
}

function showBookingConfirmation(bookingData) {
    const confirmationHtml = `
        <div class="booking-confirmation">
            <div class="confirmation-icon">✅</div>
            <h2>Booking Confirmed!</h2>
            <p>Your reservation has been successfully submitted.</p>
            
            <div class="confirmation-details">
                <h4>Reservation Details</h4>
                <div class="detail-row">
                    <strong>Property:</strong> ${bookingData.listingTitle}
                </div>
                <div class="detail-row">
                    <strong>Dates:</strong> ${bookingData.checkin} to ${bookingData.checkout}
                </div>
                <div class="detail-row">
                    <strong>Guests:</strong> ${bookingData.adults} Adults${parseInt(bookingData.children) > 0 ? `, ${bookingData.children} Children` : ''}
                </div>
                <div class="detail-row">
                    <strong>Total:</strong> ${bookingData.totalPrice} for ${bookingData.nights}
                </div>
                <div class="detail-row">
                    <strong>Guest:</strong> ${bookingData.guestName}
                </div>
                <div class="detail-row">
                    <strong>Email:</strong> ${bookingData.guestEmail}
                </div>
            </div>
            
            <p class="confirmation-note">
                A confirmation email has been sent to ${bookingData.guestEmail}. 
                Please check your email for payment instructions and additional details.
            </p>
            
            <button class="btn-primary" onclick="closeBookingModal()">Close</button>
        </div>
    `;
    
    document.querySelector('.booking-modal-body').innerHTML = confirmationHtml;
}

// Make functions available globally
window.openModal = openModal;
window.closeModal = closeModal;
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;