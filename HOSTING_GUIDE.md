# Hosting Guide for Salesforce Lightning Out Application

This guide covers the best free hosting platforms for deploying your Salesforce Lightning Out application with HTTPS support.

## ⚠️ Important: HTTPS Requirement

**Salesforce Lightning Out requires HTTPS** for security reasons. All recommended platforms below provide free HTTPS certificates automatically.

---

## 🏆 Best Free Hosting Platforms (Recommended Order)

### 1. **Render** ⭐ **BEST CHOICE**
**Why it's great:**
- ✅ Free tier with HTTPS included
- ✅ Automatic SSL certificates
- ✅ Easy deployment from GitHub
- ✅ No credit card required
- ✅ Auto-deploys on git push
- ✅ Free tier: 750 hours/month (enough for always-on)

**Setup Steps:**
1. Push your code to GitHub
2. Go to [render.com](https://render.com) and sign up
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `lightning-out-host`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
6. Add Environment Variables:
   - `SF_CLIENT_ID` - Your Salesforce Client ID
   - `SF_CLIENT_SECRET` - Your Salesforce Client Secret
   - `APP_URL` - Will be `https://your-app.onrender.com` (Render provides this)
   - `SESSION_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `NODE_ENV` - `production`
7. Deploy!

**Note:** Free tier spins down after 15 minutes of inactivity. First request may take 30-60 seconds to wake up.

**Configuration File:** Use `render.yaml` included in the project.

---

### 2. **Railway** ⭐ **SECOND BEST**
**Why it's great:**
- ✅ Free tier with $5 credit/month
- ✅ Automatic HTTPS
- ✅ Very fast deployments
- ✅ Great developer experience
- ✅ No sleep/wake delays

**Setup Steps:**
1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) and sign up
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add Environment Variables (same as Render)
6. Railway auto-detects Node.js and deploys

**Configuration File:** Use `railway.json` included in the project.

**Note:** Free tier includes $5 credit/month. After that, you'll need to upgrade or the service pauses.

---

### 3. **Fly.io** ⭐ **GOOD FOR ALWAYS-ON**
**Why it's great:**
- ✅ Free tier with 3 shared VMs
- ✅ Automatic HTTPS
- ✅ Global edge network
- ✅ No sleep/wake delays
- ✅ Great for production

**Setup Steps:**
1. Install Fly CLI: `npm install -g @fly/cli`
2. Login: `fly auth login`
3. Launch: `fly launch` (uses `fly.toml` config)
4. Set secrets:
   ```bash
   fly secrets set SF_CLIENT_ID=your_client_id
   fly secrets set SF_CLIENT_SECRET=your_secret
   fly secrets set SESSION_SECRET=your_session_secret
   fly secrets set APP_URL=https://your-app.fly.dev
   ```
5. Deploy: `fly deploy`

**Configuration File:** Use `fly.toml` included in the project.

---

### 4. **Vercel** (Alternative)
**Why it's good:**
- ✅ Free tier with HTTPS
- ✅ Very fast CDN
- ⚠️ Requires serverless function conversion (not ideal for Express)

**Note:** Vercel is optimized for serverless. Your Express app would need modifications.

---

### 5. **Heroku** (Legacy)
**Why it's okay:**
- ✅ Free tier available (limited)
- ✅ Automatic HTTPS
- ⚠️ Requires credit card for verification
- ⚠️ Free tier has limitations

---

## 🚀 Quick Start: Render (Recommended)

### Step 1: Prepare Your Code
```bash
# Make sure you have a .gitignore
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore

# Commit and push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy on Render
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your repository
5. Use these settings:
   - **Name**: `lightning-out-host`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 3: Configure Environment Variables
In Render dashboard, go to "Environment" tab and add:

```
SF_CLIENT_ID=your_salesforce_client_id
SF_CLIENT_SECRET=your_salesforce_client_secret
APP_URL=https://your-app-name.onrender.com
SESSION_SECRET=generate_a_random_32_char_hex_string
NODE_ENV=production
PORT=10000
```

**Generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Update Salesforce Connected App
1. Go to Salesforce Setup → App Manager
2. Edit your Connected App
3. Update Callback URL to: `https://your-app-name.onrender.com/oauth/callback`
4. Save

### Step 5: Deploy!
Click "Create Web Service" and wait for deployment (2-3 minutes).

---

## 🔧 Environment Variables Reference

All platforms require these environment variables:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SF_CLIENT_ID` | ✅ Yes | Salesforce Connected App Client ID | `3MVG9...` |
| `SF_CLIENT_SECRET` | ✅ Yes | Salesforce Connected App Client Secret | `ABC123...` |
| `APP_URL` | ✅ Yes | Your HTTPS application URL | `https://your-app.onrender.com` |
| `SESSION_SECRET` | ✅ Yes | Secret for session encryption | `a1b2c3d4...` (32+ chars) |
| `NODE_ENV` | ⚠️ Recommended | Environment mode | `production` |
| `PORT` | ⚠️ Optional | Server port (platforms usually set this) | `5000` or `10000` |
| `SF_LOGIN_URL` | ⚠️ Optional | Salesforce login URL | `https://login.salesforce.com` |

---

## 🧪 Testing Your Deployment

1. Visit your app URL: `https://your-app.onrender.com`
2. Click "Login with Salesforce"
3. Complete OAuth flow
4. Verify Lightning components load correctly

**Health Check:** Visit `https://your-app.onrender.com/health` to verify the server is running.

---

## 📝 Platform Comparison

| Platform | Free Tier | HTTPS | Always On | Setup Time | Best For |
|----------|-----------|-------|-----------|------------|----------|
| **Render** | ✅ 750 hrs/mo | ✅ Auto | ⚠️ Sleeps after 15min | 5 min | **Best overall** |
| **Railway** | ✅ $5 credit | ✅ Auto | ✅ Yes | 3 min | Fast & reliable |
| **Fly.io** | ✅ 3 VMs | ✅ Auto | ✅ Yes | 10 min | Production-ready |
| **Vercel** | ✅ Unlimited | ✅ Auto | ✅ Yes | 5 min | Serverless (needs mods) |
| **Heroku** | ⚠️ Limited | ✅ Auto | ⚠️ Sleeps | 5 min | Legacy option |

---

## 🎯 Recommendation

**For quick testing:** Use **Render** - it's the fastest to set up and works perfectly for Salesforce Lightning Out.

**For production:** Use **Railway** or **Fly.io** - they don't sleep and provide better performance.

---

## 🆘 Troubleshooting

### Issue: "App sleeps after inactivity"
- **Solution:** This is normal for Render free tier. First request takes 30-60s to wake up.

### Issue: "OAuth callback fails"
- **Solution:** Make sure `APP_URL` in environment variables matches your actual URL exactly (including `https://`)

### Issue: "CORS errors"
- **Solution:** Salesforce Lightning Out handles CORS automatically. Check that your `APP_URL` is correct.

### Issue: "Session not persisting"
- **Solution:** Ensure `SESSION_SECRET` is set and `NODE_ENV=production` for secure cookies.

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Fly.io Documentation](https://fly.io/docs)
- [Salesforce Lightning Out Guide](https://developer.salesforce.com/docs/atlas.en-us.lightning.meta/lightning/lightning_out_intro.htm)

---

**Need help?** Check the main README.md for Salesforce setup instructions.

