// Simple debug script to test the dashboard endpoint
import http from 'http';

console.log('Testing dashboard endpoint...');

const options = {
  hostname: 'localhost',
  port: 8082,
  path: '/dashboard',
  method: 'GET',
  headers: {
    'User-Agent': 'Debug-Script/1.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n--- Response Body (first 1000 chars) ---');
    console.log(data.substring(0, 1000));

    // Check if it's serving the React app
    if (data.includes('id="root"')) {
      console.log('\n✓ React app container found');
    } else {
      console.log('\n✗ React app container NOT found');
    }

    if (data.includes('main.tsx')) {
      console.log('✓ Main script reference found');
    } else {
      console.log('✗ Main script reference NOT found');
    }

    if (data.includes('/@vite/client')) {
      console.log('✓ Vite client found (development mode)');
    } else {
      console.log('✗ Vite client NOT found');
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.end();