# Attendance Tracker API Documentation

## Overview
This document describes all available API endpoints for the Attendance Tracker application.

## Authentication
All endpoints (except signup/signin) require authentication via JWT token in cookies.

---

## Auth APIs

### POST /api/auth/signup
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "roll": "2101001",
  "password": "password123",
  "role": "USER", // optional: SUPER_ADMIN, ADMIN, USER
  "domainId": "domain_id" // optional
}
```

**Response:** 201 Created
```json
{
  "message": "Signup successful",
  "user": { ... },
  "token": "jwt_token"
}
```

---

### POST /api/auth/signin
Sign in to existing account.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** 200 OK
```json
{
  "message": "Signin successful",
  "user": { ... },
  "token": "jwt_token"
}
```

---

### GET /api/auth/me
Get current authenticated user details.

**Response:** 200 OK
```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "roll": "2101001",
  "role": "USER",
  "domainId": "domain_id"
}
```

---

## Domain APIs

### POST /api/domains
Create a new domain (SUPER_ADMIN only).

**Request Body:**
```json
{
  "name": "Technical Domain"
}
```

**Response:** 201 Created
```json
{
  "message": "Domain created",
  "domain": {
    "id": "domain_id",
    "name": "Technical Domain",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### GET /api/domains
Get all domains.

**Response:** 200 OK
```json
{
  "domains": [
    {
      "id": "domain_id",
      "name": "Technical Domain",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET /api/domains/[domainId]
Get specific domain with users, events, and statistics.

**Response:** 200 OK
```json
{
  "domain": {
    "id": "domain_id",
    "name": "Technical Domain",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "users": [...],
  "events": [...],
  "stats": {
    "totalUsers": 10,
    "totalEvents": 5,
    "openEvents": 2,
    "closedEvents": 3,
    "admins": 1,
    "members": 9
  }
}
```

---

### DELETE /api/domains/[domainId]
Delete a domain (SUPER_ADMIN only). Domain must be empty (no users or events).

**Response:** 200 OK
```json
{
  "message": "Domain deleted successfully"
}
```

---

## Event APIs

### POST /api/events
Create a new event (ADMIN/SUPER_ADMIN only).

**Request Body:**
```json
{
  "title": "Weekly Meeting",
  "date": "2024-01-15T10:00:00.000Z",
  "domainId": "domain_id" // optional, null for GBM
}
```

**Response:** 201 Created
```json
{
  "message": "Event created successfully",
  "event": {
    "id": "event_id",
    "title": "Weekly Meeting",
    "date": "2024-01-15T10:00:00.000Z",
    "status": "OPEN",
    "domainId": "domain_id",
    "domain": { ... },
    "createdBy": { ... }
  }
}
```

---

### GET /api/events
Get all events with filters.

**Query Parameters:**
- `domainId` - Filter by domain
- `status` - Filter by status (OPEN/CLOSED)
- `q` - Search by title

**Response:** 200 OK
```json
{
  "events": [
    {
      "id": "event_id",
      "title": "Weekly Meeting",
      "date": "2024-01-15T10:00:00.000Z",
      "status": "OPEN",
      "domain": { ... },
      "createdBy": { ... }
    }
  ]
}
```

---

### GET /api/events/[eventId]
Get specific event details.

**Response:** 200 OK
```json
{
  "id": "event_id",
  "title": "Weekly Meeting",
  "date": "2024-01-15T10:00:00.000Z",
  "status": "OPEN",
  "domain": { ... },
  "createdBy": { ... }
}
```

---

### PATCH /api/events/[eventId]
Update event details (ADMIN/SUPER_ADMIN only). Cannot update closed events.

**Request Body:**
```json
{
  "title": "Updated Meeting Title",
  "date": "2024-01-16T10:00:00.000Z",
  "domainId": "new_domain_id" // SUPER_ADMIN only
}
```

**Response:** 200 OK
```json
{
  "message": "Event updated successfully",
  "event": { ... }
}
```

---

### POST /api/events/[eventId]/close
Close an event (ADMIN/SUPER_ADMIN only).

**Response:** 200 OK
```json
{
  "message": "Event closed successfully",
  "event": { ... }
}
```

---

### POST /api/events/[eventId]/open
Reopen a closed event (ADMIN/SUPER_ADMIN only).

**Response:** 200 OK
```json
{
  "message": "Event reopened successfully",
  "event": { ... }
}
```

---

### GET /api/events/[eventId]/attendance
Get all attendance records for an event with statistics.

**Response:** 200 OK
```json
{
  "event": {
    "id": "event_id",
    "title": "Weekly Meeting",
    "date": "2024-01-15T10:00:00.000Z",
    "status": "OPEN",
    "domain": { ... }
  },
  "attendances": [
    {
      "id": "attendance_id",
      "status": "PRESENT",
      "user": { ... },
      "markedBy": { ... }
    }
  ],
  "stats": {
    "total": 10,
    "present": 8,
    "absent": 1,
    "excused": 1,
    "notApplicable": 0
  }
}
```

---

## Attendance APIs

### POST /api/attendance
Mark attendance (single or bulk) (ADMIN/SUPER_ADMIN only).

**Single Attendance Request:**
```json
{
  "eventId": "event_id",
  "userId": "user_id",
  "status": "PRESENT" // PRESENT, ABSENT, EXCUSED, NOT_APPLICABLE
}
```

**Bulk Attendance Request:**
```json
{
  "eventId": "event_id",
  "attendances": [
    {
      "userId": "user_id_1",
      "status": "PRESENT"
    },
    {
      "userId": "user_id_2",
      "status": "ABSENT"
    }
  ]
}
```

**Response:** 201 Created
```json
{
  "message": "Attendance marked successfully",
  "attendance": { ... } // or "attendances": [...] for bulk
}
```

---

### GET /api/attendance
Get attendance records with filters.

**Query Parameters:**
- `eventId` - Filter by event
- `userId` - Filter by user (ADMIN/SUPER_ADMIN only)
- `status` - Filter by status

**Note:** Regular users can only see their own attendance.

**Response:** 200 OK
```json
{
  "attendances": [
    {
      "id": "attendance_id",
      "status": "PRESENT",
      "user": { ... },
      "event": { ... },
      "markedBy": { ... },
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### GET /api/attendance/[attendanceId]
Get specific attendance record.

**Response:** 200 OK
```json
{
  "id": "attendance_id",
  "status": "PRESENT",
  "user": { ... },
  "event": { ... },
  "markedBy": { ... }
}
```

---

### PATCH /api/attendance/[attendanceId]
Update attendance status (ADMIN/SUPER_ADMIN only). Cannot update for closed events.

**Request Body:**
```json
{
  "status": "EXCUSED"
}
```

**Response:** 200 OK
```json
{
  "message": "Attendance updated successfully",
  "attendance": { ... }
}
```

---

### DELETE /api/attendance/[attendanceId]
Delete attendance record (ADMIN/SUPER_ADMIN only). Cannot delete for closed events.

**Response:** 200 OK
```json
{
  "message": "Attendance record deleted successfully"
}
```

---

## User APIs

### GET /api/users
Get all users with filters.

**Query Parameters:**
- `domainId` - Filter by domain
- `role` - Filter by role (SUPER_ADMIN, ADMIN, USER)
- `q` - Search by name, email, or roll

**Note:** 
- Regular users can only see users from their domain
- Admins can only see users from their domain
- Super admins can see all users

**Response:** 200 OK
```json
{
  "users": [
    {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "roll": "2101001",
      "role": "USER",
      "profile_pic": "url",
      "domainId": "domain_id",
      "domain": { ... },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET /api/users/[userId]
Get specific user details.

**Response:** 200 OK
```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "roll": "2101001",
  "role": "USER",
  "profile_pic": "url",
  "domainId": "domain_id",
  "domain": { ... },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /api/users/[userId]
Update user details.

**Permissions:**
- Users can update their own profile (except role and domainId)
- Admins can update users in their domain (except role)
- Super admins can update any user including role and domainId

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "roll": "2101002",
  "role": "ADMIN", // SUPER_ADMIN only
  "domainId": "new_domain_id", // SUPER_ADMIN/ADMIN only
  "profile_pic": "url"
}
```

**Response:** 200 OK
```json
{
  "message": "User updated successfully",
  "user": { ... }
}
```

---

### DELETE /api/users/[userId]
Delete a user (SUPER_ADMIN only). Cannot delete yourself.

**Response:** 200 OK
```json
{
  "message": "User deleted successfully"
}
```

---

### GET /api/users/[userId]/attendance
Get attendance statistics and history for a user.

**Response:** 200 OK
```json
{
  "user": { ... },
  "attendances": [
    {
      "id": "attendance_id",
      "status": "PRESENT",
      "event": { ... }
    }
  ],
  "stats": {
    "total": 10,
    "present": 8,
    "absent": 1,
    "excused": 1,
    "notApplicable": 0
  },
  "attendancePercentage": 88.89
}
```

---

## Role-Based Access Control

### Roles:
1. **SUPER_ADMIN** (Presidents/Vice Presidents)
   - Full access to all features
   - Can create/delete domains
   - Can manage all users and change roles
   - Can view/manage all events and attendance

2. **ADMIN** (Domain Leads)
   - Can create/manage events for their domain
   - Can mark/update attendance for their domain
   - Can view users in their domain
   - Cannot change user roles or domains

3. **USER** (Domain Members)
   - Can view events for their domain and GBM events
   - Can view their own attendance records
   - Can update their own profile (except role and domain)

---

## Error Responses

All endpoints may return the following error responses:

**401 Unauthorized**
```json
{
  "message": "Unauthorized"
}
```

**403 Forbidden**
```json
{
  "message": "Forbidden"
}
```

**404 Not Found**
```json
{
  "message": "Resource not found"
}
```

**400 Bad Request**
```json
{
  "message": "Validation error",
  "errors": [...]
}
```

**500 Internal Server Error**
```json
{
  "message": "Server error"
}
```

---

## Notes

1. All dates should be in ISO 8601 format
2. Event dates must be in the future when creating/updating
3. Attendance cannot be marked/updated for closed events
4. Domains cannot be deleted if they have users or events
5. Users cannot delete their own accounts
6. Email and roll numbers must be unique across all users
