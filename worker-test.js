// Worker Limit Test - Maximum 2 concurrent workers
class WorkerPool {
    constructor(maxWorkers = 2) {
        this.maxWorkers = maxWorkers;
        this.activeWorkers = 0;
        this.queue = [];
    }

    async processTask(taskId, duration = 1000) {
        return new Promise((resolve) => {
            const task = {
                id: taskId,
                duration,
                resolve,
                startTime: null
            };
            
            this.queue.push(task);
            this.processNext();
        });
    }

    async processNext() {
        if (this.activeWorkers >= this.maxWorkers || this.queue.length === 0) {
            return;
        }

        const task = this.queue.shift();
        this.activeWorkers++;
        task.startTime = Date.now();
        
        console.log(`🚀 Starting task ${task.id} (Active workers: ${this.activeWorkers})`);
        
        setTimeout(() => {
            const endTime = Date.now();
            const actualDuration = endTime - task.startTime;
            
            console.log(`✅ Task ${task.id} completed in ${actualDuration}ms (Active workers: ${this.activeWorkers})`);
            
            this.activeWorkers--;
            task.resolve({ id: task.id, duration: actualDuration });
            
            // Process next task in queue
            this.processNext();
        }, task.duration);
    }

    getStatus() {
        return {
            activeWorkers: this.activeWorkers,
            queuedTasks: this.queue.length,
            maxWorkers: this.maxWorkers
        };
    }
}

// Test function
async function testWorkerLimit() {
    console.log('🔧 Testing Worker Limit: 2 concurrent workers maximum\n');
    
    const pool = new WorkerPool(2);
    const tasks = [];
    
    // Create 5 tasks with different durations
    const taskDurations = [500, 800, 600, 400, 700];
    
    console.log('📝 Queuing 5 tasks...');
    taskDurations.forEach((duration, index) => {
        console.log(`   Task ${index + 1}: ${duration}ms`);
    });
    console.log();
    
    // Start all tasks (they'll be queued and processed with limit)
    for (let i = 0; i < taskDurations.length; i++) {
        tasks.push(pool.processTask(i + 1, taskDurations[i]));
    }
    
    // Wait for all tasks to complete
    const results = await Promise.all(tasks);
    
    console.log('\n📊 Results:');
    results.forEach(result => {
        console.log(`   Task ${result.id}: ${result.duration}ms`);
    });
    
    console.log('\n✨ Worker limit test completed!');
    console.log('Expected behavior: Only 2 tasks should run simultaneously');
}

// Run the test
if (typeof window !== 'undefined') {
    // Browser environment
    window.testWorkerLimit = testWorkerLimit;
    console.log('Worker limit test loaded. Run testWorkerLimit() to start.');
} else {
    // Node.js environment
    testWorkerLimit();
}