# API Testing Guide

## Prerequisites

1. Make sure your database is set up and migrations are run
2. Start your development server: `npm run dev`
3. Use a tool like Postman, Insomnia, or curl to test the APIs

## Testing Flow

### 1. Create a Super Admin Account

```bash
POST http://localhost:3000/api/auth/signup
Content-Type: application/json

{
  "name": "Super Admin",
  "email": "admin@example.com",
  "roll": "SA001",
  "password": "password123",
  "role": "SUPER_ADMIN"
}
```

### 2. Sign In

```bash
POST http://localhost:3000/api/auth/signin
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Save the token from the response!**

### 3. Create a Domain

```bash
POST http://localhost:3000/api/domains
Content-Type: application/json
Cookie: auth-token=YOUR_TOKEN_HERE

{
  "name": "Technical Domain"
}
```

### 4. Create an Admin User

```bash
POST http://localhost:3000/api/auth/signup
Content-Type: application/json

{
  "name": "Domain Admin",
  "email": "domainadmin@example.com",
  "roll": "DA001",
  "password": "password123",
  "role": "ADMIN",
  "domainId": "DOMAIN_ID_FROM_STEP_3"
}
```

### 5. Create Regular Users

```bash
POST http://localhost:3000/api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "roll": "2101001",
  "password": "password123",
  "role": "USER",
  "domainId": "DOMAIN_ID_FROM_STEP_3"
}
```

### 6. Create an Event (as Admin)

```bash
POST http://localhost:3000/api/events
Content-Type: application/json
Cookie: auth-token=ADMIN_TOKEN

{
  "title": "Weekly Team Meeting",
  "date": "2026-02-01T10:00:00.000Z",
  "domainId": "DOMAIN_ID"
}
```

### 7. Mark Attendance (Single)

```bash
POST http://localhost:3000/api/attendance
Content-Type: application/json
Cookie: auth-token=ADMIN_TOKEN

{
  "eventId": "EVENT_ID",
  "userId": "USER_ID",
  "status": "PRESENT"
}
```

### 8. Mark Attendance (Bulk)

```bash
POST http://localhost:3000/api/attendance
Content-Type: application/json
Cookie: auth-token=ADMIN_TOKEN

{
  "eventId": "EVENT_ID",
  "attendances": [
    {
      "userId": "USER_ID_1",
      "status": "PRESENT"
    },
    {
      "userId": "USER_ID_2",
      "status": "ABSENT"
    },
    {
      "userId": "USER_ID_3",
      "status": "EXCUSED"
    }
  ]
}
```

### 9. Get Event Attendance with Stats

```bash
GET http://localhost:3000/api/events/EVENT_ID/attendance
Cookie: auth-token=ADMIN_TOKEN
```

### 10. Get User Attendance Stats

```bash
GET http://localhost:3000/api/users/USER_ID/attendance
Cookie: auth-token=TOKEN
```

### 11. Close an Event

```bash
POST http://localhost:3000/api/events/EVENT_ID/close
Cookie: auth-token=ADMIN_TOKEN
```

### 12. Get Domain Statistics

```bash
GET http://localhost:3000/api/domains/DOMAIN_ID
Cookie: auth-token=TOKEN
```

### 13. List All Users

```bash
GET http://localhost:3000/api/users
Cookie: auth-token=TOKEN
```

### 14. Search Users

```bash
GET http://localhost:3000/api/users?q=john&role=USER&domainId=DOMAIN_ID
Cookie: auth-token=TOKEN
```

### 15. Update User

```bash
PATCH http://localhost:3000/api/users/USER_ID
Content-Type: application/json
Cookie: auth-token=TOKEN

{
  "name": "Updated Name",
  "profile_pic": "https://example.com/pic.jpg"
}
```

### 16. Get All Events

```bash
GET http://localhost:3000/api/events?status=OPEN&domainId=DOMAIN_ID
Cookie: auth-token=TOKEN
```

### 17. Update Attendance

```bash
PATCH http://localhost:3000/api/attendance/ATTENDANCE_ID
Content-Type: application/json
Cookie: auth-token=ADMIN_TOKEN

{
  "status": "EXCUSED"
}
```

## Testing with curl

Here's an example using curl:

```bash
# Sign up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "roll": "TEST001",
    "password": "password123",
    "role": "SUPER_ADMIN"
  }'

# Sign in and save token
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' \
  -c cookies.txt

# Use token for authenticated request
curl -X GET http://localhost:3000/api/domains \
  -b cookies.txt
```

## Testing with Postman

1. **Import Collection**: Create a new collection in Postman
2. **Set Environment Variables**:

   - `baseUrl`: `http://localhost:3000`
   - `token`: (will be set after login)
   - `domainId`: (will be set after creating domain)
   - `eventId`: (will be set after creating event)
   - `userId`: (will be set after creating user)

3. **Auto-save Token**: In the signin request, add this to the "Tests" tab:

```javascript
const response = pm.response.json();
pm.environment.set("token", response.token);
```

4. **Set Headers**: For authenticated requests, add:
   - Key: `Cookie`
   - Value: `auth-token={{token}}`

## Common Test Scenarios

### Scenario 1: Complete Event Lifecycle

1. Create event (OPEN)
2. Mark attendance for multiple users
3. View event attendance stats
4. Update some attendance records
5. Close the event
6. Try to update attendance (should fail)
7. Reopen the event
8. Update attendance (should succeed)

### Scenario 2: User Attendance Report

1. Create multiple events
2. Mark attendance for a user across all events
3. Get user attendance statistics
4. Verify attendance percentage calculation

### Scenario 3: Domain Management

1. Create domain
2. Add users to domain
3. Create events for domain
4. View domain statistics
5. Try to delete domain (should fail - has users)
6. Remove users and events
7. Delete domain (should succeed)

### Scenario 4: Role-Based Access

1. Sign in as USER
2. Try to create event (should fail)
3. Try to mark attendance (should fail)
4. View own attendance (should succeed)
5. Try to view other user's attendance (should fail)
6. Sign in as ADMIN
7. Create event for own domain (should succeed)
8. Mark attendance for own domain (should succeed)
9. Try to view other domain's data (should fail)

## Expected Response Codes

- `200 OK` - Successful GET, PATCH, DELETE
- `201 Created` - Successful POST (creation)
- `400 Bad Request` - Validation error or business logic error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Duplicate resource (email, roll, domain name)
- `500 Internal Server Error` - Server error

## Troubleshooting

### Issue: "Unauthorized" on all requests

- Make sure you're sending the auth token in cookies
- Check if the token is valid and not expired
- Verify JWT_SECRET is set in .env

### Issue: "Forbidden" on requests

- Check if your user role has permission for the action
- Verify you're accessing resources within your domain (for ADMIN)

### Issue: "Validation error"

- Check the request body matches the schema
- Ensure all required fields are present
- Verify data types (strings, dates, enums)

### Issue: Database errors

- Make sure Prisma migrations are run: `npx prisma migrate dev`
- Check database connection in .env
- Verify Prisma client is generated: `npx prisma generate`
