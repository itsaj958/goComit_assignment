// Script to generate test data for New Relic monitoring
// Run this while your server is running to generate metrics

const http = require('http');

const BASE_URL = 'http://localhost:4000';
const ENDPOINTS = [
  '/health',
  '/',
  '/v1',
  // Add more endpoints as needed
];

function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + endpoint;
    const startTime = Date.now();
    
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - startTime;
        console.log(`✓ ${endpoint} - Status: ${res.statusCode} - Time: ${duration}ms`);
        resolve({ endpoint, status: res.statusCode, duration });
      });
    }).on('error', (err) => {
      console.error(`✗ ${endpoint} - Error: ${err.message}`);
      reject(err);
    });
  });
}

async function generateData() {
  console.log('🚀 Generating test data for New Relic...');
  console.log('📊 Make sure your server is running with New Relic enabled!\n');
  
  const requests = 20; // Number of requests to make
  const delay = 1000; // Delay between requests (ms)
  
  for (let i = 1; i <= requests; i++) {
    console.log(`\n--- Request Batch ${i}/${requests} ---`);
    
    for (const endpoint of ENDPOINTS) {
      try {
        await makeRequest(endpoint);
        await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between endpoints
      } catch (err) {
        // Continue on error
      }
    }
    
    if (i < requests) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.log('\n✅ Test data generation complete!');
  console.log('📈 Check your New Relic dashboard in 1-2 minutes: https://one.newrelic.com/');
  console.log('🔍 Look for application: "Anuj2"');
}

// Run the script
generateData().catch(console.error);

