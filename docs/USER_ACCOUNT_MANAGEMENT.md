# User Account Management System

## Overview
The User Account Management System is a comprehensive user lifecycle management solution with **Administrator Account Protection** built-in. It ensures data integrity, security, and maintains system stability by preventing unauthorized modifications to administrator accounts.

---

## Core Principles

### 1. Administrator Account Protection
- **The system ALWAYS maintains at least one Administrator account**
- Administrator accounts **CANNOT be deleted**
- Administrator role **CANNOT be downgraded or changed**
- This is enforced at the API level with explicit validation

### 2. Role-Based Access Control
| Operation | Admin | User |
|-----------|-------|------|
| Create user | ✅ | ✅ (self) |
| Read users | ✅ | ❌ |
| Update own profile | ✅ | ✅ |
| Update other user | ✅ | ❌ |
| Delete user | ✅ | ❌ |
| Promote to Admin | ✅ | ❌ |
| Demote from Admin | ✅ | ❌ |

---

## Database Schema

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,           -- SHA-256 hashed
    department TEXT,
    role TEXT DEFAULT 'user',         -- 'admin' or 'user'
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Endpoints

### 1. CREATE User

**Endpoint:** `POST /api/users`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "department": "Mining Operations",
  "password": "securePassword123"
}
```

**Validations:**
- ✅ All required fields present (name, email, password)
- ✅ Valid email format (must contain @ and .)
- ✅ Password length >= 6 characters
- ✅ Email not already registered
- ✅ Password automatically hashed using SHA-256

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "code": "USER_CREATED",
  "user": {
    "id": "uuid-1234",
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Mining Operations",
    "role": "user"
  }
}
```

**Error Responses:**
```json
// Missing fields
{
  "success": false,
  "message": "Missing required fields",
  "code": "VALIDATION_ERROR",
  "details": "Required fields: name, email, password"
}

// Invalid email
{
  "success": false,
  "message": "Invalid email format",
  "code": "INVALID_EMAIL"
}

// Email already exists
{
  "success": false,
  "message": "Email already registered",
  "code": "EMAIL_ALREADY_EXISTS"
}

// Password too short
{
  "success": false,
  "message": "Password too short",
  "code": "PASSWORD_TOO_SHORT",
  "details": "Password must be at least 6 characters long"
}
```

---

### 2. READ Users

**Endpoint:** `GET /api/users` - Get all users
**Endpoint:** `GET /api/users?role=admin` - Filter by role
**Endpoint:** `GET /api/users/:id` - Get specific user

**Success Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "code": "USERS_RETRIEVED",
  "count": 6,
  "users": [
    {
      "id": "uuid-1234",
      "name": "Administrator",
      "email": "admin@example.com",
      "department": "Management",
      "role": "admin",
      "createdAt": "2026-05-27T02:24:20",
      "updatedAt": "2026-05-27T02:24:20"
    },
    ...
  ]
}
```

---

### 3. UPDATE User Profile

**Endpoint:** `PUT /api/users/:id`

**Request Body:**
```json
{
  "name": "Jane Doe",
  "department": "Safety",
  "password": "newPassword123"
}
```

**Protections:**
- ✅ Cannot downgrade an Admin to User
- ✅ Cannot change Admin role
- ✅ Only Admin can update other users
- ✅ Password automatically hashed
- ✅ `updatedAt` timestamp automatically updated

**Success Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "code": "USER_UPDATED",
  "user": {
    "id": "uuid-1234",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "department": "Safety",
    "role": "user",
    "updatedAt": "2026-05-28T10:30:45"
  }
}
```

**Error Response - Admin Protection:**
```json
{
  "success": false,
  "message": "Error: Cannot change Administrator role",
  "code": "ADMIN_ROLE_PROTECTION_VIOLATION",
  "details": "Administrator accounts cannot be downgraded or have their role changed. The system must always maintain an Administrator account."
}
```

---

### 4. DELETE User

**Endpoint:** `DELETE /api/users/:id`

**Delete Validation Logic:**
```
IF user.role == "Admin":
    DENY deletion ❌
ELSE:
    ALLOW deletion ✅
```

**Protections:**
- ✅ **DENIES deletion of any Administrator account**
- ✅ Cascading delete: removes user's reports, comments, and notifications
- ✅ Only Admin can delete users

**Success Response:**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "code": "USER_DELETED",
  "details": {
    "userId": "uuid-1234",
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "reportsDeleted": 5
  }
}
```

**Error Response - Admin Protection:**
```json
{
  "success": false,
  "message": "Error: Cannot delete Administrator account",
  "code": "ADMIN_PROTECTION_VIOLATION",
  "details": "The user 'Administrator' (admin@example.com) is an Administrator and cannot be deleted. System must always maintain at least one Administrator account."
}
```

**Error Response - User Not Found:**
```json
{
  "success": false,
  "message": "User not found",
  "code": "USER_NOT_FOUND"
}
```

---

### 5. Promote User to Admin

**Endpoint:** `POST /api/users/:id/make-admin`

**Promotion Validation:**
- ✅ User must exist
- ✅ User must not already be Admin
- ✅ Updates `updatedAt` timestamp

**Success Response:**
```json
{
  "success": true,
  "message": "User promoted to Administrator",
  "code": "PROMOTED_TO_ADMIN",
  "user": {
    "id": "uuid-1234",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

---

### 6. Demote Admin to User

**Endpoint:** `POST /api/users/:id/demote`

**Demotion Validation:**
- ✅ User must exist
- ✅ User must not be the last Admin
- ✅ Prevents leaving the system without an Administrator

**Success Response:**
```json
{
  "success": true,
  "message": "User demoted to regular User",
  "code": "DEMOTED_TO_USER",
  "user": {
    "id": "uuid-1234",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Error Response - Last Admin Protection:**
```json
{
  "success": false,
  "message": "Error: Cannot demote the last Administrator",
  "code": "ADMIN_COUNT_PROTECTION_VIOLATION",
  "details": "The system must always maintain at least one Administrator account. Cannot demote the last admin."
}
```

---

### 7. User Login

**Endpoint:** `POST /api/users/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validations:**
- ✅ Email and password required
- ✅ User exists
- ✅ Password matches (SHA-256 verified)

**Success Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "code": "LOGIN_SUCCESS",
  "user": {
    "id": "uuid-1234",
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Mining",
    "role": "user",
    "createdAt": "2026-05-27T10:20:30",
    "updatedAt": "2026-05-27T10:20:30"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "code": "AUTH_FAILED"
}
```

---

## Data Consistency Guarantees

### Immediate Database Persistence
Every operation follows this pattern:
1. **Validate** - Check all business rules
2. **Execute** - Perform database operation
3. **Confirm** - Return updated data to client
4. **Log** - Record operation for audit trail

### Cascading Operations
When a user is deleted, the system automatically:
- ✅ Deletes all their reports
- ✅ Deletes all comments on their reports
- ✅ Deletes all notifications for that user
- ✅ Maintains referential integrity

### Timestamp Management
- `createdAt` - Set once at creation, never modified
- `updatedAt` - Automatically updated on every modification

---

## Response Format Standard

All API responses follow this structure:

**Success (2xx):**
```json
{
  "success": true,
  "message": "Human-readable message",
  "code": "RESPONSE_CODE",
  "data": { ... }
}
```

**Error (4xx/5xx):**
```json
{
  "success": false,
  "message": "Human-readable error",
  "code": "ERROR_CODE",
  "details": "Additional context (if applicable)",
  "error": "Technical error (if applicable)"
}
```

---

## Error Codes Reference

| Code | Status | Meaning |
|------|--------|---------|
| `USER_CREATED` | 201 | User successfully created |
| `USERS_RETRIEVED` | 200 | Users fetched successfully |
| `USER_RETRIEVED` | 200 | Single user fetched |
| `USER_UPDATED` | 200 | User profile updated |
| `USER_DELETED` | 200 | User deleted successfully |
| `PROMOTED_TO_ADMIN` | 200 | User promoted to admin |
| `DEMOTED_TO_USER` | 200 | Admin demoted to user |
| `LOGIN_SUCCESS` | 200 | Login successful |
| `VALIDATION_ERROR` | 400 | Missing/invalid fields |
| `INVALID_EMAIL` | 400 | Email format invalid |
| `PASSWORD_TOO_SHORT` | 400 | Password < 6 chars |
| `EMAIL_ALREADY_EXISTS` | 409 | Email already registered |
| `USER_NOT_FOUND` | 404 | User ID not found |
| `ADMIN_PROTECTION_VIOLATION` | 403 | Cannot delete/modify admin |
| `ADMIN_ROLE_PROTECTION_VIOLATION` | 403 | Cannot change admin role |
| `ADMIN_COUNT_PROTECTION_VIOLATION` | 403 | Cannot demote last admin |
| `AUTH_FAILED` | 401 | Invalid credentials |
| `MISSING_CREDENTIALS` | 400 | Email/password missing |
| `CREATE_ERROR` | 500 | Server error during creation |
| `FETCH_ERROR` | 500 | Server error during fetch |
| `UPDATE_ERROR` | 500 | Server error during update |
| `DELETE_ERROR` | 500 | Server error during deletion |
| `LOGIN_ERROR` | 500 | Server error during login |

---

## Security Features

### Password Security
- ✅ Passwords hashed using SHA-256
- ✅ Minimum 6 characters required
- ✅ Never returned in API responses
- ✅ Verified on login before authentication

### Access Control
- ✅ Role-based restrictions enforced server-side
- ✅ Admin-only operations validated on every request
- ✅ Admin accounts protected from deletion
- ✅ Admin role protected from downgrade

### Data Validation
- ✅ Email format validation
- ✅ Required field validation
- ✅ Duplicate email detection
- ✅ Unique email constraint in database

---

## Example Usage Scenarios

### Scenario 1: Create a New User
```javascript
const response = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Sarah Johnson',
    email: 'sarah@mineguard.com',
    department: 'Safety',
    password: 'SecurePass123'
  })
});
const data = await response.json();
// data.success === true
// data.user contains new user details
```

### Scenario 2: Try to Delete an Admin (DENIED)
```javascript
const response = await fetch('/api/users/admin-uuid', {
  method: 'DELETE'
});
const data = await response.json();
// data.success === false
// data.code === "ADMIN_PROTECTION_VIOLATION"
// Cannot delete Administrator accounts
```

### Scenario 3: Delete a Regular User (ALLOWED)
```javascript
const response = await fetch('/api/users/user-uuid', {
  method: 'DELETE'
});
const data = await response.json();
// data.success === true
// User deleted with all associated reports
```

### Scenario 4: Update User Profile
```javascript
const response = await fetch('/api/users/user-uuid', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Jane Smith',
    department: 'Operations'
  })
});
const data = await response.json();
// data.success === true
// data.user contains updated profile
```

---

## Testing the System

### Test Case 1: Admin Protection on Delete
```
1. Try to DELETE /api/users/{admin-id}
2. Expected: 403 error with ADMIN_PROTECTION_VIOLATION
3. Admin account remains in database
```

### Test Case 2: Admin Protection on Role Change
```
1. Try to PUT /api/users/{admin-id} with role='user'
2. Expected: 403 error with ADMIN_ROLE_PROTECTION_VIOLATION
3. Admin role remains unchanged
```

### Test Case 3: Last Admin Demotion Prevention
```
1. With only 1 admin in system
2. Try to POST /api/users/{admin-id}/demote
3. Expected: 403 error with ADMIN_COUNT_PROTECTION_VIOLATION
4. Admin remains admin
```

### Test Case 4: Valid User Deletion
```
1. Try to DELETE /api/users/{regular-user-id}
2. Expected: 200 success, user deleted
3. All their reports deleted
4. All their notifications deleted
```

---

## Database Consistency Checks

To verify data consistency:

```sql
-- Check total users
SELECT COUNT(*) as total_users FROM users;

-- Check admin count (should be >= 1)
SELECT COUNT(*) as admin_count FROM users WHERE role = 'admin';

-- Check for orphaned reports (should be 0)
SELECT COUNT(*) as orphaned_reports 
FROM reports 
WHERE userId NOT IN (SELECT id FROM users);

-- Check for orphaned comments (should be 0)
SELECT COUNT(*) as orphaned_comments 
FROM report_comments 
WHERE userId NOT IN (SELECT id FROM users);
```

---

## Conclusion

This User Account Management System ensures:
- ✅ Administrator accounts are always protected
- ✅ Data consistency across all operations
- ✅ Comprehensive CRUD functionality
- ✅ Role-based access control
- ✅ Cascading data cleanup
- ✅ Clear error messages and codes
- ✅ Security through validation and hashing
