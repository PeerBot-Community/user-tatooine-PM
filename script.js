let allListings = [];
let filteredListings = [];

// Worker Pool for testing concurrent processing with limit 10
class WorkerPool {
    constructor(workerScript, maxWorkers = 10) {
        this.workerScript = workerScript;
        this.maxWorkers = maxWorkers;
        this.workers = [];
        this.availableWorkers = [];
        this.taskQueue = [];
        this.activeTasks = new Map();
        this.taskIdCounter = 0;
        
        console.log(`WorkerPool initialized with limit: ${maxWorkers}`);
    }
    
    createWorker() {
        if (this.workers.length >= this.maxWorkers) {
            return null;
        }
        
        const worker = new Worker(this.workerScript);
        const workerId = this.workers.length + 1;
        
        worker.onmessage = (e) => this.handleWorkerMessage(workerId, e);
        worker.onerror = (error) => this.handleWorkerError(workerId, error);
        
        this.workers.push(worker);
        this.availableWorkers.push(workerId - 1);
        
        console.log(`Created worker ${workerId}, total: ${this.workers.length}/${this.maxWorkers}`);
        return workerId - 1;
    }
    
    async executeTask(type, data) {
        return new Promise((resolve, reject) => {
            const taskId = ++this.taskIdCounter;
            const task = { taskId, type, data, resolve, reject };
            
            if (this.availableWorkers.length > 0) {
                this.assignTask(task);
            } else if (this.workers.length < this.maxWorkers) {
                const workerId = this.createWorker();
                if (workerId !== null) {
                    this.assignTask(task);
                } else {
                    this.taskQueue.push(task);
                }
            } else {
                this.taskQueue.push(task);
                console.log(`Task ${taskId} queued, ${this.taskQueue.length} tasks waiting`);
            }
        });
    }
    
    assignTask(task) {
        const workerId = this.availableWorkers.shift();
        const worker = this.workers[workerId];
        
        this.activeTasks.set(task.taskId, { workerId, task });
        
        worker.postMessage({
            type: task.type,
            data: task.data,
            taskId: task.taskId
        });
        
        console.log(`Assigned task ${task.taskId} to worker ${workerId + 1}`);
    }
    
    handleWorkerMessage(workerId, e) {
        const { type, taskId, data, error, processingTime } = e.data;
        const taskInfo = this.activeTasks.get(taskId);
        
        if (!taskInfo) return;
        
        const { task } = taskInfo;
        this.activeTasks.delete(taskId);
        this.availableWorkers.push(workerId);
        
        if (type === 'ERROR') {
            task.reject(new Error(error));
        } else {
            task.resolve({ type, data, processingTime, workerId: workerId + 1 });
        }
        
        console.log(`Task ${taskId} completed by worker ${workerId + 1} in ${processingTime}ms`);
        
        // Process next task in queue
        if (this.taskQueue.length > 0) {
            const nextTask = this.taskQueue.shift();
            this.assignTask(nextTask);
        }
    }
    
    handleWorkerError(workerId, error) {
        console.error(`Worker ${workerId + 1} error:`, error);
    }
    
    getStatus() {
        return {
            totalWorkers: this.workers.length,
            maxWorkers: this.maxWorkers,
            availableWorkers: this.availableWorkers.length,
            activeTasks: this.activeTasks.size,
            queuedTasks: this.taskQueue.length
        };
    }
}

// Initialize worker pool
let workerPool = null;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadListings();
        setupFilters();
        displayListings(allListings);
        
        // Initialize worker pool for testing
        workerPool = new WorkerPool('./worker.js', 10);
        setupWorkerTesting();
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

window.openModal = openModal;
window.closeModal = closeModal;

// Worker testing functions
function setupWorkerTesting() {
    // Create test UI if it doesn't exist
    if (!document.getElementById('worker-test-section')) {
        const testSection = document.createElement('div');
        testSection.id = 'worker-test-section';
        testSection.innerHTML = `
            <div style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 8px; z-index: 1000; font-size: 12px;">
                <h4>Worker Pool Test (Limit: 10)</h4>
                <div id="worker-status">Ready</div>
                <button onclick="testWorkerLimit()">Test Worker Limit</button>
                <button onclick="testHeavyComputation()">Test Heavy Computation</button>
                <button onclick="showWorkerStatus()">Show Status</button>
            </div>
        `;
        document.body.appendChild(testSection);
    }
    
    console.log('Worker testing UI ready');
}

async function testWorkerLimit() {
    if (!workerPool) {
        console.error('Worker pool not initialized');
        return;
    }
    
    const statusDiv = document.getElementById('worker-status');
    statusDiv.innerHTML = 'Testing worker limit with 15 concurrent tasks...';
    
    console.log('🧪 Starting worker limit test with 15 tasks (limit: 10)');
    
    // Create 15 concurrent tasks to test the limit
    const tasks = [];
    const startTime = Date.now();
    
    for (let i = 0; i < 15; i++) {
        const task = workerPool.executeTask('PROCESS_LISTINGS', allListings.slice(0, 5))
            .then(result => {
                console.log(`✅ Task ${i + 1} completed by worker ${result.workerId} in ${result.processingTime}ms`);
                return result;
            })
            .catch(error => {
                console.error(`❌ Task ${i + 1} failed:`, error);
                throw error;
            });
        tasks.push(task);
        
        // Log status every few tasks
        if ((i + 1) % 5 === 0) {
            const status = workerPool.getStatus();
            console.log(`📊 Status after ${i + 1} tasks: ${status.totalWorkers} workers, ${status.activeTasks} active, ${status.queuedTasks} queued`);
        }
    }
    
    try {
        const results = await Promise.all(tasks);
        const totalTime = Date.now() - startTime;
        
        console.log(`🎉 All 15 tasks completed in ${totalTime}ms`);
        console.log('📈 Results summary:', {
            totalTasks: results.length,
            totalTime,
            averageTimePerTask: totalTime / results.length
        });
        
        statusDiv.innerHTML = `✅ Completed 15 tasks in ${totalTime}ms (avg: ${Math.round(totalTime / results.length)}ms/task)`;
    } catch (error) {
        console.error('❌ Worker test failed:', error);
        statusDiv.innerHTML = '❌ Test failed - check console';
    }
}

async function testHeavyComputation() {
    if (!workerPool) {
        console.error('Worker pool not initialized');
        return;
    }
    
    const statusDiv = document.getElementById('worker-status');
    statusDiv.innerHTML = 'Testing heavy computation with 12 tasks...';
    
    console.log('🧪 Starting heavy computation test with 12 tasks');
    
    const tasks = [];
    const startTime = Date.now();
    
    for (let i = 0; i < 12; i++) {
        const iterations = 1000000 + (i * 100000); // Varying workload
        const task = workerPool.executeTask('HEAVY_COMPUTATION', { iterations })
            .then(result => {
                console.log(`✅ Computation ${i + 1} (${iterations} iterations) completed by worker ${result.workerId} in ${result.processingTime}ms`);
                return result;
            });
        tasks.push(task);
    }
    
    try {
        const results = await Promise.all(tasks);
        const totalTime = Date.now() - startTime;
        
        console.log(`🎉 All computations completed in ${totalTime}ms`);
        statusDiv.innerHTML = `✅ Completed 12 computations in ${totalTime}ms`;
    } catch (error) {
        console.error('❌ Computation test failed:', error);
        statusDiv.innerHTML = '❌ Test failed - check console';
    }
}

function showWorkerStatus() {
    if (!workerPool) {
        console.error('Worker pool not initialized');
        return;
    }
    
    const status = workerPool.getStatus();
    console.log('📊 Current Worker Pool Status:', status);
    
    const statusDiv = document.getElementById('worker-status');
    statusDiv.innerHTML = `Workers: ${status.totalWorkers}/${status.maxWorkers} | Active: ${status.activeTasks} | Queued: ${status.queuedTasks}`;
}

// Make functions globally available
window.testWorkerLimit = testWorkerLimit;
window.testHeavyComputation = testHeavyComputation;
window.showWorkerStatus = showWorkerStatus;