# Lightning Out v2 API Update

## What Changed

Salesforce has updated Lightning Out to use a new declarative API (v2) instead of the old JavaScript API.

### Old API (v1)
```javascript
$Lightning.use("c:lightningOutApp", function() {
  $Lightning.createComponent("c:caseList", {}, "container", ...);
}, instanceUrl, accessToken);
```

### New API (v2)
```html
<script src=".../lightning.out.latest/index.iife.prod.js"></script>
<lightning-out-application 
  components="c-case-list,c-case-detail,c-case-comments"
  instance-url="..."
  access-token="...">
  <c-case-list></c-case-list>
  <c-case-detail></c-case-detail>
  <c-case-comments></c-case-comments>
</lightning-out-application>
```

## Changes Made

### 1. Updated Script Source
- **Old**: `lightning/lightning.out.js`
- **New**: `lightning/lightning.out.latest/index.iife.prod.js`
- Added `async` attribute for better loading

### 2. Declarative HTML Elements
- Use `<lightning-out-application>` wrapper element
- Declare components in `components` attribute
- Use component tags directly: `<c-case-list>`, `<c-case-detail>`, etc.

### 3. Simplified Initialization
- No more JavaScript initialization needed
- Components are declared in HTML
- Lightning Out handles initialization automatically

## Benefits

1. **Simpler**: Declarative HTML instead of JavaScript
2. **Better Performance**: Latest optimized build
3. **Easier to Use**: Just add HTML elements
4. **Future-Proof**: Uses latest Lightning Out version

## Component List

The app now supports these components:
- `c-case-list`
- `c-case-detail`
- `c-case-comments`

To add more components:
1. Add to `components` attribute: `components="c-case-list,c-case-detail,c-case-comments,c-hello"`
2. Add component tag: `<c-hello></c-hello>`

## Backward Compatibility

The old API (`$Lightning.use()`) may still work but is deprecated. The new API is recommended.

## Testing

After deployment:
1. Visit `/app` page
2. Check browser console for "Lightning Out v2 initialized"
3. Verify components load correctly
4. Check for any errors

## Troubleshooting

### Components Not Loading
- Verify components exist in Salesforce org
- Check `components` attribute matches component names
- Ensure Lightning Out app (`lightningOutApp.app`) is configured

### Script Not Loading
- Check network tab for script load
- Verify instance URL is correct
- Check for CORS errors

### Invalid Session
- Token refresh still works the same way
- Error handlers are still in place
- Auto-redirect to `/refresh-token` if needed

## Migration Notes

If you were using the old API:
- Remove `$Lightning.use()` calls
- Remove `$Lightning.createComponent()` calls
- Replace with declarative HTML elements
- Update script source to new path

The new API is much simpler and more maintainable!

