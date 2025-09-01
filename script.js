let allListings = [];
let filteredListings = [];

// Worker pool configuration
const WORKER_LIMIT = 5;
let workerPool = [];
let workerQueue = [];
let workerTaskCounter = 0;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        initializeWorkerPool();
        await loadListings();
        setupFilters();
        displayListings(allListings);
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load listings. Please refresh the page.');
    }
});

function initializeWorkerPool() {
    for (let i = 0; i < WORKER_LIMIT; i++) {
        const worker = {
            instance: new Worker('./worker.js'),
            busy: false,
            id: i
        };
        
        worker.instance.onmessage = function(e) {
            handleWorkerMessage(worker, e);
        };
        
        worker.instance.onerror = function(error) {
            console.error('Worker error:', error);
            worker.busy = false;
            processWorkerQueue();
        };
        
        workerPool.push(worker);
    }
    console.log(`Initialized worker pool with ${WORKER_LIMIT} workers`);
}

function getAvailableWorker() {
    return workerPool.find(worker => !worker.busy);
}

function executeTask(taskType, data, callback) {
    const taskId = ++workerTaskCounter;
    const task = { taskType, data, callback, taskId };
    
    const availableWorker = getAvailableWorker();
    
    if (availableWorker) {
        executeWorkerTask(availableWorker, task);
    } else {
        workerQueue.push(task);
    }
    
    return taskId;
}

function executeWorkerTask(worker, task) {
    worker.busy = true;
    worker.currentTask = task;
    
    worker.instance.postMessage({
        type: task.taskType,
        data: task.data,
        taskId: task.taskId
    });
}

function handleWorkerMessage(worker, event) {
    const { type, data, taskId } = event.data;
    
    if (worker.currentTask && worker.currentTask.taskId === taskId) {
        worker.currentTask.callback(type, data);
        worker.currentTask = null;
    }
    
    worker.busy = false;
    processWorkerQueue();
}

function processWorkerQueue() {
    if (workerQueue.length === 0) return;
    
    const availableWorker = getAvailableWorker();
    if (availableWorker) {
        const task = workerQueue.shift();
        executeWorkerTask(availableWorker, task);
    }
}

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

    const filters = {
        typeFilter: typeFilter,
        maxPrice: maxPrice,
        minRating: minRating
    };

    // Use worker pool for filtering if we have many listings
    if (allListings.length > 50) {
        executeTask('FILTER_LISTINGS', 
            { listings: allListings, filters }, 
            (type, data) => {
                if (type === 'FILTER_COMPLETE') {
                    filteredListings = data;
                    displayListings(filteredListings);
                }
            }
        );
    } else {
        // Fallback to synchronous filtering for smaller datasets
        filteredListings = allListings.filter(listing => {
            const matchesType = !typeFilter || listing.type === typeFilter;
            const matchesPrice = listing.price_per_night <= maxPrice;
            const matchesRating = !minRating || listing.rating >= minRating;
            
            return matchesType && matchesPrice && matchesRating;
        });
        displayListings(filteredListings);
    }
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

// Test function to verify worker limit
function testWorkerLimit() {
    console.log(`Testing worker pool with limit: ${WORKER_LIMIT}`);
    
    // Create multiple tasks to test the limit
    const testTasks = [];
    for (let i = 0; i < 10; i++) {
        const taskId = executeTask('PROCESS_BATCH', 
            { batch: [{ id: i, data: `test-${i}` }] },
            (type, data) => {
                console.log(`Task ${i} completed:`, type, data);
            }
        );
        testTasks.push(taskId);
    }
    
    // Log current worker status
    console.log('Active workers:', workerPool.filter(w => w.busy).length);
    console.log('Queued tasks:', workerQueue.length);
    console.log('Total workers:', workerPool.length);
    
    return testTasks;
}

window.openModal = openModal;
window.closeModal = closeModal;
window.testWorkerLimit = testWorkerLimit;