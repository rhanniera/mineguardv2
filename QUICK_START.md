# MineGuard Quick Reference

## 🚀 Quick Start (5 minutes)

### Terminal 1: Start Backend
```bash
cd c:\HCI\backend
npm install              # First time only
npm run init-db          # First time only
npm start
```

Expected output:
```
✓ Server running on http://localhost:3001
✓ API endpoint: http://localhost:3001/api
Ready to accept requests.
```

### Terminal 2: Start Frontend
```bash
cd c:\HCI
npx http-server -p 5501
```

Expected output:
```
Starting up http-server, serving C:\HCI
Available on:
  http://127.0.0.1:5501
Hit CTRL-C to stop the server
```

### Browser
Open: `http://localhost:5501`

---

## 📋 Default Credentials

- **Email**: admin@mineguard.com
- **Password**: admin123

---

## 🎯 Key Features

### User Actions
- ✅ Sign Up / Login
- ✅ Report Hazards
- ✅ View Dashboard
- ✅ Track Reports
- ✅ View Profile

### Admin Actions
- ✅ View All Reports
- ✅ Manage Users
- ✅ Update Report Status
- ✅ Promote Users
- ✅ View Statistics

---

## 📁 Project Structure

```
c:\HCI\
├── index.html                    # Main app
├── assets/
│   ├── styles.css               # Responsive design (2500+ lines)
│   └── app.js                   # Frontend logic (600+ lines)
├── backend/
│   ├── package.json
│   ├── .env
│   ├── src/
│   │   ├── server.js            # Express server
│   │   ├── routes/
│   │   │   ├── users.js         # User API
│   │   │   └── reports.js       # Report API
│   │   └── db/
│   │       ├── connection.js    # Database
│   │       └── initDatabase.js  # Schema
│   └── data/
│       └── mineguard.db         # SQLite
├── docs/
│   ├── SETUP.md                 # Setup guide
│   ├── API.md                   # API docs
│   └── ARCHITECTURE.md          # Architecture
└── README.md                    # Overview
```

---

## 🔌 API Endpoints

### Users
```
POST   /api/users               # Register
POST   /api/users/login         # Login
GET    /api/users               # List all
GET    /api/users/:id           # Get one
PUT    /api/users/:id           # Update
DELETE /api/users/:id           # Delete
POST   /api/users/:id/make-admin # Promote
```

### Reports
```
POST   /api/reports             # Create
GET    /api/reports             # List (filterable)
GET    /api/reports/:id         # Get one
PUT    /api/reports/:id         # Update
DELETE /api/reports/:id         # Delete
POST   /api/reports/:id/comments # Add comment
GET    /api/reports/:id/comments # Get comments
GET    /api/reports/stats/summary # Stats
```

---

## 🛠️ Troubleshooting

### Backend won't start / "Database is closed" error
```bash
# Kill all Node processes
Get-Process node | Stop-Process -Force

# Check port 3001 is free
netstat -ano | findstr :3001

# Use different port if needed
PORT=3002 npm start

# If you see "Database is closed" error:
# - Stop the backend
# - Ensure backend/src/db/initDatabase.js is updated with the fix
# - Restart: node backend/src/server.js
```

### Database issues
```bash
# Reset database
rm backend/data/mineguard.db
npm run init-db
```

### CORS errors
Edit `backend/.env`:
```
CORS_ORIGIN=http://localhost:5501,file://
```

### Frontend not loading / Login failed / Signup failed
- **MOST IMPORTANT:** Clear browser cache completely:
  - Press `Ctrl+Shift+Delete` to open cache clearing dialog
  - Select "All time" and check "Cached images and files"
  - Click "Clear data"
- Hard refresh the page: `Ctrl+Shift+F5` or `Ctrl+F5`
- Close and reopen the browser tab
- Verify backend is running (check Terminal 1 shows "Ready to accept requests")
- Check you're at `http://localhost:5501`, not `3001`
- Open browser DevTools (F12) and check Console tab for any JavaScript errors

---

## 📝 Important Files

| File | Purpose |
|------|---------|
| `index.html` | Main app interface |
| `assets/app.js` | All frontend logic |
| `backend/src/server.js` | API server |
| `docs/API.md` | API reference |
| `docs/SETUP.md` | Setup instructions |

---

## 🔐 Default Users Created

After `npm run init-db`:
- Admin: admin@mineguard.com / admin123

---

## ✨ Features Implemented

✅ User Registration & Authentication  
✅ Hazard Reporting System  
✅ Dashboard with Statistics  
✅ Report Status Tracking  
✅ Admin Dashboard  
✅ User Management  
✅ Report Comments  
✅ Responsive Design  
✅ Mobile Support  
✅ Data Persistence  

---

## 🚀 Next Steps

1. ✅ Start both servers (see above)
2. ✅ Open http://localhost:5501 in your browser
3. ✅ Login with admin credentials (admin@mineguard.com / admin123)
4. ✅ Create a test hazard report
5. ✅ Try admin dashboard features
6. ✅ Test mobile responsiveness by resizing browser

---

## 💡 Pro Tips

- Use F12 (Browser DevTools) to see errors and network requests
  - Check "Console" tab for JavaScript errors
  - Check "Network" tab to see API calls and responses
- If login fails: press Ctrl+Shift+Delete to clear cache, then refresh
- Check backend terminal for API logs and request details
- Test mobile responsiveness by resizing browser to 320px width
- Reset all data anytime: delete `backend/data/mineguard.db` and run `npm run init-db`
- Both servers must stay running simultaneously for full functionality
- Keep both terminal windows visible to monitor for errors
- If forms aren't submitting: check browser console (F12) for error messages

---

## 📞 Need Help?

1. Read [SETUP.md](docs/SETUP.md)
2. Check [API.md](docs/API.md)
3. Review [ARCHITECTURE.md](docs/ARCHITECTURE.md)
4. Check browser console for errors

---

**Version**: 1.0.0 - Production Ready 🎉
