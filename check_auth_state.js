const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3006,
  path: '/api/auth/profile',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`Body: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('Profile request completed');
    
    if (res.statusCode === 401) {
      console.log('\n✅ GOOD: User is NOT logged in - login screen should appear');
    } else if (res.statusCode === 200) {
      console.log('\n❌ User is logged in - that\'s why you see the main game interface');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();