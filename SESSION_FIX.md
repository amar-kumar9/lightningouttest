# Session Persistence Fix

## Problem Identified

The session was not persisting between the `/login` request and the `/oauth/callback` request. The logs showed:

- **Login**: Creates session with ID `oJIZbA6a75289utMt3UHlneLBtVSGiA0`
- **Callback**: Receives different session ID `AMVRbGWaBObu0SMHjVBuoR5vicZ_ZzKJ`
- **Result**: `sessionState: undefined` - session data lost

## Root Cause

The session cookie was not being properly sent/received, likely due to:
1. **Proxy trust issue**: Render uses a proxy, and Express needs to trust it for secure cookies
2. **Session configuration**: Settings were too restrictive
3. **Cookie not being set**: The redirect to Salesforce might have prevented cookie from being set

## Fixes Applied

### 1. Trust Proxy (Critical for Render)
```javascript
app.set('trust proxy', 1);
```
This tells Express that it's behind a proxy (Render) and to trust the `X-Forwarded-*` headers for secure cookies.

### 2. Improved Session Configuration
```javascript
resave: true,           // Save session even if not modified
saveUninitialized: true, // Create session even if empty
rolling: true,          // Reset expiration on activity
secure: true,           // Always secure for HTTPS
path: '/',              // Available for all paths
```

### 3. Explicit Session Management
- Regenerate session on login to ensure fresh session
- Explicitly save session before redirect
- Better error handling for session operations

### 4. Enhanced Debugging
- Log cookie presence on each request
- Log session ID changes
- Log all session keys to see what's stored

## What to Check After Deployment

1. **Wait for Render to deploy** (2-3 minutes after push)

2. **Check Render logs** for:
   ```
   Request debug: { hasCookies: true, ... }
   DEBUG: Login initiated: { sessionId: 'xxx', cookieSet: true }
   DEBUG: Callback received: { cookies: 'present', sessionId: 'xxx', ... }
   ```

3. **Key indicators of success**:
   - `hasCookies: true` on callback request
   - Same `sessionId` on login and callback
   - `sessionState` is NOT undefined on callback
   - `statesMatch: true` on callback

4. **If still failing**, check:
   - Are cookies being sent? Look for `cookies: 'present'` in logs
   - Is session ID the same? Compare `sessionId` in login vs callback
   - Are there any cookie-related errors in browser console?

## Browser Testing

1. **Clear all cookies** for `lotest.onrender.com`
2. **Use regular browsing mode** (not incognito initially)
3. **Check browser DevTools**:
   - Application → Cookies → `lotest.onrender.com`
   - Should see `lightningout.sid` cookie
   - Should be `Secure`, `HttpOnly`, `SameSite=Lax`

## If Still Not Working

### Option 1: Try Different SameSite Setting
If `sameSite: 'lax'` doesn't work, we might need `sameSite: 'none'` (requires `secure: true` which we have).

### Option 2: Check Render Instance
Render free tier should be single instance, but verify:
- Go to Render dashboard → Your service
- Check if it shows "1 instance" or multiple
- Multiple instances would require Redis for session sharing

### Option 3: Temporary Workaround
As a last resort, we could store the state in a database or use a different session store, but the current fix should work.

## Expected Behavior After Fix

1. User clicks "Login with Salesforce"
2. Session is created with `oauthState` and `codeVerifier`
3. User is redirected to Salesforce
4. User authorizes and Salesforce redirects back
5. **Same session is retrieved** (same session ID)
6. `oauthState` matches → OAuth succeeds
7. User is redirected to `/app`

The key is that the session ID should be **the same** on both login and callback requests.

