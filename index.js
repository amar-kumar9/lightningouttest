// index.js
// Secure, production-ready Lightning Out 2.0 host template
// - resolves merge conflicts
// - avoids exposing tokens in DOM attributes or console
// - uses safer session defaults and shows placeholder for Redis store
// - conditional secure cookie for local development
// - uses helmet for common security headers
// - tighter CSP (adjust hosts as needed)

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const session = require('express-session');
const qs = require('qs');
const crypto = require('crypto');
const helmet = require('helmet');
// const RedisStore = require('connect-redis')(session); // uncomment when using Redis
// const redisClient = require('./redisClient'); // implement your redis client

const app = express();
const PORT = process.env.PORT || 5000;

const SF_CLIENT_ID = process.env.SF_CLIENT_ID;
const SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET;
const APP_URL = (process.env.APP_URL || process.env.REPLIT_HOST || `http://localhost:${PORT}`).toLowerCase();
const SESSION_SECRET = process.env.SESSION_SECRET;
const SF_LOGIN_URL = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!SESSION_SECRET) {
  console.error('ERROR: SESSION_SECRET environment variable is required for secure session management');
  process.exit(1);
}

app.set('trust proxy', 1); // if behind proxy / load balancer

// Security middleware
app.use(helmet());

// Tightened CSP — list allowed hosts explicitly. Update with your actual domains.
const allowedFrameAncestors = ["'self'", 'https://your-frontend.example.com', 'https://*.salesforce.com'];
const csp = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://*.salesforce.com', 'https://*.force.com'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://*.salesforce.com', 'https://*.force.com'],
    imgSrc: ["'self'", 'data:', 'https:'],
    fontSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://*.salesforce.com', 'https://*.force.com', SF_LOGIN_URL],
    frameAncestors: allowedFrameAncestors,
  }
};
app.use((req, res, next) => {
  // merge helmet's CSP with our custom-ish header (helmet already sets it but being explicit here)
  const headerValue = [
    `frame-ancestors ${allowedFrameAncestors.join(' ')}`,
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.salesforce.com https://*.force.com",
    "style-src 'self' 'unsafe-inline' https://*.salesforce.com https://*.force.com",
    "img-src 'self' data: https:",
    "font-src 'self' data: https:",
    `connect-src 'self' https://*.salesforce.com https://*.force.com ${SF_LOGIN_URL}`
  ].join('; ');
  res.setHeader('Content-Security-Policy', headerValue);
  // X-Frame-Options is handled by frame-ancestors in CSP. Keep other headers from helmet.
  next();
});

// Session configuration
const sessionOptions = {
  secret: SESSION_SECRET,
  name: 'lightningout.sid',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: NODE_ENV === 'production', // require HTTPS in production
    sameSite: 'none', // required for cross-site usage; ensure you're serving over HTTPS in prod
    maxAge: 30 * 60 * 1000,
    path: '/',
  },
};

// Uncomment and configure a persistent store for production
// sessionOptions.store = new RedisStore({ client: redisClient });

app.use(session(sessionOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
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

// Debug log middleware for oauth endpoints only — minimal and avoiding secrets
app.use((req, res, next) => {
  if (req.path.startsWith('/oauth')) {
    console.log('OAuth request:', req.method, req.path, 'sessionExists:', !!req.session);
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
        client_secret: SF_CLIENT_SECRET, // if using confidential server flow; safe on server
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    req.session.accessToken = tokenResponse.data.access_token;
    req.session.instanceUrl = tokenResponse.data.instance_url;
    req.session.refreshToken = tokenResponse.data.refresh_token;

    // Redirect to the app page
    res.redirect('/app');
  } catch (error) {
    console.error('Auth Error:', error.response?.data || error.message);
    res.status(500).send('Auth Error');
  }
});

// Provide minimal session details to the client via XHR (no tokens in DOM by server-render)
app.get('/session-info', (req, res) => {
  if (!req.session.accessToken || !req.session.instanceUrl) return res.status(401).json({ error: 'not_logged_in' });

  // We deliberately do not send the raw access token in server-rendered HTML. Client may request it via this endpoint.
  // NOTE: returning accessToken to client means client JS can use it. Protect this endpoint via session checks.

  res.json({
    instanceUrl: req.session.instanceUrl,
    // do not send accessToken here if you want stricter control — alternatives: server-side proxy for frontdoor
    // accessToken: req.session.accessToken
  });
});

// Middleware for token enforcement
async function ensureValidToken(req, res, next) {
  if (!req.session.accessToken || !req.session.instanceUrl) return res.redirect('/login');
  next();
}

// Lightning Out 2.0 host page
app.get('/app', ensureValidToken, (req, res) => {
  // Do NOT embed access token or sid into HTML attributes.
  // Client will fetch /session-info and then perform any dynamic initialization it needs.

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Lightning Out App</title>
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

      <div class="component-container">
        <p>Loading Salesforce components…</p>
        <!-- The lightning-out script will be added at runtime after we determine the instance URL. -->
        <div id="lout-root"></div>
      </div>

      <script>
        async function initLightningOut() {
          try {
            const r = await fetch('/session-info', { credentials: 'same-origin' });
            if (!r.ok) throw new Error('Not authenticated');
            const info = await r.json();

            // Dynamically load the Lightning Out script from the instance URL
            const scriptUrl = info.instanceUrl + '/lightning/lightning.out.latest/index.iife.prod.js';
            const s = document.createElement('script');
            s.src = scriptUrl;
            s.async = true;
            s.onload = () => {
              // Create lightning-out application element and initialize it.
              // IMPORTANT: We avoid placing tokens into attributes. If your LWC requires a frontdoor-based context,
              // consider implementing a server-side proxy endpoint that performs the frontdoor redirect and does not render the sid into the page.

              const appEl = document.createElement('lightning-out-application');
              appEl.setAttribute('components', 'c-case-list');
              // If your org requires a frontdoor URL, fetch a server-generated short-lived frontdoor URL from an endpoint instead
              // and set it programmatically here. Do NOT hardcode the SID in server-rendered HTML.

              document.getElementById('lout-root').appendChild(appEl);

              // Optional: listen for custom events
              document.addEventListener('lightning-out-error', function(event) {
                console.error('Lightning Out Error (client):', event.detail);
              });
              document.addEventListener('lightning-out-ready', function(event) {
                console.log('Lightning Out Ready');
              });
            };
            s.onerror = (e) => console.error('Failed to load Lightning Out script', e);
            document.head.appendChild(s);
          } catch (err) {
            console.error('Initialization error:', err);
            window.location = '/login';
          }
        }

        // Initialize after load
        window.addEventListener('load', initLightningOut);
      </script>
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
    console.error('Refresh token failed. Destroying session.');
    req.session.destroy(() => res.redirect('/login?error=session_expired'));
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Generic error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`  SF_CLIENT_ID: ${SF_CLIENT_ID ? '✓ Set' : '✗ Missing'}`);
  console.log(`  APP_URL: ${APP_URL ? '✓ Set' : '✗ Missing'}`);
  console.log(`  NODE_ENV: ${NODE_ENV}`);
});

