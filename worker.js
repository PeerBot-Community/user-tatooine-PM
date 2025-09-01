// Worker script for processing tasks
self.onmessage = function(e) {
    const { taskId, data, delay = 1000 } = e.data;
    
    // Simulate some work with the provided delay
    setTimeout(() => {
        const result = {
            taskId,
            workerId: Math.random().toString(36).substr(2, 9),
            processedData: `Processed: ${data}`,
            timestamp: new Date().toISOString()
        };
        
        self.postMessage(result);
    }, delay);
};