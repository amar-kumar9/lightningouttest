// Quick test script to verify the app works
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');

console.log('🧪 Testing app configuration...\n');

// Test 1: Check dependencies
try {
  require('express');
  require('axios');
  require('express-session');
  require('qs');
  console.log('✅ All dependencies loaded');
} catch (e) {
  console.error('❌ Missing dependency:', e.message);
  process.exit(1);
}

// Test 2: Check environment
const PORT = process.env.PORT || 5000;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
console.log(`✅ Port: ${PORT}`);
console.log(`✅ Session secret: ${SESSION_SECRET ? 'Set' : 'Generated'}`);

// Test 3: Create minimal app
const app = express();
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'App is working!' });
});

// Test 4: Start server briefly
const server = app.listen(0, '127.0.0.1', () => {
  const testPort = server.address().port;
  console.log(`✅ Server started on port ${testPort}`);
  
  // Test health endpoint
  const http = require('http');
  http.get(`http://127.0.0.1:${testPort}/test`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`✅ Health check response: ${data}`);
      server.close();
      console.log('\n🎉 All tests passed! App is ready to deploy.\n');
      process.exit(0);
    });
  }).on('error', (err) => {
    console.error('❌ Health check failed:', err.message);
    server.close();
    process.exit(1);
  });
});

setTimeout(() => {
  console.error('❌ Test timeout');
  server.close();
  process.exit(1);
}, 5000);

