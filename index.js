const express = require('express');
const axios = require('axios');
const cookieSession = require('cookie-session');
const qs = require('qs');

const app = express();
const PORT = process.env.PORT || 5000;

const SF_CLIENT_ID = process.env.SF_CLIENT_ID;
const SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET;
const REPLIT_HOST = process.env.REPLIT_HOST;
const SESSION_SECRET = process.env.SESSION_SECRET || 'default-secret-key';
const SF_LOGIN_URL = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';

app.use(cookieSession({
  name: 'session',
  keys: [SESSION_SECRET],
  maxAge: 24 * 60 * 60 * 1000
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Salesforce Lightning Out App</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
          text-align: center;
        }
        h1 {
          color: #032d60;
          margin-bottom: 20px;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          background: #0176d3;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          transition: background 0.2s;
        }
        .btn:hover {
          background: #014486;
        }
        .status {
          margin-top: 20px;
          padding: 10px;
          background: #fef7e5;
          border-left: 4px solid #ffb75d;
          text-align: left;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Salesforce Lightning Out Application</h1>
        <p>This application hosts Salesforce Lightning Web Components using Lightning Out.</p>
        <p><a href="/login" class="btn">Login with Salesforce</a></p>
        ${!SF_CLIENT_ID || !SF_CLIENT_SECRET || !REPLIT_HOST ? `
          <div class="status">
            <strong>⚠️ Configuration Required:</strong><br>
            Please configure the following environment secrets:<br>
            • SF_CLIENT_ID<br>
            • SF_CLIENT_SECRET<br>
            • REPLIT_HOST<br>
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `);
});

app.get('/login', (req, res) => {
  if (!SF_CLIENT_ID || !REPLIT_HOST) {
    return res.status(500).send('Missing SF_CLIENT_ID or REPLIT_HOST configuration');
  }

  const redirectUri = `${REPLIT_HOST}/oauth/callback`;
  const authUrl = `${SF_LOGIN_URL}/services/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${encodeURIComponent(SF_CLIENT_ID)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}`;

  res.redirect(authUrl);
});

app.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('No authorization code received');
  }

  try {
    const redirectUri = `${REPLIT_HOST}/oauth/callback`;
    const tokenResponse = await axios.post(
      `${SF_LOGIN_URL}/services/oauth2/token`,
      qs.stringify({
        grant_type: 'authorization_code',
        code: code,
        client_id: SF_CLIENT_ID,
        client_secret: SF_CLIENT_SECRET,
        redirect_uri: redirectUri
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    req.session.accessToken = tokenResponse.data.access_token;
    req.session.instanceUrl = tokenResponse.data.instance_url;
    req.session.refreshToken = tokenResponse.data.refresh_token;

    res.redirect('/app');
  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    res.status(500).send(`Authentication failed: ${error.response?.data?.error_description || error.message}`);
  }
});

app.get('/app', (req, res) => {
  if (!req.session.accessToken || !req.session.instanceUrl) {
    return res.redirect('/login');
  }

  const { accessToken, instanceUrl } = req.session;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Lightning Out App</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: #f4f6f9;
        }
        .header {
          background: white;
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
          margin: 0 0 10px 0;
          color: #032d60;
        }
        .logout-btn {
          display: inline-block;
          padding: 8px 16px;
          background: #706e6b;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-size: 14px;
        }
        .logout-btn:hover {
          background: #514f4d;
        }
        .component-container {
          background: white;
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .component-container h2 {
          margin-top: 0;
          color: #032d60;
          border-bottom: 2px solid #0176d3;
          padding-bottom: 10px;
        }
        .loading {
          color: #706e6b;
          font-style: italic;
        }
      </style>
      <script type="text/javascript" src="${instanceUrl}/lightning/lightning.out.js"></script>
    </head>
    <body>
      <div class="header">
        <h1>Salesforce Lightning Out Application</h1>
        <a href="/logout" class="logout-btn">Logout</a>
      </div>

      <div class="component-container">
        <h2>Case List</h2>
        <div id="caseListContainer" class="loading">Loading Case List component...</div>
      </div>

      <div class="component-container">
        <h2>Case Detail</h2>
        <div id="caseDetailContainer" class="loading">Loading Case Detail component...</div>
      </div>

      <div class="component-container">
        <h2>Case Comments</h2>
        <div id="caseCommentsContainer" class="loading">Loading Case Comments component...</div>
      </div>

      <script>
        const accessToken = '${accessToken}';
        const instanceUrl = '${instanceUrl}';

        $Lightning.use(
          "c:lightningOutApp",
          function() {
            console.log('Lightning Out app initialized');
            
            $Lightning.createComponent(
              "c:caseList",
              {},
              "caseListContainer",
              function(cmp) {
                console.log('Case List component created');
              }
            );

            $Lightning.createComponent(
              "c:caseDetail",
              {},
              "caseDetailContainer",
              function(cmp) {
                console.log('Case Detail component created');
              }
            );

            $Lightning.createComponent(
              "c:caseComments",
              {},
              "caseCommentsContainer",
              function(cmp) {
                console.log('Case Comments component created');
              }
            );
          },
          instanceUrl,
          accessToken
        );
      </script>
    </body>
    </html>
  `);
});

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Configuration status:');
  console.log(`  SF_CLIENT_ID: ${SF_CLIENT_ID ? '✓ Set' : '✗ Missing'}`);
  console.log(`  SF_CLIENT_SECRET: ${SF_CLIENT_SECRET ? '✓ Set' : '✗ Missing'}`);
  console.log(`  REPLIT_HOST: ${REPLIT_HOST ? '✓ Set' : '✗ Missing'}`);
  console.log(`  SESSION_SECRET: ${SESSION_SECRET ? '✓ Set' : '✗ Missing'}`);
});
