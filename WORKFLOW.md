# Development & Deployment Workflow

This guide explains how to make changes locally and deploy them to Render (or any hosting platform).

---

## 🔄 The Workflow Loop

```
1. Make changes locally
   ↓
2. Test locally (npm run dev)
   ↓
3. Commit to Git
   ↓
4. Push to GitHub
   ↓
5. Render auto-deploys (or manual deploy)
   ↓
6. Test on production URL
   ↓
(Repeat)
```

---

## 📝 Step-by-Step Workflow

### Step 1: Make Changes Locally

Edit your files in your local workspace:
- `index.js` - Main application code
- `dev-server.js` - Development server
- Any other files you need

### Step 2: Test Locally

```bash
# Start development server
npm run dev

# Or test the production build
npm start
```

Visit `http://localhost:5000` to test your changes.

### Step 3: Commit Changes to Git

```bash
# Check what files changed
git status

# Add your changes
git add .

# Or add specific files
git add index.js dev-server.js

# Commit with a message
git commit -m "Description of your changes"
```

### Step 4: Push to GitHub

```bash
# Push to your main branch
git push origin main

# Or if you're on a different branch
git push origin your-branch-name
```

### Step 5: Render Auto-Deploys

**If you set up auto-deploy in Render:**
- Render automatically detects the push
- Starts building your app (takes 2-3 minutes)
- Deploys the new version
- Your app is live at your Render URL

**To check deployment status:**
1. Go to your Render dashboard
2. Click on your service
3. View the "Events" or "Logs" tab

### Step 6: Test Production

Visit your Render URL (e.g., `https://your-app.onrender.com`) and test your changes.

---

## 🚀 Quick Commands Reference

```bash
# Test locally
npm run dev

# Commit and push (one-liner)
git add . && git commit -m "Your message" && git push origin main

# Check git status
git status

# View recent commits
git log --oneline -5
```

---

## 🔧 Making Environment Variable Changes

If you need to change environment variables (like `APP_URL` or `SF_CLIENT_ID`):

1. **Don't edit `.env` file** - it's not pushed to GitHub
2. **Update in Render Dashboard:**
   - Go to Render dashboard
   - Click your service
   - Go to "Environment" tab
   - Add/edit variables
   - Save (app will restart automatically)

---

## 🐛 Troubleshooting the Workflow

### Issue: Changes not showing on Render

**Check:**
1. Did you push to GitHub? `git log` to verify
2. Is Render connected to the right branch? Check Render settings
3. Check Render logs for build errors
4. Wait 2-3 minutes for deployment to complete

### Issue: Render build fails

**Check Render logs:**
1. Go to Render dashboard → Your service → Logs
2. Look for error messages
3. Common issues:
   - Missing dependencies (check `package.json`)
   - Syntax errors in code
   - Missing environment variables

### Issue: Need to rollback

**Option 1: Revert in Git**
```bash
# Revert last commit
git revert HEAD
git push origin main
```

**Option 2: Manual deploy in Render**
- Go to Render dashboard
- Click "Manual Deploy"
- Select a previous commit

---

## 📋 Pre-Deployment Checklist

Before pushing to production:

- [ ] Code works locally (`npm run dev`)
- [ ] No console errors
- [ ] Environment variables are set in Render
- [ ] `APP_URL` matches your Render URL exactly
- [ ] Salesforce Connected App callback URL is updated
- [ ] Committed changes with clear message

---

## 🎯 Best Practices

1. **Test locally first** - Always test with `npm run dev` before pushing
2. **Small commits** - Make small, focused changes per commit
3. **Clear commit messages** - Describe what you changed
4. **Check Render logs** - After deployment, check logs for errors
5. **Test production** - Always test the live URL after deployment

---

## 🔄 Alternative: Manual Deploy (if auto-deploy is off)

If you disabled auto-deploy in Render:

1. Push to GitHub (steps 1-4 above)
2. Go to Render dashboard
3. Click "Manual Deploy"
4. Select the branch/commit
5. Click "Deploy"

---

## 💡 Pro Tips

- **Use branches** for major changes:
  ```bash
  git checkout -b feature/new-feature
  # Make changes
  git push origin feature/new-feature
  # Test, then merge to main
  ```

- **Check Render status** before making changes:
  - Make sure current deployment is working
  - Check if there are any ongoing deployments

- **Keep `.env` local only**:
  - Never commit `.env` to Git
  - Always set variables in Render dashboard

---

## 📞 Quick Reference

| Action | Command |
|--------|---------|
| Test locally | `npm run dev` |
| Check changes | `git status` |
| Commit | `git commit -m "message"` |
| Push | `git push origin main` |
| View logs | Render dashboard → Logs |
| Check health | Visit `/health` endpoint |

---

**Remember:** The loop is: **Local → Git → GitHub → Render → Test → Repeat** 🔄

