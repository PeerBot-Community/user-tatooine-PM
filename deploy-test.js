#!/usr/bin/env node

/**
 * Simple deployment test for Tatooine Stays static site
 * Tests basic functionality and deployment readiness
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class DeploymentTester {
    constructor(port = 8000) {
        this.port = port;
        this.server = null;
        this.testResults = [];
    }

    // Simple reconcileDeployments method for testing
    reconcileDeployments() {
        console.log('🚀 Starting deployment reconciliation...');
        
        const checks = [
            this.checkFileExists('index.html'),
            this.checkFileExists('styles.css'), 
            this.checkFileExists('script.js'),
            this.checkFileExists('data/listings.json'),
            this.checkDataIntegrity(),
            this.checkResponsiveness()
        ];

        const results = checks.map(check => {
            try {
                const result = check();
                console.log(`✅ ${result.name}: PASS`);
                return { ...result, status: 'PASS' };
            } catch (error) {
                console.log(`❌ ${check.name}: FAIL - ${error.message}`);
                return { name: check.name, status: 'FAIL', error: error.message };
            }
        });

        return {
            success: results.every(r => r.status === 'PASS'),
            results: results,
            timestamp: new Date().toISOString()
        };
    }

    checkFileExists(filePath) {
        return () => {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File ${filePath} not found`);
            }
            return { name: `File exists: ${filePath}` };
        };
    }

    checkDataIntegrity() {
        return () => {
            const listingsPath = 'data/listings.json';
            if (!fs.existsSync(listingsPath)) {
                throw new Error('Listings data file not found');
            }
            
            const data = JSON.parse(fs.readFileSync(listingsPath, 'utf8'));
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('Invalid or empty listings data');
            }

            // Check required fields
            const requiredFields = ['id', 'title', 'type', 'price_per_night'];
            const firstListing = data[0];
            requiredFields.forEach(field => {
                if (!(field in firstListing)) {
                    throw new Error(`Missing required field: ${field}`);
                }
            });

            return { name: 'Data integrity check', count: data.length };
        };
    }

    checkResponsiveness() {
        return () => {
            const cssContent = fs.readFileSync('styles.css', 'utf8');
            if (!cssContent.includes('@media')) {
                throw new Error('No responsive design media queries found');
            }
            return { name: 'Responsive design check' };
        };
    }

    async startServer() {
        return new Promise((resolve, reject) => {
            this.server = http.createServer((req, res) => {
                let filePath = req.url === '/' ? '/index.html' : req.url;
                filePath = path.join(__dirname, filePath);

                const ext = path.extname(filePath);
                const contentType = {
                    '.html': 'text/html',
                    '.css': 'text/css',
                    '.js': 'application/javascript',
                    '.json': 'application/json'
                }[ext] || 'text/plain';

                fs.readFile(filePath, (err, content) => {
                    if (err) {
                        res.writeHead(404);
                        res.end('File not found');
                        return;
                    }
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content);
                });
            });

            this.server.listen(this.port, () => {
                console.log(`🌐 Test server running on http://localhost:${this.port}`);
                resolve();
            });

            this.server.on('error', reject);
        });
    }

    async runDeploymentTest() {
        console.log('🏜️  Tatooine Stays Deployment Test\n');
        
        // Run reconcileDeployments method
        const reconcileResult = this.reconcileDeployments();
        
        if (!reconcileResult.success) {
            console.log('\n❌ Deployment reconciliation failed!');
            return reconcileResult;
        }

        console.log('\n✅ Deployment reconciliation successful!');
        console.log('\n🚀 Starting test server...');
        
        try {
            await this.startServer();
            console.log('\n✅ Deployment test completed successfully!');
            console.log(`Visit http://localhost:${this.port} to view the site`);
            
            return {
                ...reconcileResult,
                serverUrl: `http://localhost:${this.port}`,
                message: 'Deployment test passed - site is ready for production'
            };
        } catch (error) {
            console.log(`\n❌ Server failed to start: ${error.message}`);
            return {
                ...reconcileResult,
                serverError: error.message
            };
        }
    }

    stop() {
        if (this.server) {
            this.server.close();
            console.log('🛑 Test server stopped');
        }
    }
}

// Run the test if called directly
if (require.main === module) {
    const tester = new DeploymentTester();
    
    tester.runDeploymentTest().then(result => {
        console.log('\n📋 Test Summary:', JSON.stringify(result, null, 2));
        
        // Keep server running for manual testing
        console.log('\nPress Ctrl+C to stop the server');
        process.on('SIGINT', () => {
            tester.stop();
            process.exit(0);
        });
    }).catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
}

module.exports = DeploymentTester;