// Script to test New Relic connection and generate data
// This will help New Relic detect your application

const http = require('http');

const BASE_URL = 'http://localhost:4000';
const ENDPOINTS = [
  '/health',
  '/',
  '/v1',
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

async function testConnection() {
  console.log('🔍 Testing New Relic Connection...\n');
  console.log('📋 Make sure your server is running with:');
  console.log('   NEW_RELIC_APP_NAME=Anuj2');
  console.log('   NEW_RELIC_LICENSE_KEY=7224a8ee0d182f2dcc1cee0eadfa43aeFFFFNRAL\n');
  
  // Test connection first
  try {
    const healthCheck = await makeRequest('/health');
    console.log('\n✅ Server is running and responding!\n');
  } catch (err) {
    console.error('\n❌ Server is not running!');
    console.error('Please start your server first with:');
    console.error('  npm start');
    console.error('  or');
    console.error('  npm run start:newrelic\n');
    process.exit(1);
  }
  
  console.log('📊 Generating test requests for New Relic...\n');
  
  // Generate multiple requests
  const totalRequests = 30;
  for (let i = 1; i <= totalRequests; i++) {
    console.log(`Request batch ${i}/${totalRequests}:`);
    
    for (const endpoint of ENDPOINTS) {
      try {
        await makeRequest(endpoint);
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        // Continue on error
      }
    }
    
    if (i < totalRequests) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n✅ Test complete!');
  console.log('\n📈 Next steps:');
  console.log('1. Wait 1-2 minutes for New Relic to process the data');
  console.log('2. Go back to New Relic dashboard and refresh the page');
  console.log('3. Look for application: "Anuj2"');
  console.log('4. The connection status should change from "..." to "Connected"');
  console.log('\n🔗 Dashboard: https://one.newrelic.com/');
}

// Run the test
testConnection().catch(console.error);

