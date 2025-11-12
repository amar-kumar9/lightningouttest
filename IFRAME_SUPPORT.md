# Iframe Support Configuration

## ✅ Iframe Support Enabled

Your application now supports iframe embedding with proper security headers and cookie configuration.

## What Was Configured

### 1. Content Security Policy (CSP)
- Allows iframe embedding from any origin (`frame-ancestors 'self' *`)
- Allows Salesforce scripts and resources
- Secure default policies

### 2. Cookie Configuration
- `sameSite: 'none'` - Required for cross-origin iframes
- `secure: true` - Required when using `sameSite: 'none'`
- Works with HTTPS (Render provides this automatically)

### 3. Security Headers
- Proper CSP headers for iframe embedding
- X-Content-Type-Options for security
- Referrer-Policy for privacy

## How to Embed in Iframe

### Basic Embedding

```html
<iframe 
  src="https://lotest.onrender.com/app" 
  width="100%" 
  height="600px"
  frameborder="0"
  allow="clipboard-read; clipboard-write"
></iframe>
```

### With Authentication

**Important**: The user must be logged in first!

**Option 1: Login in parent page, then embed**
```html
<!-- Step 1: User logs in -->
<a href="https://lotest.onrender.com/login" target="_blank">Login to Salesforce</a>

<!-- Step 2: After login, embed the app -->
<iframe 
  src="https://lotest.onrender.com/app" 
  width="100%" 
  height="600px"
></iframe>
```

**Option 2: Embed login page, then redirect**
```html
<!-- Embed login page first -->
<iframe 
  src="https://lotest.onrender.com/login" 
  width="100%" 
  height="600px"
  id="sfFrame"
></iframe>

<script>
// After login, the iframe will redirect to /app automatically
// Or you can manually change the src after detecting login success
document.getElementById('sfFrame').onload = function() {
  // Check if login was successful and update src
  if (this.contentWindow.location.pathname === '/app') {
    // Already on app page
  }
};
</script>
```

### Full Page Embedding

```html
<!DOCTYPE html>
<html>
<head>
  <title>Embedded Lightning Out App</title>
  <style>
    body { margin: 0; padding: 0; }
    iframe {
      width: 100vw;
      height: 100vh;
      border: none;
    }
  </style>
</head>
<body>
  <iframe 
    src="https://lotest.onrender.com/app"
    allow="clipboard-read; clipboard-write"
  ></iframe>
</body>
</html>
```

## Browser Requirements

### Third-Party Cookies

For cross-origin iframes to work properly, browsers need to allow third-party cookies:

**Chrome/Edge:**
1. Settings → Privacy and security → Cookies and other site data
2. Allow all cookies (or add exception for your domain)

**Firefox:**
1. Settings → Privacy & Security
2. Under "Cookies and Site Data", select "Accept cookies and site data from websites"

**Safari:**
1. Preferences → Privacy
2. Uncheck "Prevent cross-site tracking" (or add exception)

**Note**: Some browsers are moving away from third-party cookies. For production, consider:
- Using same-origin iframes (embed from same domain)
- Using postMessage API for communication
- Using OAuth popup flow instead of iframe

## Security Considerations

### Current Configuration
- ✅ HTTPS required (Render provides this)
- ✅ Secure cookies (`secure: true`)
- ✅ HttpOnly cookies (prevents XSS)
- ✅ CSP headers configured
- ✅ Allows embedding from any origin

### For Production

If you want to restrict embedding to specific domains:

**Update CSP in `index.js`:**
```javascript
const allowedOrigins = [
  'https://yourdomain.com',
  'https://app.yourdomain.com'
].join(' ');

const csp = `frame-ancestors 'self' ${allowedOrigins}; ...`;
```

## Testing Iframe Embedding

### Test 1: Basic Embedding
1. Create a test HTML file:
```html
<iframe src="https://lotest.onrender.com/app" width="800" height="600"></iframe>
```
2. Open in browser
3. Should see login page or app (if already logged in)

### Test 2: Cross-Origin Embedding
1. Host the HTML file on a different domain
2. Embed the iframe
3. Check browser console for cookie/CORS issues
4. Verify components load

### Test 3: Authentication Flow
1. Embed login page: `https://lotest.onrender.com/login`
2. Complete OAuth flow
3. Should redirect to `/app` within iframe
4. Components should load

## Common Issues

### Issue: Cookies Not Working in Iframe

**Symptoms:**
- Session not persisting
- Redirect loops
- "Invalid session" errors

**Solutions:**
1. ✅ Already configured: `sameSite: 'none'` and `secure: true`
2. Enable third-party cookies in browser
3. Check that HTTPS is working (Render provides this)
4. Verify cookies are being set (check DevTools → Application → Cookies)

### Issue: X-Frame-Options Blocking

**Symptoms:**
- Iframe shows blank page
- Console error about X-Frame-Options

**Solution:**
- ✅ Already fixed: We don't set `X-Frame-Options: DENY`
- CSP `frame-ancestors` is used instead (more flexible)

### Issue: CSP Violations

**Symptoms:**
- Resources not loading
- Console CSP errors

**Solution:**
- ✅ Already configured: CSP allows Salesforce resources
- Check browser console for specific violations
- Update CSP if needed for additional resources

## Salesforce Lightning Out in Iframes

Lightning Out is designed to work in iframes. The configuration ensures:
- ✅ Proper cookie handling for cross-origin
- ✅ Security headers that allow embedding
- ✅ HTTPS for secure cookies
- ✅ CORS handling (Salesforce handles this)

## Example: Embedding in Salesforce Community

You can embed this app in a Salesforce Community:

1. Create a Visualforce page or Lightning component
2. Use iframe to embed:
```html
<iframe 
  src="https://lotest.onrender.com/app" 
  width="100%" 
  height="600px"
></iframe>
```

## Example: Embedding in External Website

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App with Lightning Out</title>
</head>
<body>
  <h1>My Application</h1>
  
  <div style="border: 1px solid #ccc; padding: 10px;">
    <h2>Salesforce Components</h2>
    <iframe 
      src="https://lotest.onrender.com/app"
      width="100%"
      height="600px"
      frameborder="0"
      allow="clipboard-read; clipboard-write"
    ></iframe>
  </div>
</body>
</html>
```

## API Endpoints for Iframe

All endpoints support iframe embedding:
- `/` - Home page
- `/login` - Login page (OAuth flow works in iframe)
- `/app` - Main application with Lightning components
- `/logout` - Logout (clears session)

## Next Steps

1. ✅ **Iframe support is enabled** - No additional configuration needed
2. **Test embedding** - Create a test HTML page and embed
3. **Configure browser** - Enable third-party cookies if needed
4. **Deploy** - Changes are already pushed and will auto-deploy

Your app is now ready to be embedded in iframes! 🎉

