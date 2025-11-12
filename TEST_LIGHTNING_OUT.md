# Testing Lightning Out App

## Understanding the Endpoint

The URL you're testing:
```
https://adp-16e-dev-ed.develop.my.salesforce.com/c/lightningOutApp.app?aura.format=JSON&aura.formatAdapter=LIGHTNING_OUT
```

This is the **Lightning Out app dependency endpoint** that:
- Returns the Lightning Out app configuration
- Lists all components available for Lightning Out
- Requires authentication (OAuth Bearer token)

## Why Your curl Command Fails

Your curl command:
```bash
curl -i -H "Origin: https://lotest.onrender.com" \
 "https://adp-16e-dev-ed.develop.my.salesforce.com/c/lightningOutApp.app?aura.format=JSON&aura.formatAdapter=LIGHTNING_OUT"
```

**Missing:**
1. **Authorization header** - You need a Bearer token
2. **Proper headers** - Content-Type, Accept headers
3. **CORS** - This endpoint requires proper CORS setup (handled by Lightning Out framework)

## How to Test Properly

### Option 1: Use the Test Endpoint (Recommended)

I've added a test endpoint to your app that handles authentication automatically:

1. **Login first:**
   ```
   https://lotest.onrender.com/login
   ```

2. **After successful login, test the endpoint:**
   ```
   https://lotest.onrender.com/test-lightning-out
   ```

This endpoint will:
- Use your stored access token
- Call the Lightning Out app endpoint with proper authentication
- Return the response in JSON format

### Option 2: Manual curl with Token

If you want to test with curl, you need to:

1. **Get an access token first** (through OAuth flow)
2. **Use it in the Authorization header:**

```bash
curl -i \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "https://adp-16e-dev-ed.develop.my.salesforce.com/c/lightningOutApp.app?aura.format=JSON&aura.formatAdapter=LIGHTNING_OUT"
```

**To get the access token:**
- Complete OAuth flow through the app
- Check browser DevTools → Application → Cookies → session data
- Or use the `/test-lightning-out` endpoint which uses the stored token

### Option 3: Test in Browser Console

After logging in and visiting `/app`, open browser console and run:

```javascript
// Get the access token from the page
const accessToken = 'YOUR_TOKEN_FROM_PAGE';
const instanceUrl = 'YOUR_INSTANCE_URL';

// Test the endpoint
fetch(`${instanceUrl}/c/lightningOutApp.app?aura.format=JSON&aura.formatAdapter=LIGHTNING_OUT`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## Expected Response

A successful response should look like:

```json
{
  "status": "success",
  "url": "https://.../c/lightningOutApp.app?...",
  "response": {
    "actions": [...],
    "context": {...},
    "componentDefs": {...}
  },
  "statusCode": 200
}
```

## Common Issues

### 401 Unauthorized
- **Cause**: Missing or invalid access token
- **Fix**: Login again to get a fresh token

### 403 Forbidden
- **Cause**: Lightning Out app not accessible or not configured
- **Fix**: 
  - Verify `lightningOutApp.app` exists in your Salesforce org
  - Check that it's deployed and accessible
  - Verify OAuth scopes include access to Lightning components

### 404 Not Found
- **Cause**: Wrong instance URL or app name
- **Fix**: 
  - Check `instanceUrl` in session matches your org URL
  - Verify app name is `lightningOutApp` (case-sensitive)

### CORS Errors
- **Cause**: Calling from browser without proper setup
- **Fix**: Use the `/test-lightning-out` endpoint or let Lightning Out framework handle it

## What the Lightning Out App Endpoint Does

This endpoint:
1. **Returns app configuration** - Lists all components available for Lightning Out
2. **Validates access** - Ensures you have permission to use Lightning Out
3. **Provides metadata** - Component definitions, dependencies, etc.

The Lightning Out framework (`lightning.out.js`) uses this endpoint automatically when you call `$Lightning.use()`.

## Testing Checklist

- [ ] Logged in successfully (`/login` → `/app`)
- [ ] Access token is stored in session
- [ ] Instance URL is correct
- [ ] Lightning Out app exists in Salesforce org
- [ ] Components are deployed (`c:caseList`, `c:caseDetail`, `c:caseComments`)
- [ ] Test endpoint returns success (`/test-lightning-out`)
- [ ] Components load on `/app` page

## Next Steps

1. **Test the endpoint**: Visit `https://lotest.onrender.com/test-lightning-out` after logging in
2. **Check the response**: Should return Lightning Out app configuration
3. **Verify components**: The response should list your components
4. **Test in browser**: Visit `/app` and check browser console for Lightning Out initialization

