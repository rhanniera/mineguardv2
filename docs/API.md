# MineGuard API Documentation

## Base URL

```
http://localhost:3001/api
```

## Response Format

All responses are in JSON format with the following structure:

### Success Response
```json
{
    "message": "Operation successful",
    "data": {}
}
```

### Error Response
```json
{
    "message": "Error description",
    "error": "Detailed error"
}
```

## Status Codes

- `200`: OK - Request successful
- `201`: Created - Resource created successfully
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Authentication failed
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server error

---

## Users Endpoints

### Register New User

**Endpoint**: `POST /users`

**Request Body**:
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Mining Operations",
    "password": "securePassword123"
}
```

**Response** (201):
```json
{
    "message": "User created successfully",
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "email": "john@example.com",
        "department": "Mining Operations",
        "role": "user"
    }
}
```

**Errors**:
- `400`: Missing required fields
- `400`: Email already registered

---

### User Login

**Endpoint**: `POST /users/login`

**Request Body**:
```json
{
    "email": "john@example.com",
    "password": "securePassword123"
}
```

**Response** (200):
```json
{
    "message": "Login successful",
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "email": "john@example.com",
        "department": "Mining Operations",
        "role": "user",
        "createdAt": "2026-01-15T10:30:00Z",
        "updatedAt": "2026-01-15T10:30:00Z"
    }
}
```

**Errors**:
- `400`: Email and password required
- `401`: Invalid email or password

---

### Get All Users (Admin)

**Endpoint**: `GET /users`

**Response** (200):
```json
[
    {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "email": "john@example.com",
        "department": "Mining Operations",
        "role": "user",
        "createdAt": "2026-01-15T10:30:00Z"
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "department": "Safety",
        "role": "admin",
        "createdAt": "2026-01-14T09:15:00Z"
    }
]
```

---

### Get Specific User

**Endpoint**: `GET /users/:id`

**Path Parameters**:
- `id` (string): User ID

**Response** (200):
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Mining Operations",
    "role": "user",
    "createdAt": "2026-01-15T10:30:00Z"
}
```

**Errors**:
- `404`: User not found

---

### Update User Profile

**Endpoint**: `PUT /users/:id`

**Path Parameters**:
- `id` (string): User ID

**Request Body** (any of these fields):
```json
{
    "name": "Jane Doe",
    "department": "Operations",
    "password": "newPassword123"
}
```

**Response** (200):
```json
{
    "message": "User updated successfully",
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Jane Doe",
        "email": "john@example.com",
        "department": "Operations",
        "role": "user"
    }
}
```

**Errors**:
- `400`: No fields to update
- `404`: User not found

---

### Delete User

**Endpoint**: `DELETE /users/:id`

**Path Parameters**:
- `id` (string): User ID

**Response** (200):
```json
{
    "message": "User deleted successfully"
}
```

**Errors**:
- `404`: User not found

---

### Promote User to Admin

**Endpoint**: `POST /users/:id/make-admin`

**Path Parameters**:
- `id` (string): User ID

**Response** (200):
```json
{
    "message": "User promoted to admin"
}
```

**Errors**:
- `404`: User not found

---

## Reports Endpoints

### Create New Report

**Endpoint**: `POST /reports`

**Request Body**:
```json
{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "hazardType": "physical",
    "severity": "high",
    "location": "Mine A - Level 3",
    "description": "Loose cable creating tripping hazard near equipment",
    "affectedPeople": 5,
    "immediateAction": "Area cordoned off with warning tape",
    "status": "pending"
}
```

**Hazard Types**:
- `physical`: Physical Hazard
- `chemical`: Chemical Exposure
- `biological`: Biological Hazard
- `ergonomic`: Ergonomic Issue
- `environmental`: Environmental Hazard
- `equipment`: Equipment Malfunction
- `other`: Other

**Severity Levels**:
- `low`: Low
- `medium`: Medium
- `high`: High
- `critical`: Critical

**Response** (201):
```json
{
    "message": "Report created successfully",
    "report": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "hazardType": "physical",
        "severity": "high",
        "location": "Mine A - Level 3",
        "description": "Loose cable creating tripping hazard near equipment",
        "affectedPeople": 5,
        "immediateAction": "Area cordoned off with warning tape",
        "status": "pending",
        "submittedDate": "2026-01-15T11:45:00Z",
        "updatedAt": "2026-01-15T11:45:00Z"
    }
}
```

**Errors**:
- `400`: Missing required fields

---

### Get All Reports

**Endpoint**: `GET /reports`

**Query Parameters** (optional):
- `userId` (string): Filter by user ID
- `status` (string): Filter by status (pending, in-progress, resolved, closed)
- `severity` (string): Filter by severity (low, medium, high, critical)

**Examples**:
```
GET /reports
GET /reports?userId=550e8400-e29b-41d4-a716-446655440000
GET /reports?status=pending
GET /reports?severity=critical
GET /reports?status=pending&severity=high
```

**Response** (200):
```json
[
    {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "hazardType": "physical",
        "severity": "high",
        "location": "Mine A - Level 3",
        "description": "Loose cable creating tripping hazard",
        "affectedPeople": 5,
        "immediateAction": "Area cordoned off",
        "status": "pending",
        "submittedDate": "2026-01-15T11:45:00Z",
        "updatedAt": "2026-01-15T11:45:00Z"
    }
]
```

---

### Get Specific Report

**Endpoint**: `GET /reports/:id`

**Path Parameters**:
- `id` (string): Report ID

**Response** (200):
```json
{
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "hazardType": "physical",
    "severity": "high",
    "location": "Mine A - Level 3",
    "description": "Loose cable creating tripping hazard",
    "affectedPeople": 5,
    "immediateAction": "Area cordoned off",
    "status": "pending",
    "submittedDate": "2026-01-15T11:45:00Z",
    "updatedAt": "2026-01-15T11:45:00Z",
    "comments": [
        {
            "id": "770e8400-e29b-41d4-a716-446655440001",
            "userId": "550e8400-e29b-41d4-a716-446655440001",
            "comment": "Repair scheduled for tomorrow",
            "name": "Jane Smith",
            "createdAt": "2026-01-15T14:20:00Z"
        }
    ]
}
```

**Errors**:
- `404`: Report not found

---

### Update Report

**Endpoint**: `PUT /reports/:id`

**Path Parameters**:
- `id` (string): Report ID

**Request Body** (any of these fields):
```json
{
    "status": "in-progress",
    "severity": "critical",
    "immediateAction": "Updated immediate action"
}
```

**Response** (200):
```json
{
    "message": "Report updated successfully",
    "report": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "hazardType": "physical",
        "severity": "critical",
        "location": "Mine A - Level 3",
        "description": "Loose cable creating tripping hazard",
        "affectedPeople": 5,
        "immediateAction": "Updated immediate action",
        "status": "in-progress",
        "submittedDate": "2026-01-15T11:45:00Z",
        "updatedAt": "2026-01-15T15:00:00Z"
    }
}
```

**Errors**:
- `400`: No fields to update
- `404`: Report not found

---

### Delete Report

**Endpoint**: `DELETE /reports/:id`

**Path Parameters**:
- `id` (string): Report ID

**Response** (200):
```json
{
    "message": "Report deleted successfully"
}
```

**Errors**:
- `404`: Report not found

---

### Add Comment to Report

**Endpoint**: `POST /reports/:id/comments`

**Path Parameters**:
- `id` (string): Report ID

**Request Body**:
```json
{
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "comment": "Repair completed and verified"
}
```

**Response** (201):
```json
{
    "message": "Comment added successfully",
    "comment": {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "userId": "550e8400-e29b-41d4-a716-446655440001",
        "comment": "Repair completed and verified",
        "name": "Jane Smith",
        "createdAt": "2026-01-15T16:30:00Z"
    }
}
```

**Errors**:
- `400`: Missing required fields
- `404`: Report not found

---

### Get Report Comments

**Endpoint**: `GET /reports/:id/comments`

**Path Parameters**:
- `id` (string): Report ID

**Response** (200):
```json
[
    {
        "id": "770e8400-e29b-41d4-a716-446655440001",
        "userId": "550e8400-e29b-41d4-a716-446655440001",
        "comment": "Repair scheduled for tomorrow",
        "name": "Jane Smith",
        "createdAt": "2026-01-15T14:20:00Z"
    },
    {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "userId": "550e8400-e29b-41d4-a716-446655440001",
        "comment": "Repair completed and verified",
        "name": "Jane Smith",
        "createdAt": "2026-01-15T16:30:00Z"
    }
]
```

**Errors**:
- `404`: Report not found

---

### Get Dashboard Statistics

**Endpoint**: `GET /reports/stats/summary`

**Response** (200):
```json
{
    "totalReports": 45,
    "pendingReports": 8,
    "resolvedReports": 32,
    "criticalReports": 5
}
```

---

## Health Endpoints

### API Health Check

**Endpoint**: `GET /health`

**Response** (200):
```json
{
    "status": "ok",
    "timestamp": "2026-01-15T17:00:00.000Z"
}
```

---

### API Info

**Endpoint**: `GET /api`

**Response** (200):
```json
{
    "name": "MineGuard API",
    "version": "1.0.0",
    "endpoints": {
        "users": "/api/users",
        "reports": "/api/reports"
    }
}
```

---

## Example Usage

### JavaScript/Fetch

```javascript
// Get all reports
fetch('http://localhost:3001/api/reports')
    .then(response => response.json())
    .then(data => console.log(data));

// Create new report
fetch('http://localhost:3001/api/reports', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        userId: 'user-id',
        hazardType: 'physical',
        severity: 'high',
        location: 'Mine A',
        description: 'Safety hazard description'
    })
})
.then(response => response.json())
.then(data => console.log(data));
```

### cURL

```bash
# Get all reports
curl http://localhost:3001/api/reports

# Create new user
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Operations",
    "password": "password123"
  }'

# Update report
curl -X PUT http://localhost:3001/api/reports/report-id \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in-progress"
  }'
```

---

## Error Handling

### Common Errors

```json
{
    "message": "Missing required fields",
    "error": "Missing: email, password"
}
```

```json
{
    "message": "Invalid email or password",
    "error": "Authentication failed"
}
```

```json
{
    "message": "Email already registered",
    "error": "User already exists"
}
```

---

## Rate Limiting

No rate limiting implemented. Recommended for production:
- Implement rate limiting per IP
- Cache frequently accessed endpoints
- Add pagination for large datasets

---

## Versioning

**Current Version**: 1.0.0

API versioning via URL path (planned for v2):
```
/api/v2/users
/api/v2/reports
```

---

**Last Updated**: 2026  
**Status**: Production Ready
