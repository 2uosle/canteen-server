// Test script to check if the API endpoint works
require('dotenv').config();
const fetch = require('node-fetch');

async function testVendorStats() {
  const API_BASE = 'http://localhost:3000';
  
  // You'll need a valid admin token - login first to get one
  // For now, let's test without auth to see the error
  
  console.log('Testing /admin/vendor-stats endpoint...\n');
  
  const start = '2025-10-22';
  const end = '2025-10-28';
  const url = `${API_BASE}/admin/vendor-stats?start=${start}&end=${end}`;
  
  console.log(`URL: ${url}\n`);
  
  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('\nResponse:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testVendorStats();
