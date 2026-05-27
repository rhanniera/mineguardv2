# MineGuard - Workplace Hazard Reporting System

A comprehensive web-based system for reporting and tracking workplace hazards in the mining industry. Built with modern web technologies, MineGuard provides a secure, user-friendly platform for hazard reporting, real-time tracking, and safety management.

## 🎯 Overview

MineGuard is a full-stack web application designed to:
- **Report Hazards**: Quickly submit detailed hazard reports with categorization and severity levels
- **Track Status**: Monitor report status from submission to resolution
- **Manage Data**: Admin dashboard for managing reports, users, and safety metrics
- **Ensure Safety**: Maintain detailed records and analytics for workplace safety

## ✨ Key Features

### For Users
- **User Authentication**: Secure login and registration system
- **Hazard Reporting Form**: Intuitive form for reporting various hazard types
- **Dashboard**: View personal reports and their current status
- **Real-time Status Tracking**: Monitor report progress
- **Profile Management**: Manage user account and view reporting history
- **Notifications**: Get updates on report status changes

### For Administrators
- **Admin Dashboard**: Comprehensive overview of all reports and users
- **Report Management**: Review, update, and manage hazard reports
- **User Management**: Manage user accounts and assign admin roles
- **Statistics**: View key safety metrics and analytics
- **Report Filtering**: Filter reports by status, severity, and other criteria

### General Features
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Professional UI**: Clean, modern interface with intuitive navigation
- **Data Persistence**: SQLite database for reliable data storage
- **RESTful API**: Clean, well-documented API endpoints
- **Security**: Password hashing and secure data handling

## 🏗️ Project Structure

```
MineGuard/
├── index.html                 # Main HTML file
├── assets/
│   ├── styles.css            # CSS styling
│   └── app.js                # Frontend JavaScript
├── backend/                  # Node.js Backend
│   ├── package.json          # Dependencies
│   ├── .env.example          # Environment template
│   └── src/
│       ├── server.js         # Express server
│       ├── routes/
│       │   ├── users.js      # User endpoints
│       │   └── reports.js    # Report endpoints
│       └── db/
│           ├── connection.js # Database connection
│           └── initDatabase.js # Schema initialization
├── docs/
│   ├── SETUP.md              # Setup instructions
│   ├── API.md                # API documentation
│   └── ARCHITECTURE.md       # System architecture
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser

### Frontend Only (with mock data)
1. Open `index.html` in a web browser
2. The app will work with localStorage for data persistence

### Full Stack Setup

#### 1. Backend Setup
```bash
cd backend
npm install
npm run init-db
npm start
```

Server will run on `http://localhost:3001`

#### 2. Frontend Setup
```bash
# Update the API URL in index.html or run a local server
python -m http.server 5500
# or
npx http-server
```

Access the app at `http://localhost:5500` or the server URL.

## 📖 Usage Guide

### User Registration & Login
1. Click "Sign Up" to create a new account
2. Fill in your details and create a password
3. Login with your email and password
4. Access your dashboard

### Reporting a Hazard
1. Click "Report Hazard" in the navigation
2. Select the hazard type from the dropdown
3. Set the severity level (Low, Medium, High, Critical)
4. Enter the location and detailed description
5. Optionally specify number of affected people and immediate actions taken
6. Submit the report
7. Track your report in the Dashboard

### Dashboard
- View all your submitted reports
- See report status (Pending, In Progress, Resolved, Closed)
- Click "View" to see detailed report information
- Track severity levels and locations

### Admin Functions (if you have admin role)
1. Click "Admin Dashboard" in navigation
2. **Overview Tab**: See key statistics
3. **Manage Reports Tab**: Review all reports, filter by status
4. **Manage Users Tab**: View all users, promote to admin

## 🔧 Technology Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern responsive design with CSS variables
- **Vanilla JavaScript**: No dependencies, pure JS
- **Font Awesome 6**: Icon library

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **SQLite3**: Database
- **CORS**: Cross-origin resource sharing
- **UUID**: Unique identifier generation
- **Dotenv**: Environment configuration

## 📡 API Endpoints

### Users
- `POST /api/users` - Create new user (signup)
- `POST /api/users/login` - User login
- `GET /api/users` - List all users (admin)
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user (admin)
- `POST /api/users/:id/make-admin` - Promote user to admin

### Reports
- `POST /api/reports` - Create new report
- `GET /api/reports` - List reports (with filters)
- `GET /api/reports/:id` - Get specific report
- `PUT /api/reports/:id` - Update report status
- `DELETE /api/reports/:id` - Delete report
- `POST /api/reports/:id/comments` - Add comment to report
- `GET /api/reports/:id/comments` - Get report comments
- `GET /api/reports/stats/summary` - Get dashboard statistics

## 🛡️ Security Features

- **Password Hashing**: SHA-256 hashing for password storage
- **CORS Protection**: Configurable cross-origin requests
- **Data Validation**: Input validation on all endpoints
- **Database Constraints**: Foreign keys and unique constraints
- **Error Handling**: Comprehensive error messages

## 🎨 Customization

### Color Scheme
Edit CSS variables in `assets/styles.css`:
```css
:root {
    --primary: #4a90e2;
    --secondary: #50c878;
    --danger: #e74c3c;
    /* ... more variables */
}
```

### Database
To use a different database:
1. Modify `backend/src/db/connection.js`
2. Update schema in `backend/src/db/initDatabase.js`
3. Install appropriate driver package

## 📝 Default Login Credentials

After running `npm run init-db`:
- **Email**: admin@mineguard.com
- **Password**: admin123

**⚠️ Change these credentials in production!**

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Ensure Node.js is installed: `node --version`
- Check database file exists in `backend/data/`

### CORS errors
- Update CORS_ORIGIN in `.env` file
- Add your frontend URL to CORS whitelist

### Database errors
- Delete `backend/data/mineguard.db` and reinitialize
- Check file permissions on `backend/data/` directory

### Frontend not connecting to API
- Ensure backend is running on port 3001
- Check browser console for errors (F12)
- Verify CORS configuration

## 📊 Database Schema

### Users Table
- `id`: Unique identifier (UUID)
- `name`: Full name
- `email`: Email address (unique)
- `password`: Hashed password
- `department`: Department/team name
- `role`: User role (user/admin)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Reports Table
- `id`: Unique identifier (UUID)
- `userId`: Reference to user
- `hazardType`: Type of hazard
- `severity`: Severity level (low/medium/high/critical)
- `location`: Hazard location
- `description`: Detailed description
- `affectedPeople`: Number of people affected
- `immediateAction`: Immediate actions taken
- `status`: Report status (pending/in-progress/resolved/closed)
- `submittedDate`: Submission timestamp
- `updatedAt`: Last update timestamp

### Comments Table
- `id`: Unique identifier (UUID)
- `reportId`: Reference to report
- `userId`: Reference to user
- `comment`: Comment text
- `createdAt`: Creation timestamp

## 🚢 Deployment

### Frontend
Deploy to any static hosting:
- GitHub Pages
- Vercel
- Netlify
- AWS S3 + CloudFront

### Backend
Deploy to any Node.js hosting:
- Heroku
- Railway
- Render
- AWS EC2

## 📚 Additional Documentation

- [Setup Guide](docs/SETUP.md) - Detailed setup instructions
- [API Documentation](docs/API.md) - Complete API reference
- [Architecture](docs/ARCHITECTURE.md) - System architecture details

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👥 Contributors

Created as a workplace safety solution for the mining industry.

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review the documentation
3. Check browser console for errors
4. Ensure all prerequisites are installed

## 🔐 Privacy & Security

- Reports are confidential and encrypted
- User data is protected with strict security protocols
- No data is shared with third parties
- Regular security audits recommended
- GDPR compliant architecture

---

**Version**: 1.0.0  
**Last Updated**: 2026  
**Status**: Production Ready
