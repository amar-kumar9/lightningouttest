require('dotenv').config();
const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// Generate session secret if not provided
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Salesforce Lightning Out App - Development Mode</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: #f4f6f9;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #032d60; }
        .status {
          margin: 20px 0;
          padding: 15px;
          background: #e8f4fd;
          border-left: 4px solid #0176d3;
          border-radius: 4px;
        }
        .config-item {
          margin: 10px 0;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
          font-family: monospace;
        }
        .missing { background: #fef7e5; border-left-color: #ffb75d; }
        .present { background: #e8f5e8; border-left-color: #4caf50; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 Salesforce Lightning Out Application</h1>
        <p>Development server is running successfully!</p>
        
        <div class="status">
          <h3>Configuration Status:</h3>
          <div class="config-item ${process.env.SF_CLIENT_ID ? 'present' : 'missing'}">
            SF_CLIENT_ID: ${process.env.SF_CLIENT_ID ? '✅ Configured' : '❌ Missing'}
          </div>
          <div class="config-item ${process.env.SF_CLIENT_SECRET ? 'present' : 'missing'}">
            SF_CLIENT_SECRET: ${process.env.SF_CLIENT_SECRET ? '✅ Configured' : '❌ Missing'}
          </div>
          <div class="config-item ${process.env.APP_URL || process.env.REPLIT_HOST ? 'present' : 'missing'}">
            APP_URL: ${process.env.APP_URL || process.env.REPLIT_HOST || 'http://localhost:5000'} ${process.env.APP_URL || process.env.REPLIT_HOST ? '✅' : '⚠️ Using default'}
          </div>
          <div class="config-item present">
            SESSION_SECRET: ✅ Generated/Configured
          </div>
        </div>

        <h3>Next Steps:</h3>
        <ol>
          <li>Set up your Salesforce Connected App</li>
          <li>Add SF_CLIENT_ID and SF_CLIENT_SECRET to your .env file</li>
          <li>Create Lightning Web Components in Salesforce</li>
          <li>Run the full application with: <code>npm start</code></li>
        </ol>

        <p><strong>Server running on:</strong> <a href="http://localhost:${PORT}">http://localhost:${PORT}</a></p>
      </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Development server running on port ${PORT}`);
  console.log(`📱 Open: http://localhost:${PORT}`);
  console.log('\n📋 Configuration status:');
  console.log(`  SF_CLIENT_ID: ${process.env.SF_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`  SF_CLIENT_SECRET: ${process.env.SF_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`  APP_URL: ${process.env.APP_URL || process.env.REPLIT_HOST || 'http://localhost:5000'} ${process.env.APP_URL || process.env.REPLIT_HOST ? '✅' : '⚠️ Default'}`);
  console.log(`  SESSION_SECRET: ✅ Available`);
});