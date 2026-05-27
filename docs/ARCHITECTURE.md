# MineGuard System Architecture

## Overview

MineGuard is a full-stack web application built using a modern three-tier architecture:
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js + Express.js
- **Database**: SQLite3

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT TIER (Frontend)                   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Web Browser (HTML/CSS/JavaScript)            │   │
│  │  - index.html (Main document)                         │   │
│  │  - assets/styles.css (Responsive design)              │   │
│  │  - assets/app.js (Client logic)                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
└───────────────────────────┼───────────────────────────────────┘
                            │ HTTP/REST
                            │ JSON
                            │ CORS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION TIER (Backend)                  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Express.js Server (Node.js)              │   │
│  │  - Port: 3001                                         │   │
│  │  - CORS Enabled                                       │   │
│  │                                                        │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │              Routes & Controllers               │  │   │
│  │  │                                                 │  │   │
│  │  │  /api/users/                                   │  │   │
│  │  │  - GET /          (List all users)             │  │   │
│  │  │  - GET /:id       (Get specific user)          │  │   │
│  │  │  - POST /         (Create user/signup)         │  │   │
│  │  │  - POST /login    (Authenticate user)          │  │   │
│  │  │  - PUT /:id       (Update user)                │  │   │
│  │  │  - DELETE /:id    (Delete user)                │  │   │
│  │  │  - POST /:id/make-admin (Promote admin)        │  │   │
│  │  │                                                 │  │   │
│  │  │  /api/reports/                                 │  │   │
│  │  │  - GET /          (List reports, with filters) │  │   │
│  │  │  - GET /:id       (Get specific report)        │  │   │
│  │  │  - POST /         (Create report)              │  │   │
│  │  │  - PUT /:id       (Update report)              │  │   │
│  │  │  - DELETE /:id    (Delete report)              │  │   │
│  │  │  - POST /:id/comments (Add comment)            │  │   │
│  │  │  - GET /:id/comments (Get comments)            │  │   │
│  │  │  - GET /stats/summary (Dashboard stats)        │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                        │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │          Middleware & Services                 │  │   │
│  │  │  - CORS Middleware                             │  │   │
│  │  │  - Body Parser                                 │  │   │
│  │  │  - Error Handling                              │  │   │
│  │  │  - Request Logging                             │  │   │
│  │  │  - Graceful Shutdown                           │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
└───────────────────────────┼───────────────────────────────────┘
                            │ SQL Queries
                            │ Async Operations
                            │ Connection Pooling
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA TIER (Database)                      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              SQLite3 Database                         │   │
│  │  - File: backend/data/mineguard.db                   │   │
│  │                                                        │   │
│  │  Tables:                                              │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ users                                        │   │   │
│  │  │ - id (UUID)                                  │   │   │
│  │  │ - name, email, password                      │   │   │
│  │  │ - department, role                           │   │   │
│  │  │ - createdAt, updatedAt                       │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                        │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ reports                                      │   │   │
│  │  │ - id (UUID)                                  │   │   │
│  │  │ - userId (FK)                                │   │   │
│  │  │ - hazardType, severity, location             │   │   │
│  │  │ - description, affectedPeople                │   │   │
│  │  │ - immediateAction                            │   │   │
│  │  │ - status, submittedDate, updatedAt           │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                        │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ report_comments                              │   │   │
│  │  │ - id (UUID)                                  │   │   │
│  │  │ - reportId (FK)                              │   │   │
│  │  │ - userId (FK)                                │   │   │
│  │  │ - comment, createdAt                         │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                        │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ notifications                                 │   │   │
│  │  │ - id (UUID)                                  │   │   │
│  │  │ - userId (FK)                                │   │   │
│  │  │ - message, type, read                        │   │   │
│  │  │ - createdAt                                  │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                        │   │
│  │  Indexes:                                              │   │
│  │  - idx_reports_userId                                 │   │
│  │  - idx_reports_status                                 │   │
│  │  - idx_reports_severity                               │   │
│  │  - idx_comments_reportId                              │   │
│  │  - idx_notifications_userId                           │   │
│  │  - idx_users_email                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### File Structure
```
Frontend (c:\HCI)
├── index.html              # Single Page Application
├── assets/
│   ├── styles.css         # CSS Styling (2500+ lines)
│   └── app.js             # Client Logic (600+ lines)
└── docs/
    ├── SETUP.md           # Setup instructions
    ├── API.md             # API documentation
    └── ARCHITECTURE.md    # This file
```

### Frontend Flow

```
User Action
    │
    ▼
Event Listener (JavaScript)
    │
    ├─────────────────────────────┐
    │                             │
    ▼                             ▼
Form Submission            Navigation
    │                             │
    ▼                             ▼
Data Validation         Show/Hide Sections
    │                             │
    ▼                             ▼
API Call (Fetch)        Update DOM
    │
    ├──────────────────────┐
    │                      │
    ▼                      ▼
Success             Error
    │                      │
    ▼                      ▼
Update State        Show Notification
    │                      │
    └──────────┬───────────┘
               │
               ▼
          Update UI
```

### Key Components

#### 1. Navigation System
- Sticky header with responsive menu
- Hamburger menu for mobile
- User authentication links
- Admin controls (if applicable)

#### 2. Authentication Module
- Login/Signup forms
- Password validation
- Session management (localStorage)
- User state tracking

#### 3. Hazard Reporting Form
- Multi-field form with validation
- Hazard type selection
- Severity level dropdown
- Location and description inputs
- API submission

#### 4. Dashboard
- Statistics cards (total, pending, resolved, critical)
- Reports table with filtering
- Report detail viewer
- Status updates (admin only)

#### 5. Admin Dashboard
- Three tabs: Overview, Reports, Users
- Comprehensive statistics
- Report management
- User management
- Role assignment

## Backend Architecture

### File Structure
```
Backend (c:\HCI\backend)
├── package.json                    # Dependencies
├── .env.example                    # Environment template
├── src/
│   ├── server.js                  # Express app setup
│   ├── routes/
│   │   ├── users.js               # User endpoints
│   │   └── reports.js             # Report endpoints
│   └── db/
│       ├── connection.js           # Database connection
│       └── initDatabase.js         # Schema & initialization
└── data/
    └── mineguard.db               # SQLite database (auto-created)
```

### Request Flow

```
HTTP Request
    │
    ▼
Express Middleware
    ├── CORS Handler
    ├── Body Parser
    ├── Request Logger
    └── Error Handler
    │
    ▼
Router (routes/users.js or routes/reports.js)
    │
    ▼
Route Handler
    ├── Validate Input
    ├── Query/Modify Database
    ├── Return Response
    └── Handle Errors
    │
    ▼
Response (JSON)
    │
    ▼
Client (Browser)
```

### Database Connection

```
Express Server
    │
    ▼
Database Manager (connection.js)
    │
    ├── connect()      # Establish connection
    ├── run()          # Execute SQL (INSERT, UPDATE, DELETE)
    ├── get()          # Fetch single row
    ├── all()          # Fetch all rows
    └── close()        # Close connection
    │
    ▼
SQLite3
    │
    ▼
mineguard.db
```

## Data Flow Examples

### Example 1: User Registration

```
1. User fills signup form
2. Client validates input
3. POST /api/users
4. Backend validates email uniqueness
5. Hash password
6. Insert into users table
7. Return user object (without password)
8. Client stores user in localStorage
9. Redirect to dashboard
```

### Example 2: Creating a Report

```
1. User selects "Report Hazard"
2. Form opens with fields
3. User fills form
4. Submit button clicked
5. Client validates required fields
6. POST /api/reports
7. Backend validates input
8. Generate UUID for report
9. Insert into reports table
10. Return report object
11. Show confirmation message
12. Redirect to dashboard
13. Dashboard loads all user reports
```

### Example 3: Updating Report Status (Admin)

```
1. Admin clicks "Admin Dashboard"
2. Load all reports
3. Admin opens report details
4. Select new status from dropdown
5. PUT /api/reports/:id
6. Backend validates permissions
7. Update status in database
8. Return updated report
9. Refresh admin view
10. Show success notification
```

## Security Architecture

### Authentication
- User credentials stored with SHA-256 hashing
- Password validation on login
- Session management via localStorage
- No authentication tokens (stateless for simplicity)

### Authorization
- Role-based access (user, admin)
- Frontend checks for admin status
- Backend validates requests
- Protected endpoints for admin functions

### Data Protection
- CORS prevents unauthorized requests
- Input validation on all endpoints
- SQL statements use parameterized queries (prevents injection)
- Foreign key constraints in database

## Performance Optimization

### Frontend
- Single Page Application (no page reloads)
- Lazy loading of sections
- CSS variables for efficient styling
- Minimal DOM manipulation

### Backend
- Connection pooling in database manager
- Indexed database columns for faster queries
- Async/await for non-blocking operations
- Graceful error handling

### Database
- Indexes on frequently queried fields:
  - userId (for filtering user reports)
  - status (for dashboard filtering)
  - severity (for critical hazard reports)
- Foreign key constraints maintain data integrity

## Scalability Considerations

### Horizontal Scaling
- Stateless backend (can run multiple instances)
- Load balancer for traffic distribution
- Shared database (with proper locking)

### Vertical Scaling
- Database indexing for large datasets
- Pagination for report lists
- Caching frequently accessed data

### Future Improvements
- Message queuing for async tasks
- Caching layer (Redis)
- Database replication
- Microservices architecture

## Error Handling

### Frontend
- Try-catch blocks for API calls
- User notifications for errors
- Console logging for debugging
- Fallback UI states

### Backend
- Comprehensive error middleware
- Detailed error logging
- Proper HTTP status codes
- Error messages to client

### Database
- Foreign key constraints
- Data validation
- Transaction support (SQLite3)

## Testing Strategy

### Unit Testing
- Validate individual functions
- Test database queries
- Test API endpoints

### Integration Testing
- Test frontend-backend communication
- Verify complete workflows
- Test authentication flow

### Performance Testing
- Load testing with multiple requests
- Database query optimization
- Response time monitoring

## Deployment Architecture

### Development
```
Developer Machine
├── Frontend (index.html)
├── Backend (npm start)
└── Database (SQLite)
```

### Production
```
CDN/Static Hosting
├── Frontend (index.html, CSS, JS)
    │
    ├──► API Server (Heroku/Railway)
         └─► PostgreSQL (Cloud DB)
```

## Technology Rationale

| Component | Choice | Reason |
|-----------|--------|--------|
| Frontend  | Vanilla JS | No build process, lightweight, works offline |
| Backend   | Node.js | JavaScript across stack, npm ecosystem |
| Framework | Express.js | Minimal, flexible, fast |
| Database  | SQLite3 | Simple, file-based, no setup needed |
| Password  | SHA-256 | Simple, adequate for internal tools |

## Future Architecture Enhancements

1. **Authentication**: Implement JWT tokens
2. **Caching**: Add Redis for session/data caching
3. **Real-time**: WebSocket for live updates
4. **Microservices**: Split into user/report services
5. **Monitoring**: Add APM tools
6. **Testing**: Jest for unit tests
7. **CI/CD**: GitHub Actions for deployment
8. **Analytics**: Add usage tracking

---

**Version**: 1.0.0  
**Last Updated**: 2026  
**Status**: Production Ready
