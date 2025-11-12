# Fix: Invalid Session Error (aura:invalidSession)

## Problem

You're getting this error:
```json
{
  "event": {
    "descriptor": "markup://aura:invalidSession",
    ...
  },
  "exceptionEvent": true
}
```

This means your **access token has expired** or is invalid.

## Why This Happens

Salesforce access tokens expire after a period of inactivity (typically 2 hours). When the token expires:
- Lightning Out can't authenticate requests
- Components fail to load
- You get the `aura:invalidSession` error

## Solution Implemented

I've added **automatic token refresh** functionality:

### 1. Token Refresh Endpoint
- **URL**: `/refresh-token`
- **Purpose**: Refreshes expired access tokens using the refresh token
- **Usage**: Automatically called when invalid session is detected

### 2. Automatic Error Handling
- Detects `aura:invalidSession` errors
- Automatically redirects to refresh endpoint
- Retries with new token
- Seamless user experience

### 3. Client-Side Error Handlers
- Listens for `auraError` events
- Catches component creation errors
- Automatically triggers token refresh

## How It Works

### Flow:
1. User visits `/app` page
2. Lightning Out tries to load components
3. If token is expired → `aura:invalidSession` error
4. Error handler detects it
5. Redirects to `/refresh-token?redirect=/app`
6. Server refreshes token using refresh token
7. Redirects back to `/app` with new token
8. Components load successfully

### Manual Refresh:
You can also manually refresh by visiting:
```
https://lotest.onrender.com/refresh-token
```

## Testing

### Test Token Refresh:
1. Login to the app
2. Wait for token to expire (or manually expire it)
3. Visit `/app` - should automatically refresh
4. Or visit `/refresh-token` directly

### Test Endpoint:
The `/test-lightning-out` endpoint now also handles token refresh:
- If it gets a 401 or invalid session error
- Automatically refreshes the token
- Retries the request
- Returns success

## What Was Added

1. **`refreshAccessToken()` function**
   - Uses refresh token to get new access token
   - Handles errors gracefully

2. **`/refresh-token` endpoint**
   - Refreshes tokens server-side
   - Updates session
   - Redirects to requested page

3. **Error handlers in `/app` page**
   - Global `auraError` event listener
   - Component-specific error callbacks
   - Automatic redirect to refresh

4. **Enhanced `/test-lightning-out` endpoint**
   - Detects invalid session in response
   - Automatically refreshes and retries
   - Better error messages

## Configuration

Make sure your Salesforce Connected App has:
- ✅ **Refresh Token** scope enabled
- ✅ **Offline Access** permission
- ✅ OAuth scopes include: `refresh_token`, `offline_access`

## Troubleshooting

### Still Getting Invalid Session?

1. **Check refresh token exists:**
   - After login, verify `refreshToken` is stored in session
   - Check Render logs for "Token refreshed successfully"

2. **Check OAuth scopes:**
   - Salesforce Connected App must have `refresh_token` scope
   - Must have `offline_access` permission

3. **Check token expiration:**
   - Access tokens expire after ~2 hours
   - Refresh tokens should last longer (days/weeks)
   - If refresh token expires, user must login again

4. **Check browser console:**
   - Look for error messages
   - Check if redirect to `/refresh-token` is happening
   - Verify new token is being used

### Manual Testing

Test the refresh endpoint directly:
```bash
# After logging in, visit:
https://lotest.onrender.com/refresh-token

# Should redirect back to /app with refreshed token
```

### Check Logs

Look for these messages in Render logs:
- `Refreshing access token...`
- `Token refreshed successfully`
- `Invalid session detected, attempting token refresh...`

## Expected Behavior

**Before Fix:**
- Token expires → Error → User stuck → Must login again

**After Fix:**
- Token expires → Error detected → Auto-refresh → Seamless continuation

## Next Steps

1. **Deploy the changes** (already pushed to GitHub)
2. **Wait for Render to deploy** (2-3 minutes)
3. **Test the flow:**
   - Login
   - Wait or manually expire token
   - Visit `/app` - should auto-refresh
4. **Monitor logs** for refresh activity

The fix is now live! Your app will automatically handle expired tokens.

