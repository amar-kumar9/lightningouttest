# OAuth Debugging Guide

## Why Your Manual curl Test Won't Work

Your app uses **PKCE (Proof Key for Code Exchange)** for enhanced security. This means:

1. When you visit `/login`, the app generates a `code_verifier` and stores it in the session
2. It creates a `code_challenge` from the verifier and sends it to Salesforce
3. When Salesforce redirects back with the authorization code, you **must** include the original `code_verifier` to exchange for tokens

**The problem with manual curl:**
- The `code_verifier` is stored in the server-side session
- You can't access it from a curl command
- Without it, Salesforce will reject the token exchange

## How the App Handles It (Automatic)

The app handles this automatically:

1. **User visits `/login`**
   - App generates `code_verifier` → stores in session
   - Creates `code_challenge` → sends to Salesforce
   - User authorizes → Salesforce redirects to `/oauth/callback`

2. **Salesforce redirects to `/oauth/callback`**
   - App retrieves `code_verifier` from session
   - Exchanges code + verifier for access token
   - Stores token in session → redirects to `/app`

**You don't need to test manually** - the app handles everything!

## Testing the OAuth Flow

### Option 1: Test Through the App (Recommended)

1. Visit: `https://lotest.onrender.com`
2. Click "Login with Salesforce"
3. Complete OAuth flow
4. Check browser console and Render logs for any errors

### Option 2: Check Render Logs

1. Go to Render dashboard → Your service → Logs
2. Look for:
   - `DEBUG: Redirect URI being used:`
   - `DEBUG: APP_URL value:`
   - `DEBUG: Full auth URL:`
   - Any `OAuth error:` messages

### Option 3: Test Health Endpoint

```bash
curl https://lotest.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "environment": "production",
  "port": 10000
}
```

## Common OAuth Errors

### Error: "invalid_grant"
- **Cause**: Code already used, expired, or wrong redirect_uri
- **Fix**: Start fresh - visit `/login` again

### Error: "invalid_client"
- **Cause**: Wrong `SF_CLIENT_ID` or `SF_CLIENT_SECRET`
- **Fix**: Check environment variables in Render dashboard

### Error: "redirect_uri_mismatch"
- **Cause**: Callback URL in Salesforce doesn't match `APP_URL`
- **Fix**: 
  1. Check `APP_URL` in Render environment variables
  2. Update Salesforce Connected App callback URL to match exactly

### Error: "invalid_code_verifier"
- **Cause**: PKCE verifier mismatch (shouldn't happen with app)
- **Fix**: Clear session and try again

## Debugging Steps

1. **Verify Environment Variables in Render:**
   ```
   SF_CLIENT_ID=✓
   SF_CLIENT_SECRET=✓
   APP_URL=https://lotest.onrender.com  ← Must match exactly!
   SESSION_SECRET=✓
   ```

2. **Check Salesforce Connected App:**
   - Callback URL: `https://lotest.onrender.com/oauth/callback`
   - OAuth Scopes: `full`, `refresh_token`, `offline_access`

3. **Check Render Logs:**
   - Look for startup messages showing config status
   - Look for OAuth flow debug messages
   - Look for any error messages

4. **Test the Flow:**
   - Visit `https://lotest.onrender.com`
   - Click "Login with Salesforce"
   - Watch Render logs in real-time
   - Check browser console for JavaScript errors

## Manual Testing (Advanced)

If you really need to test manually, you'd need to:

1. Visit `/login` and capture:
   - The `code_verifier` from session (not easily accessible)
   - The authorization code from callback URL

2. Use both in curl:
   ```bash
   curl -X POST https://login.salesforce.com/services/oauth2/token \
     -d "grant_type=authorization_code" \
     -d "code=THE_CODE" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=https://lotest.onrender.com/oauth/callback" \
     -d "code_verifier=THE_CODE_VERIFIER"  # ← Required!
   ```

**But this is unnecessary** - the app does this automatically!

## Quick Debug Checklist

- [ ] App is deployed and running on Render
- [ ] Environment variables are set correctly
- [ ] `APP_URL` matches your Render URL exactly
- [ ] Salesforce Connected App callback URL matches
- [ ] Can access `/health` endpoint
- [ ] Can access home page `/`
- [ ] OAuth flow completes without errors

## Need Help?

Check the Render logs - they now include detailed error information including:
- The redirect URI being used
- Whether code_verifier is present
- Full error details from Salesforce

