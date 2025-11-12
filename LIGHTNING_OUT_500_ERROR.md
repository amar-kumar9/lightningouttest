# Fix: 500 Internal Server Error on Lightning Out App

## Problem

Getting a **500 Internal Server Error** when accessing:
```
https://adp-16e-dev-ed.develop.my.salesforce.com/c/lightningOutApp.app?aura.format=JSON&aura.formatAdapter=LIGHTNING_OUT
```

This is a **Salesforce server-side error**, not an authentication issue.

## Common Causes

### 1. Lightning Out App Doesn't Exist
The `lightningOutApp.app` file might not be deployed to your Salesforce org.

### 2. App Not Properly Configured
The app might exist but not be configured correctly for Lightning Out.

### 3. Missing Dependencies
The app might reference components that don't exist or aren't deployed.

### 4. Access Permissions
The app might not have the right access level (needs `GLOBAL` access).

## Solution: Verify Lightning Out App Setup

### Step 1: Check if App Exists

1. Go to **Salesforce Setup**
2. Navigate to **Custom Code → Aura Components**
3. Search for `lightningOutApp`
4. Verify it exists and is deployed

### Step 2: Verify App Configuration

The app should be an **Aura Application** (not a component) with this structure:

**File**: `lightningOutApp.app`

```xml
<aura:application access="GLOBAL" extends="ltng:outApp">
    <aura:dependency resource="c:caseList"/>
    <aura:dependency resource="c:caseDetail"/>
    <aura:dependency resource="c:caseComments"/>
</aura:application>
```

**Key Requirements:**
- ✅ Must extend `ltng:outApp`
- ✅ Must have `access="GLOBAL"`
- ✅ Must list all component dependencies
- ✅ All referenced components must exist

### Step 3: Verify Component Dependencies

Check that these components exist in your org:
- `c:caseList`
- `c:caseDetail`
- `c:caseComments`

1. Go to **Setup → Custom Code → Lightning Components**
2. Search for each component
3. Verify they're deployed

### Step 4: Check Deployment Status

1. Go to **Setup → Deployed**
2. Check for any deployment errors
3. Look for `lightningOutApp` in the list
4. Verify status is "Active"

### Step 5: Check Salesforce Logs

1. Go to **Setup → Debug Logs**
2. Enable debug logs for your user
3. Try accessing the endpoint again
4. Check logs for detailed error messages

## How to Create/Update the App

### Option 1: Using Developer Console

1. Open **Developer Console** (Setup → Developer Console)
2. File → New → Aura Application
3. Name: `lightningOutApp`
4. Paste this code:

```xml
<aura:application access="GLOBAL" extends="ltng:outApp">
    <aura:dependency resource="c:caseList"/>
    <aura:dependency resource="c:caseDetail"/>
    <aura:dependency resource="c:caseComments"/>
</aura:application>
```

5. Save and deploy

### Option 2: Using VS Code with Salesforce Extensions

1. Create file: `force-app/main/default/aura/lightningOutApp/lightningOutApp.app`
2. Add the XML content above
3. Deploy to org: `sfdx force:source:deploy -p force-app/main/default/aura/lightningOutApp`

### Option 3: Using Workbench

1. Go to **Workbench** (workbench.developerforce.com)
2. Login to your org
3. Migration → Deploy
4. Upload the app metadata

## Testing the App

### Test 1: Direct URL Access

After creating the app, test it directly in Salesforce:
```
https://adp-16e-dev-ed.develop.my.salesforce.com/c/lightningOutApp.app
```

Should return the app configuration (not an error).

### Test 2: Using Your App's Test Endpoint

1. Login to your app: `https://lotest.onrender.com/login`
2. Visit: `https://lotest.onrender.com/test-lightning-out`
3. Check the response

### Test 3: Check Browser Console

1. Visit `/app` page
2. Open browser DevTools → Console
3. Look for Lightning Out errors
4. Check Network tab for the request

## Common Error Messages

### "Component not found"
- **Cause**: Component dependency doesn't exist
- **Fix**: Deploy the missing component or remove from dependencies

### "Access denied"
- **Cause**: App doesn't have GLOBAL access
- **Fix**: Set `access="GLOBAL"` in app definition

### "Invalid app definition"
- **Cause**: App doesn't extend `ltng:outApp`
- **Fix**: Ensure app extends `ltng:outApp`

### "Dependency not found"
- **Cause**: Referenced component doesn't exist
- **Fix**: Deploy the component or remove the dependency

## Debugging Steps

1. **Check if app exists:**
   ```bash
   # Using Salesforce CLI
   sfdx force:source:retrieve -m AuraDefinitionBundle:lightningOutApp
   ```

2. **Check app metadata:**
   - Verify `access="GLOBAL"`
   - Verify `extends="ltng:outApp"`
   - Verify all dependencies exist

3. **Check Salesforce logs:**
   - Setup → Debug Logs
   - Enable for your user
   - Reproduce the error
   - Check logs for details

4. **Test with minimal app:**
   ```xml
   <aura:application access="GLOBAL" extends="ltng:outApp">
   </aura:application>
   ```
   If this works, add dependencies one by one.

## Quick Checklist

- [ ] `lightningOutApp.app` exists in Salesforce org
- [ ] App extends `ltng:outApp`
- [ ] App has `access="GLOBAL"`
- [ ] All component dependencies exist (`c:caseList`, etc.)
- [ ] All components are deployed
- [ ] App is active (not in development mode only)
- [ ] No deployment errors in Setup → Deployed

## Next Steps

1. **Verify the app exists** in your Salesforce org
2. **Check the app configuration** matches the template above
3. **Deploy any missing components**
4. **Test the endpoint** again
5. **Check Salesforce logs** for detailed error messages

## Getting More Details

The updated code now provides better error messages. Check:
- Render logs for detailed error information
- `/test-lightning-out` endpoint response
- Browser console for client-side errors

The 500 error is coming from Salesforce, so the issue is in your Salesforce org configuration, not in the hosting app.

