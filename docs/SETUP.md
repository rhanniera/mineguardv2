# MineGuard Setup Guide

## System Requirements

- **Node.js**: v14.0.0 or higher
- **npm**: v6.0.0 or higher
- **Python 3** (optional, for running a local web server)
- **Modern Browser**: Chrome, Firefox, Safari, Edge

## Installation Steps

### Step 1: Extract/Clone the Project

```bash
cd c:/HCI  # Navigate to project directory
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

This installs all required packages:
- express: Web framework
- sqlite3: Database
- cors: Cross-origin support
- body-parser: JSON parsing
- uuid: Unique identifiers
- dotenv: Environment configuration

### Step 3: Initialize the Database

```bash
npm run init-db
```

Expected output:
```
✓ Connected to database: ./data/mineguard.db
✓ Database schema initialized
✓ Default admin user created
  Email: admin@mineguard.com
  Password: admin123
✓ Database initialization complete
```

### Step 4: Start the Backend Server

```bash
npm start
```

Expected output:
```
✓ Server running on http://localhost:3001
✓ API endpoint: http://localhost:3001/api
✓ Health check: http://localhost:3001/health

Ready to accept requests.
```

### Step 5: Start the Frontend

In a new terminal window:

#### Option A: Using Python (recommended)
```bash
cd c:/HCI
python -m http.server 5500
```

Or Python 2:
```bash
python -m SimpleHTTPServer 5500
```

#### Option B: Using Node.js
```bash
npm install -g http-server
http-server -p 5500
```

#### Option C: Using VS Code
Right-click `index.html` > "Open with Live Server"

### Step 6: Access the Application

Open your browser and navigate to:
```
http://localhost:5500
```

## First Time Setup

### 1. Create Your Admin Account

The system comes with a default admin account:
- **Email**: admin@mineguard.com
- **Password**: admin123

Login with these credentials first.

### 2. Create Additional Users

- Click "Sign Up"
- Enter name, email, department
- Create a password (minimum 6 characters)
- Submit

### 3. Create Your First Report

- Navigate to "Report Hazard"
- Fill in the form:
  - **Hazard Type**: Select from dropdown
  - **Severity**: Choose appropriate level
  - **Location**: Where the hazard was found
  - **Description**: Detailed explanation
  - **Affected People**: Number of people at risk (optional)
  - **Immediate Action**: What was done (optional)
- Click "Submit Report"

### 4. View Your Dashboard

- Click "Dashboard" to see all reports
- View personal reports in "Profile" section

### 5. Access Admin Features (if admin)

- Click "Admin Dashboard"
- View all reports and users
- Update report statuses
- Manage user accounts

## Configuration

### Environment Variables

Edit `backend/.env`:

```env
# Server port
PORT=3001

# Environment mode
NODE_ENV=development

# Database location
DATABASE_PATH=./data/mineguard.db

# CORS origins
CORS_ORIGIN=http://localhost:3000,http://localhost:5500,file://
```

### API Configuration (Frontend)

Edit `index.html` to change API URL:

```html
<script>
    window.MINEGUARD_API_URL = 'http://localhost:3001/api';
</script>
```

## Database Management

### View Database

SQLite database is located at:
```
backend/data/mineguard.db
```

### Reset Database

To start fresh:

```bash
# Delete the database file
rm backend/data/mineguard.db

# Reinitialize
npm run init-db
```

### Backup Database

```bash
# Create a backup
cp backend/data/mineguard.db backend/data/mineguard.db.backup
```

### Query Database

Using SQLite CLI:

```bash
# Install SQLite (if not installed)
# Windows: Download from sqlite.org
# macOS: brew install sqlite3
# Linux: apt-get install sqlite3

# Open database
sqlite3 backend/data/mineguard.db

# View tables
.tables

# View schema
.schema

# Run queries
SELECT * FROM users;
SELECT * FROM reports;
```

## Troubleshooting

### Issue: Backend won't start

**Error**: `EADDRINUSE: address already in use :::3001`

**Solution**:
```bash
# Find process using port 3001
# Windows
netstat -ano | findstr :3001

# Kill process
taskkill /PID <PID> /F

# Or use different port
PORT=3002 npm start
```

### Issue: Database locked

**Error**: `Error: SQLITE_IOERR: disk I/O error`

**Solution**:
```bash
# Remove lock file
rm backend/data/.wal
rm backend/data/.shm

# Reinitialize database
npm run init-db
```

### Issue: CORS errors

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
Edit `backend/.env`:
```env
CORS_ORIGIN=http://localhost:5500,file://
```

### Issue: Module not found

**Error**: `Cannot find module 'express'`

**Solution**:
```bash
cd backend
npm install
```

### Issue: Frontend shows "Cannot GET /"

**Solution**: 
Make sure you're running from the correct directory and accessing the right URL:
```bash
# Wrong: accessing backend URL
http://localhost:3001

# Correct: accessing frontend URL
http://localhost:5500
```

## Performance Optimization

### Backend

1. **Enable Caching**:
```javascript
app.use(express.static('public', { maxAge: '1d' }));
```

2. **Use Connection Pooling**:
Already implemented in `connection.js`

3. **Add Database Indexes**:
Already included in schema

### Frontend

1. **Minify CSS/JS**: Use build tools like webpack
2. **Lazy Loading**: Images and components
3. **Service Workers**: For offline capability

## Production Deployment

### Backend to Heroku

```bash
# Create Heroku app
heroku create mineguard-api

# Set environment
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Frontend to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=.
```

## Testing Endpoints

### Using curl

```bash
# Health check
curl http://localhost:3001/health

# API info
curl http://localhost:3001/api

# Login
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mineguard.com","password":"admin123"}'
```

### Using Postman

1. Import the API endpoints
2. Set base URL: `http://localhost:3001/api`
3. Test endpoints with provided requests

## Development Workflow

### File Structure During Development

```
c:/HCI/
├── index.html              # Main file
├── assets/
│   ├── styles.css         # Frontend styles
│   └── app.js             # Frontend logic
├── backend/               # Backend server
└── docs/                  # Documentation
```

### Making Changes

1. **Backend Changes**: Restart server (`npm start`)
2. **Frontend Changes**: Refresh browser (Ctrl+F5)
3. **Database Changes**: Run `npm run init-db`

## Next Steps

1. Create additional user accounts
2. Generate sample hazard reports
3. Test admin dashboard features
4. Customize color scheme in CSS
5. Deploy to production

## Getting Help

- Check [README.md](../README.md) for overview
- Check [API.md](./API.md) for API documentation
- Check browser console (F12) for errors
- Check backend console for server logs

## Security Checklist

- [ ] Change default admin password in production
- [ ] Use strong passwords for admin accounts
- [ ] Enable HTTPS in production
- [ ] Configure firewall rules
- [ ] Backup database regularly
- [ ] Monitor server logs
- [ ] Update dependencies regularly

---

**Last Updated**: 2026  
**Version**: 1.0.0
