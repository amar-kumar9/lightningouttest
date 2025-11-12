require('dotenv').config();
const express = require('express');
const axios = require('axios');
const session = require('express-session');
const qs = require('qs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

const SF_CLIENT_ID = process.env.SF_CLIENT_ID;
const SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET;
// Normalize APP_URL to lowercase to avoid case-sensitivity issues
const APP_URL = (process.env.APP_URL || process.env.REPLIT_HOST || `http://localhost:${PORT}`).toLowerCase();
const SESSION_SECRET = process.env.SESSION_SECRET;
const SF_LOGIN_URL = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';

if (!SESSION_SECRET) {
  console.error('ERROR: SESSION_SECRET environment variable is required for secure session management');
  process.exit(1);
}

// Trust proxy for Render (needed for secure cookies behind proxy)
app.set('trust proxy', 1);

app.use(session({
  secret: SESSION_SECRET,
  resave: true, // Changed to true to help with session persistence
  saveUninitialized: true, // Changed to true to ensure session is created
  name: 'lightningout.sid', // Custom session name
  rolling: true, // Reset expiration on activity
  cookie: {
    secure: true, // Always true for HTTPS (Render provides HTTPS)
    httpOnly: true,
    maxAge: 30 * 60 * 1000, // 30 minutes (shorter for OAuth flow)
    sameSite: 'lax',
    // Don't set domain - let browser handle it automatically
    path: '/', // Ensure cookie is available for all paths
  },
  // For Render: sessions are stored in memory
  // Note: If app restarts, sessions are lost (this is expected on free tier)
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware for session/cookie issues
app.use((req, res, next) => {
  if (req.path === '/oauth/callback' || req.path === '/login') {
    console.log('Request debug:', {
      path: req.path,
      method: req.method,
      hasCookies: !!req.headers.cookie,
      cookieHeader: req.headers.cookie ? 'present' : 'missing',
      sessionId: req.sessionID,
      userAgent: req.headers['user-agent']?.substring(0, 50)
    });
  }
  next();
});

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
            ${!SF_CLIENT_ID || !SF_CLIENT_SECRET || !APP_URL || APP_URL.includes('localhost') ? `
          <div class="status">
            <strong>⚠️ Configuration Required:</strong><br>
            Please configure the following environment variables:<br>
            • SF_CLIENT_ID<br>
            • SF_CLIENT_SECRET<br>
            • APP_URL (your HTTPS endpoint URL)<br>
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `);
});

app.get('/login', (req, res) => {
  if (!SF_CLIENT_ID || !APP_URL) {
    return res.status(500).send('Missing SF_CLIENT_ID or APP_URL configuration');
  }

  // Regenerate session to ensure we have a fresh session ID
  req.session.regenerate((err) => {
    if (err) {
      console.error('Session regeneration error:', err);
      return res.status(500).send('Session error - please try again');
    }

    const state = crypto.randomBytes(32).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    
    req.session.oauthState = state;
    req.session.codeVerifier = codeVerifier;
    
    // Force save session before redirect
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).send('Session error - please try again');
      }

      const redirectUri = `${APP_URL}/oauth/callback`;
      console.log('DEBUG: Login initiated:', {
        redirectUri: redirectUri,
        appUrl: APP_URL,
        state: state,
        sessionId: req.sessionID,
        hasCodeVerifier: !!codeVerifier,
        cookieSet: !!req.headers.cookie
      });
      
      const authUrl = `${SF_LOGIN_URL}/services/oauth2/authorize?` +
        `response_type=code&` +
        `client_id=${encodeURIComponent(SF_CLIENT_ID)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${encodeURIComponent(state)}&` +
        `code_challenge=${encodeURIComponent(codeChallenge)}&` +
        `code_challenge_method=S256`;

      console.log('DEBUG: Full auth URL:', authUrl);
      res.redirect(authUrl);
    });
  });
});
  

app.get('/oauth/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send('No authorization code received');
  }

  // Debug session state
  console.log('DEBUG: Callback received:', {
    hasSession: !!req.session,
    sessionId: req.sessionID,
    sessionState: req.session?.oauthState,
    receivedState: state,
    statesMatch: state === req.session?.oauthState,
    hasCodeVerifier: !!req.session?.codeVerifier,
    cookies: req.headers.cookie ? 'present' : 'missing',
    allSessionKeys: req.session ? Object.keys(req.session) : []
  });

  if (!state || !req.session.oauthState || state !== req.session.oauthState) {
    console.error('State mismatch:', {
      received: state,
      expected: req.session.oauthState,
      sessionId: req.sessionID
    });
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Authentication Error</title></head>
      <body style="font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px;">
        <h1>Authentication Error</h1>
        <p><strong>Invalid state parameter</strong> - This usually happens if:</p>
        <ul>
          <li>The session expired or was lost</li>
          <li>You're using a different browser or incognito mode</li>
          <li>The app restarted between login and callback</li>
        </ul>
        <p><a href="/login">Try logging in again</a></p>
        <details style="margin-top: 20px; padding: 10px; background: #f5f5f5;">
          <summary>Debug Info</summary>
          <pre style="font-size: 12px;">Received State: ${state || 'none'}
Expected State: ${req.session?.oauthState || 'none'}
Session ID: ${req.sessionID || 'none'}</pre>
        </details>
      </body>
      </html>
    `);
  }

  const codeVerifier = req.session.codeVerifier;
  
  delete req.session.oauthState;
  delete req.session.codeVerifier;

  try {
    const redirectUri = `${APP_URL}/oauth/callback`;
    const tokenResponse = await axios.post(
      `${SF_LOGIN_URL}/services/oauth2/token`,
      qs.stringify({
        grant_type: 'authorization_code',
        code: code,
        client_id: SF_CLIENT_ID,
        client_secret: SF_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
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
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      redirectUri: redirectUri,
      hasCodeVerifier: !!codeVerifier
    });
    
    const errorMessage = error.response?.data?.error_description || error.message;
    const errorCode = error.response?.data?.error || 'unknown_error';
    
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Failed</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          .error { background: #fee; border: 1px solid #fcc; padding: 15px; border-radius: 4px; }
          .details { background: #f9f9f9; padding: 10px; margin-top: 10px; font-family: monospace; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Authentication Failed</h1>
        <div class="error">
          <strong>Error:</strong> ${errorMessage}<br>
          <strong>Error Code:</strong> ${errorCode}
        </div>
        <div class="details">
          <strong>Debug Info:</strong><br>
          Redirect URI: ${redirectUri}<br>
          Has Code Verifier: ${codeVerifier ? 'Yes' : 'No'}<br>
          Status: ${error.response?.status || 'N/A'}
        </div>
        <p><a href="/login">Try Again</a> | <a href="/">Go Home</a></p>
      </body>
      </html>
    `);
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
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    res.redirect('/');
  });
});

// Health check endpoint for hosting platforms
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Configuration status:');
  console.log(`  SF_CLIENT_ID: ${SF_CLIENT_ID ? '✓ Set' : '✗ Missing'}`);
  console.log(`  SF_CLIENT_SECRET: ${SF_CLIENT_SECRET ? '✓ Set' : '✗ Missing'}`);
  console.log(`  APP_URL: ${APP_URL ? '✓ Set' : '✗ Missing'}`);
  console.log(`  SESSION_SECRET: ${SESSION_SECRET ? '✓ Set' : '✗ Missing'}`);
});
