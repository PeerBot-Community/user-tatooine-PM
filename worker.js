// Web Worker for testing concurrent processing with limit
self.onmessage = function(e) {
    const { type, data, taskId } = e.data;
    
    switch (type) {
        case 'PROCESS_LISTINGS':
            processListings(data, taskId);
            break;
        case 'HEAVY_COMPUTATION':
            performHeavyComputation(data, taskId);
            break;
        default:
            self.postMessage({ 
                type: 'ERROR', 
                taskId, 
                error: 'Unknown task type' 
            });
    }
};

function processListings(listings, taskId) {
    try {
        // Simulate processing time
        const startTime = Date.now();
        
        // Filter and sort listings (simulate heavy processing)
        const processed = listings
            .filter(listing => listing.rating >= 4.0)
            .map(listing => ({
                ...listing,
                processed: true,
                processedAt: new Date().toISOString()
            }))
            .sort((a, b) => b.rating - a.rating);
        
        const processingTime = Date.now() - startTime;
        
        self.postMessage({
            type: 'LISTINGS_PROCESSED',
            taskId,
            data: processed,
            processingTime,
            workerId: Math.floor(Math.random() * 10) + 1
        });
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            taskId,
            error: error.message
        });
    }
}

function performHeavyComputation(data, taskId) {
    try {
        const startTime = Date.now();
        
        // Simulate CPU-intensive task
        let result = 0;
        for (let i = 0; i < data.iterations; i++) {
            result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
        }
        
        const processingTime = Date.now() - startTime;
        
        self.postMessage({
            type: 'COMPUTATION_COMPLETE',
            taskId,
            result,
            processingTime,
            workerId: Math.floor(Math.random() * 10) + 1
        });
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            taskId,
            error: error.message
        });
    }
}