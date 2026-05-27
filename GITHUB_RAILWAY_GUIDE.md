# 🚀 Quick Setup: GitHub → Railway Deployment

## Phase 1: Push to GitHub (5 minutes)

### 1️⃣ Create GitHub Repository
- Go to **github.com/new**
- Repository name: `mineguard` (or your choice)
- Select **Public** (so others can see it)
- Click **Create repository**

### 2️⃣ Add Remote and Push
Run these commands in PowerShell:

```powershell
cd c:\HCI
git remote add origin https://github.com/YOUR_USERNAME/mineguard.git
git branch -M main
git push -u origin main
```

✅ **Done!** Your code is now on GitHub

---

## Phase 2: Deploy to Railway (10 minutes)

### 1️⃣ Create Railway Account
- Go to **railway.app**
- Sign up with GitHub (easiest)
- Authorize Railway to access your account

### 2️⃣ Create New Railway Project
- Click **+ New Project**
- Select **Deploy from GitHub repo**
- Select your `mineguard` repository
- Click **Deploy**

Railway automatically:
- Detects Node.js backend
- Runs `npm install` in backend/
- Runs `npm start` (from Procfile)
- Creates live database
- Assigns you a URL like: `https://mineguard-prod.up.railway.app`

⏳ **Wait 2-5 minutes** for deployment

### 3️⃣ Verify Deployment
Test your backend API:
```
https://your-railway-url/health
```
Should return: `{"status":"ok","timestamp":"..."}`

### 4️⃣ Configure Frontend
Update `assets/app.js` line 13:

**Option A - Auto-detect (recommended):**
```javascript
// Current: Works for localhost, add for production
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001'
    : 'https://your-railway-url';

app.apiUrl = window.MINEGUARD_API_URL || API_BASE + '/api';
```

**Option B - Manual:**
```javascript
// Replace line 13 with:
app.apiUrl = 'https://your-railway-url/api';
```

### 5️⃣ Set Environment Variables in Railway
In Railway Dashboard → Click on your project → Variables tab:

```
PORT = 3001
CORS_ORIGIN = https://your-railway-url,https://your-frontend-domain.com
NODE_ENV = production
```

✅ **Done!** Your app is live and shareable!

---

## Phase 3: Optional - Frontend Hosting (Custom Domain)

### Option A: Cloudflare Pages (Free, no custom domain)
1. **Cloudflare Dashboard** → **Pages**
2. **Connect to Git** → Select `mineguard` repo
3. Build settings:
   - Framework: **None**
   - Build command: (empty)
   - Build output directory: `/`
4. Click **Save and Deploy**
5. Your URL: `https://mineguard.pages.dev`

### Option B: Keep Frontend on Railway
- Add to `index.html` a simple index route
- Railway serves both frontend + backend from same URL
- Simplest setup!

---

## Sharing Your App

### Everyone can access:
```
https://your-railway-url
```

### Share these features:
- **Login Demo**: admin@mineguard.com / (your password)
- **Sign Up**: Create new account to test notifications
- **Report Hazard**: Test report creation & status changes
- **Admin Dashboard**: Switch accounts to see all features

---

## Important: Security Checklist

✅ **Already Done:**
- Database excluded from git (`.gitignore`)
- Sensitive files protected
- CORS configured

⚠️ **You Should Do:**
1. [ ] Update admin password after deployment
2. [ ] Update `CORS_ORIGIN` in Railway with real domains
3. [ ] Never commit `.env` files (only `.env.example`)

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| CORS error | Add frontend URL to Railway `CORS_ORIGIN` |
| 404 errors | Check Railway logs in dashboard |
| Login fails | Database auto-creates on first run, sign up instead |
| Notifications not working | Verify CORS is set correctly |

---

## Monitoring Your App

**Railway Dashboard:**
- View logs: Click project → **Logs** tab
- Monitor usage: **Metrics** tab
- Redeploy: **Deployments** tab

**Check Live Status:**
```bash
curl https://your-railway-url/health
```

---

## Next Steps

1. ✅ Push to GitHub
2. ✅ Deploy to Railway
3. ✅ Test login/signup/reporting
4. ✅ Share URL with your team!
5. Optional: Add custom domain (paid)
6. Optional: Set up automated database backups

---

**Questions?** Check:
- Railway Docs: https://docs.railway.app
- GitHub Help: https://docs.github.com
- Or re-read DEPLOYMENT.md for detailed steps
