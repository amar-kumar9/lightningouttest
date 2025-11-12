# Fix: "Invalid state parameter" Error

## The Problem

You're getting a `403 Forbidden` error with "Invalid state parameter" because:

1. **Case Sensitivity Issue**: Your `APP_URL` in Render is set to `https://LOTest.onrender.com` (with capital letters), but the actual URL is `https://lotest.onrender.com` (lowercase)
2. **Session State Mismatch**: The state parameter stored in the session doesn't match what Salesforce returns

## The Fix

### Step 1: Update APP_URL in Render (CRITICAL)

1. Go to your Render dashboard
2. Click on your service (`lotest` or similar)
3. Go to **Environment** tab
4. Find `APP_URL` variable
5. **Change it to lowercase**:
   ```
   FROM: https://LOTest.onrender.com
   TO:   https://lotest.onrender.com
   ```
6. **Save** (app will restart automatically)

### Step 2: Update Salesforce Connected App

1. Go to Salesforce Setup → App Manager
2. Edit your Connected App
3. Update **Callback URL** to match exactly (lowercase):
   ```
   https://lotest.onrender.com/oauth/callback
   ```
4. **Save**

### Step 3: Deploy the Updated Code

The code has been fixed to:
- Normalize `APP_URL` to lowercase automatically
- Add better session debugging
- Improve error messages

**Push the changes:**
```bash
git add .
git commit -m "Fix session state issue and case sensitivity"
git push origin main
```

Render will auto-deploy (wait 2-3 minutes).

### Step 4: Clear Browser Cookies

After deployment:
1. Clear cookies for `lotest.onrender.com`
2. Or use incognito/private browsing
3. Try the login flow again

## Why This Happened

- URLs are case-sensitive in some contexts
- The session cookie domain must match exactly
- Render's free tier uses a single instance, so sessions should persist, but URL mismatches can cause issues

## Verification

After fixing, check Render logs for:
```
DEBUG: Login initiated: { redirectUri: 'https://lotest.onrender.com/oauth/callback', ... }
DEBUG: Callback received: { statesMatch: true, ... }
```

If `statesMatch: true`, the session is working correctly!

## Still Having Issues?

1. **Check Render logs** - Look for the debug messages
2. **Verify APP_URL** - Must be exactly `https://lotest.onrender.com` (lowercase)
3. **Check Salesforce callback URL** - Must match exactly
4. **Clear browser cookies** - Old sessions can cause issues
5. **Try incognito mode** - Rules out browser cache issues

