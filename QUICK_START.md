# 🚀 Quick Start: Deploy to Render in 5 Minutes

## ✅ Pre-Flight Check

Let's verify your app works before deploying:

```bash
# Test the app
node test-app.js
```

If you see "🎉 All tests passed!", you're good to go!

---

## Step 1: Push to GitHub (2 minutes)

If you haven't already:

```bash
# Initialize git (if needed)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Lightning Out app"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy on Render (3 minutes)

1. **Go to [render.com](https://render.com)** and sign up/login
2. **Click "New +" → "Web Service"**
3. **Connect GitHub** and select your repository
4. **Configure:**
   - **Name**: `lightning-out-host` (or any name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. **Click "Create Web Service"**

---

## Step 3: Add Environment Variables

While Render is building, add these in the "Environment" tab:

```env
SF_CLIENT_ID=your_salesforce_client_id
SF_CLIENT_SECRET=your_salesforce_client_secret
APP_URL=https://your-app-name.onrender.com
SESSION_SECRET=generate_with_command_below
NODE_ENV=production
PORT=10000
```

**Generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important:** Replace `your-app-name` with your actual Render app name!

---

## Step 4: Update Salesforce

1. Go to **Salesforce Setup → App Manager**
2. Edit your **Connected App**
3. Update **Callback URL** to: `https://your-app-name.onrender.com/oauth/callback`
4. Save

---

## Step 5: Test!

1. Wait for Render to finish deploying (2-3 minutes)
2. Visit your URL: `https://your-app-name.onrender.com`
3. Click "Login with Salesforce"
4. Complete OAuth flow
5. Verify Lightning components load! 🎉

---

## 🔄 Making Changes (The Loop)

After initial setup, here's the workflow:

```bash
# 1. Make changes locally
# (edit files)

# 2. Test locally
npm run dev

# 3. Commit and push
git add .
git commit -m "Your change description"
git push origin main

# 4. Render auto-deploys (wait 2-3 min)

# 5. Test on production URL
```

**That's it!** Render automatically deploys when you push to GitHub.

See [WORKFLOW.md](./WORKFLOW.md) for detailed workflow guide.

---

## 🐛 Troubleshooting

### App doesn't start
- Check Render logs for errors
- Verify all environment variables are set
- Make sure `SESSION_SECRET` is set

### OAuth fails
- Verify `APP_URL` matches your Render URL exactly
- Check Salesforce Connected App callback URL
- Ensure HTTPS is working (Render provides this automatically)

### Changes not showing
- Did you push to GitHub? Check with `git log`
- Wait 2-3 minutes for Render to deploy
- Check Render logs for build errors

---

## ✅ Verification Checklist

- [ ] App tested locally (`node test-app.js` passes)
- [ ] Code pushed to GitHub
- [ ] Render service created
- [ ] All environment variables set
- [ ] Salesforce Connected App updated
- [ ] App deployed and accessible
- [ ] OAuth flow works
- [ ] Lightning components load

---

**You're all set!** 🎉

For detailed workflow, see [WORKFLOW.md](./WORKFLOW.md)
For hosting options, see [HOSTING_GUIDE.md](./HOSTING_GUIDE.md)

