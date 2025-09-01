// Web Worker for processing listings data
self.onmessage = function(e) {
    const { type, data, taskId } = e.data;
    
    switch (type) {
        case 'FILTER_LISTINGS':
            const { listings, filters } = data;
            const filteredResults = filterListings(listings, filters);
            self.postMessage({
                type: 'FILTER_COMPLETE',
                data: filteredResults,
                taskId: taskId
            });
            break;
            
        case 'PROCESS_BATCH':
            const processedBatch = processBatch(data);
            self.postMessage({
                type: 'BATCH_COMPLETE',
                data: processedBatch,
                taskId: taskId
            });
            break;
            
        default:
            self.postMessage({
                type: 'ERROR',
                data: `Unknown task type: ${type}`,
                taskId: taskId
            });
    }
};

function filterListings(listings, filters) {
    const { typeFilter, maxPrice, minRating } = filters;
    
    return listings.filter(listing => {
        const matchesType = !typeFilter || listing.type === typeFilter;
        const matchesPrice = listing.price_per_night <= maxPrice;
        const matchesRating = !minRating || listing.rating >= minRating;
        
        return matchesType && matchesPrice && matchesRating;
    });
}

function processBatch(batch) {
    return batch.map(item => {
        // Simulate some processing work
        return {
            ...item,
            processed: true,
            processedAt: Date.now()
        };
    });
}