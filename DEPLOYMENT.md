# Deployment Guide - MineGuard

## Prerequisites
- GitHub account (free)
- Railway account (free at railway.app)
- Your GitHub repository URL

---

## Step 1: Push to GitHub

### Create a new repository on GitHub:
1. Go to [github.com/new](https://github.com/new)
2. Name it `mineguard` (or your preferred name)
3. Choose **Public** (to make it shareable)
4. **Don't** add README, .gitignore, or license (we already have them)
5. Click "Create repository"

### Connect local to GitHub:
```bash
cd c:\HCI
git remote add origin https://github.com/YOUR_USERNAME/mineguard.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Railway

### Via Railway Dashboard (Easiest):
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. **Select your repository** (authorize GitHub if needed)
4. Railway automatically detects Node.js backend
5. Add environment variables:
   - `PORT` = (Railway sets automatically)
   - `CORS_ORIGIN` = `https://<your-railway-url>`
   - `NODE_ENV` = `production`
6. Click **"Deploy"** - takes 2-5 minutes

### Get your live URL:
- Railway generates a URL like: `https://mineguard-production.up.railway.app`
- Your app is now live! ✨

---

## Step 3: Update Frontend for Production

Update `assets/app.js` API calls to use your Railway backend:

```javascript
// Change from:
const API_URL = 'http://localhost:3001';

// To:
const API_URL = 'https://your-railway-url';
```

Or use this to auto-detect:
```javascript
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : 'https://your-railway-url';
```

---

## Step 4: Deploy Frontend (Optional - for custom domain)

### Option A: Cloudflare Pages (Free)
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Pages** → **Connect to Git**
3. Select your GitHub repository
4. Build settings:
   - Build command: (leave empty)
   - Build output directory: `/` (root)
5. Deploy!
6. Your frontend URL: `https://mineguard.pages.dev`

### Option B: Keep on Railway
Railway can serve both frontend + backend:
- Add to root `package.json` a script to serve frontend
- Keep backend running on same instance

---

## Important Security Notes

✅ **Already Protected:**
- Database excluded from git (`.gitignore`)
- Sensitive data not in repo
- CORS configured for production

⚠️ **Still Do:**
1. Update `CORS_ORIGIN` in Railway environment with your real domain
2. Change admin password after deployment
3. Don't commit `.env` files
4. Use Railway's built-in secrets manager for sensitive data

---

## Testing Your Deployment

Once deployed:
1. Visit your Railway URL: `https://your-railway-url/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

2. Test API:
   ```bash
   curl https://your-railway-url/api/users
   ```

3. Test frontend:
   - If frontend is on Cloudflare Pages, update API calls
   - Test login/signup/reporting

---

## Troubleshooting

**"CORS error"**
- Add your frontend URL to Railway's `CORS_ORIGIN` environment variable

**"Cannot find module"**
- Railway should auto-run `npm install` in backend/
- Check Railway logs in dashboard

**Database empty**
- Railway creates fresh database on first run
- Schema auto-initializes from `initDatabase.js`
- Test signup to create first user

---

## Next Steps
1. Share your Railway URL with others!
2. Add custom domain (paid feature on some hosts)
3. Set up automated backups
4. Monitor logs in Railway dashboard

---

## Support
- Railway Docs: https://docs.railway.app
- Cloudflare Pages: https://developers.cloudflare.com/pages
