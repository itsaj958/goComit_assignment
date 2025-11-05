// Quick diagnostic script to verify New Relic setup
const dotenv = require('dotenv');
dotenv.config();

console.log('=== New Relic Diagnostic Check ===\n');

// Check environment variables
console.log('1. Environment Variables:');
console.log('   NEW_RELIC_APP_NAME:', process.env.NEW_RELIC_APP_NAME || 'NOT SET');
console.log('   NEW_RELIC_LICENSE_KEY:', process.env.NEW_RELIC_LICENSE_KEY ? 
  `${process.env.NEW_RELIC_LICENSE_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('');

// Check if newrelic package is installed
console.log('2. Package Check:');
try {
  const newrelic = require('newrelic');
  console.log('   ✓ New Relic package is installed');
  console.log('   Version:', require('newrelic/package.json').version);
} catch (e) {
  console.log('   ✗ New Relic package NOT found');
  console.log('   Error:', e.message);
}
console.log('');

// Check if newrelic.js config exists
console.log('3. Configuration File:');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, 'newrelic.js');
if (fs.existsSync(configPath)) {
  console.log('   ✓ newrelic.js exists');
  try {
    const config = require('./newrelic.js');
    console.log('   App Name:', config.config.app_name);
    console.log('   License Key:', config.config.license_key ? 'SET' : 'NOT SET');
    console.log('   Distributed Tracing:', config.config.distributed_tracing?.enabled ? 'Enabled' : 'Disabled');
  } catch (e) {
    console.log('   ✗ Error loading config:', e.message);
  }
} else {
  console.log('   ✗ newrelic.js NOT found');
}
console.log('');

// Test New Relic initialization
console.log('4. New Relic Initialization Test:');
if (process.env.NEW_RELIC_LICENSE_KEY) {
  try {
    require('newrelic');
    console.log('   ✓ New Relic loaded successfully');
    console.log('   ✓ Agent should be sending data to New Relic');
  } catch (e) {
    console.log('   ✗ Error loading New Relic:', e.message);
  }
} else {
  console.log('   ⚠ NEW_RELIC_LICENSE_KEY not set - New Relic will not load');
}
console.log('');

// Summary
console.log('=== Summary ===');
if (process.env.NEW_RELIC_LICENSE_KEY && fs.existsSync(configPath)) {
  console.log('✓ Setup looks correct!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Make sure your server is running');
  console.log('2. Make some API requests to generate data');
  console.log('3. Wait 1-2 minutes for data to appear');
  console.log('4. Go to: https://one.newrelic.com/');
  console.log('5. Navigate to: APM & Services > Applications');
  console.log('6. Look for application: "Anuj"');
} else {
  console.log('⚠ Setup incomplete - check the issues above');
}

