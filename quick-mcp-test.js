#!/usr/bin/env node

/**
 * Quick MCP Status Test
 * Just test if the MCP endpoints are working
 */

const http = require('http');

async function testMCPStatus() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/mcp',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('🔍 Testing MCP endpoint...');
  
  try {
    const result = await testMCPStatus();
    
    if (result.status === 401) {
      console.log('❌ Authentication required (expected without session)');
      console.log('✅ MCP endpoint is accessible - ready for authenticated testing!');
      return;
    }
    
    if (result.status === 200) {
      console.log('✅ MCP endpoint working!');
      console.log(`📊 Found ${result.data.totalServices} services with ${result.data.totalFunctions} functions`);
      
      if (result.data.services) {
        result.data.services.forEach(service => {
          console.log(`  - ${service.name}: ${service.functionCount} functions`);
        });
      }
    } else {
      console.log(`❌ MCP endpoint returned status ${result.status}`);
      console.log('Response:', result.data);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to localhost:3001');
      console.log('💡 Make sure your dev server is running: npm run dev');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

run();