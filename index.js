// index.js

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
const APP_URL = (process.env.APP_URL || process.env.REPLIT_HOST || `http://localhost:${PORT}`).toLowerCase();
const SESSION_SECRET = process.env.SESSION_SECRET;
const SF_LOGIN_URL = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';

if (!SESSION_SECRET) {
  console.error('ERROR: SESSION_SECRET environment variable is required for secure session management');
  process.exit(1);
}

app.set('trust proxy', 1);

app.use(session({
  secret: SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  name: 'lightningout.sid',
  rolling: true,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 30 * 60 * 1000,
    sameSite: 'none',
    path: '/',
  },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CSP & iframe middleware
app.use((req, res, next) => {
  const csp = [
    "frame-ancestors 'self' *",
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.salesforce.com https://*.force.com",
    "style-src 'self' 'unsafe-inline' https://*.salesforce.com https://*.force.com",
    "img-src 'self' data: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https://*.salesforce.com https://*.force.com https://login.salesforce.com"
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);
  next();
});

// Helper for token refresh
async function refreshAccessToken(refreshToken) {
  try {
    const tokenResponse = await axios.post(
      `${SF_LOGIN_URL}/services/oauth2/token`,
      qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: SF_CLIENT_ID,
        client_secret: SF_CLIENT_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return {
      accessToken: tokenResponse.data.access_token,
      instanceUrl: tokenResponse.data.instance_url,
      refreshToken: tokenResponse.data.refresh_token || refreshToken
    };
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    throw error;
  }
}

// Debug log middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/oauth')) {
    console.log('SessionID:', req.sessionID, 'Cookies:', req.headers.cookie ? 'Y' : 'N');
  }
  next();
});

// Home page
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
  <html>
  <head><title>Salesforce Lightning Out App</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #f4f6f9; }
    .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
    h1 { color: #032d60; margin-bottom: 20px; }
    .btn { display: inline-block; padding: 12px 24px; background: #0176d3; color: white; border-radius: 4px; font-weight: 600; text-decoration: none; }
    .btn:hover { background: #014486; }
  </style>
  </head><body>
  <div class="container">
    <h1>Salesforce Lightning Out Application</h1>
    <p>This application hosts Salesforce Lightning Web Components using Lightning Out 2.0.</p>
    <p><a href="/login" class="btn">Login with Salesforce</a></p>
  </div>
  </body></html>`);
});

// Login (OAuth 2.0 PKCE)
app.get('/login', (req, res) => {
  if (!SF_CLIENT_ID || !APP_URL) return res.status(500).send('Missing configuration');

  req.session.regenerate(err => {
    if (err) return res.status(500).send('Session error');

    const state = crypto.randomBytes(32).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    req.session.oauthState = state;
    req.session.codeVerifier = codeVerifier;

    req.session.save(err => {
      if (err) return res.status(500).send('Session error');

      const redirectUri = `${APP_URL}/oauth/callback`;
      const authUrl = `${SF_LOGIN_URL}/services/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(SF_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`;

      res.redirect(authUrl);
    });
  });
});

// OAuth callback
app.get('/oauth/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code) return res.status(400).send('No authorization code');

  if (!state || state !== req.session?.oauthState) {
    return res.status(403).send('Invalid session or state parameter');
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
        code,
        client_id: SF_CLIENT_ID,
        client_secret: SF_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    req.session.accessToken = tokenResponse.data.access_token;
    req.session.instanceUrl = tokenResponse.data.instance_url;
    req.session.refreshToken = tokenResponse.data.refresh_token;

    res.redirect('/app');
  } catch (error) {
    res.status(500).send('Auth Error: ' + (error.response?.data?.error_description || error.message));
  }
});

// Middleware for token enforcement
async function ensureValidToken(req, res, next) {
  if (!req.session.accessToken || !req.session.instanceUrl) return res.redirect('/login');
  next();
}

// Lightning Out 2.0 host page
app.get('/app', ensureValidToken, (req, res) => {
  const { accessToken, instanceUrl } = req.session;

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Lightning Out App</title>
      <script type="text/javascript" async src="${instanceUrl}/lightning/lightning.out.latest/index.iife.prod.js"></script>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f4f6f9; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .component-container { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Salesforce Lightning Out 2.0 Application</h1>
        <a href="/logout">Logout</a>
      </div>
      <lightning-out-application 
        components="c-case-list"
        instance-url="${instanceUrl}"
        access-token="${accessToken}">
      </lightning-out-application>
    </body>
    </html>
  `);
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => res.redirect('/'));
});

// Token refresh endpoint
app.get('/refresh-token', async (req, res) => {
  if (!req.session.refreshToken) return res.redirect('/login');

  try {
    const tokens = await refreshAccessToken(req.session.refreshToken);
    req.session.accessToken = tokens.accessToken;
    req.session.instanceUrl = tokens.instanceUrl;
    if (tokens.refreshToken) req.session.refreshToken = tokens.refreshToken;

    res.redirect(req.query.redirect || '/app');
  } catch (error) {
    req.session.destroy(() => res.redirect('/login?error=session_expired'));
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`  SF_CLIENT_ID: ${SF_CLIENT_ID ? '✓ Set' : '✗ Missing'}`);
  console.log(`  APP_URL: ${APP_URL ? '✓ Set' : '✗ Missing'}`);
});
