# Attendance Tracker - API Architecture

## API Structure Overview

```
attendance-tracker/
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── auth/                    [Authentication]
│   │       │   ├── signup/             POST - Register new user
│   │       │   ├── signin/             POST - User login
│   │       │   └── me/                 GET  - Get current user
│   │       │
│   │       ├── domains/                [Domain Management]
│   │       │   ├── route.js            GET  - List all domains
│   │       │   │                       POST - Create domain (SUPER_ADMIN)
│   │       │   └── [domainId]/
│   │       │       └── route.js        GET    - Get domain details + stats
│   │       │                           DELETE - Delete domain (SUPER_ADMIN)
│   │       │
│   │       ├── events/                 [Event Management]
│   │       │   ├── route.js            GET  - List events (filtered)
│   │       │   │                       POST - Create event (ADMIN+)
│   │       │   └── [eventId]/
│   │       │       ├── route.js        GET   - Get event details
│   │       │       │                   PATCH - Update event (ADMIN+)
│   │       │       ├── close/          POST  - Close event (ADMIN+)
│   │       │       ├── open/           POST  - Reopen event (ADMIN+)
│   │       │       └── attendance/     GET   - Get event attendance + stats
│   │       │
│   │       ├── attendance/             [Attendance Management]
│   │       │   ├── route.js            GET  - List attendance (filtered)
│   │       │   │                       POST - Mark attendance (ADMIN+)
│   │       │   └── [attendanceId]/
│   │       │       └── route.js        GET    - Get attendance record
│   │       │                           PATCH  - Update attendance (ADMIN+)
│   │       │                           DELETE - Delete attendance (ADMIN+)
│   │       │
│   │       └── users/                  [User Management]
│   │           ├── route.js            GET  - List users (filtered)
│   │           └── [userId]/
│   │               ├── route.js        GET    - Get user details
│   │               │                   PATCH  - Update user
│   │               │                   DELETE - Delete user (SUPER_ADMIN)
│   │               └── attendance/     GET    - Get user attendance stats
│   │
│   └── lib/
│       └── validators/
│           ├── user.schema.js          User validation schemas
│           ├── domain.schema.js        Domain validation schemas
│           ├── event.schema.js         Event validation schemas
│           └── attendance.schema.js    Attendance validation schemas
│
└── prisma/
    └── schema.prisma                   Database schema
```

## Data Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ HTTP Request (with JWT cookie)
       │
       ▼
┌─────────────────────────────────────────────────────┐
│              Next.js API Routes                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  1. Authentication Middleware                 │  │
│  │     - Verify JWT token                        │  │
│  │     - Extract user info                       │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │                                   │
│  ┌───────────────▼───────────────────────────────┐  │
│  │  2. Request Validation (Zod)                  │  │
│  │     - Validate request body                   │  │
│  │     - Type checking                           │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │                                   │
│  ┌───────────────▼───────────────────────────────┐  │
│  │  3. Authorization Check (RBAC)                │  │
│  │     - Check user role                         │  │
│  │     - Verify permissions                      │  │
│  │     - Domain-based access control             │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │                                   │
│  ┌───────────────▼───────────────────────────────┐  │
│  │  4. Business Logic                            │  │
│  │     - Process request                         │  │
│  │     - Apply business rules                    │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │                                   │
│  ┌───────────────▼───────────────────────────────┐  │
│  │  5. Database Operations (Prisma)              │  │
│  │     - Query/Mutate data                       │  │
│  │     - Handle relations                        │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │                                   │
│  ┌───────────────▼───────────────────────────────┐  │
│  │  6. Response Formatting                       │  │
│  │     - Format data                             │  │
│  │     - Add metadata                            │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ JSON Response
                      │
                      ▼
               ┌─────────────┐
               │   Client    │
               └─────────────┘
```

## Database Schema Relationships

```
┌──────────────┐
│   Domain     │
│──────────────│
│ id           │◄─────────┐
│ name         │          │
└──────────────┘          │
       ▲                  │
       │                  │
       │ 1:N              │ N:1
       │                  │
┌──────┴───────┐    ┌─────┴──────┐
│    User      │    │   Event    │
│──────────────│    │────────────│
│ id           │    │ id         │
│ name         │    │ title      │
│ email        │    │ date       │
│ roll         │    │ status     │
│ role         │    │ domainId   │
│ domainId     │    │ createdById│
└──────┬───────┘    └─────┬──────┘
       │                  │
       │                  │
       │ N:M via          │
       │ Attendance       │
       │                  │
       └────────┬─────────┘
                │
         ┌──────▼──────────┐
         │   Attendance    │
         │─────────────────│
         │ id              │
         │ eventId         │
         │ userId          │
         │ status          │
         │ markedById      │
         └─────────────────┘
```

## Role-Based Access Matrix

| Resource       | SUPER_ADMIN | ADMIN (Domain) | USER        |
| -------------- | ----------- | -------------- | ----------- |
| **Domains**    |             |                |             |
| Create         | ✅          | ❌             | ❌          |
| View All       | ✅          | ✅             | ✅          |
| View Details   | ✅          | ✅             | ✅          |
| Delete         | ✅          | ❌             | ❌          |
| **Users**      |             |                |             |
| View All       | ✅          | ✅ (domain)    | ✅ (domain) |
| View Details   | ✅          | ✅ (domain)    | ✅ (self)   |
| Create         | ✅          | ✅             | ✅          |
| Update         | ✅          | ✅ (domain)    | ✅ (self)   |
| Change Role    | ✅          | ❌             | ❌          |
| Delete         | ✅          | ❌             | ❌          |
| **Events**     |             |                |             |
| View All       | ✅          | ✅ (domain)    | ✅ (domain) |
| Create         | ✅          | ✅             | ❌          |
| Update         | ✅          | ✅ (domain)    | ❌          |
| Close/Open     | ✅          | ✅ (domain)    | ❌          |
| **Attendance** |             |                |             |
| View All       | ✅          | ✅ (domain)    | ✅ (self)   |
| Mark           | ✅          | ✅ (domain)    | ❌          |
| Update         | ✅          | ✅ (domain)    | ❌          |
| Delete         | ✅          | ✅ (domain)    | ❌          |
| View Stats     | ✅          | ✅ (domain)    | ✅ (self)   |

## API Response Patterns

### Success Response

```json
{
  "message": "Operation successful",
  "data": { ... },
  "metadata": { ... }  // Optional (stats, pagination, etc.)
}
```

### Error Response

```json
{
  "message": "Error description",
  "errors": [ ... ]  // Optional (validation errors)
}
```

### List Response

```json
{
  "items": [ ... ],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

### Stats Response

```json
{
  "data": { ... },
  "stats": {
    "total": 100,
    "present": 80,
    "absent": 15,
    "excused": 5
  }
}
```

## Key Features

### 1. Authentication & Authorization

- JWT-based authentication
- Cookie-based session management
- Role-based access control (RBAC)
- Domain-scoped permissions

### 2. Attendance Management

- Single and bulk attendance marking
- Event-based attendance tracking
- Attendance status: PRESENT, ABSENT, EXCUSED, NOT_APPLICABLE
- Cannot modify closed events

### 3. Event Lifecycle

- Create events (future dates only)
- Update event details
- Close events (locks attendance)
- Reopen events (unlocks attendance)

### 4. Statistics & Reports

- Event attendance statistics
- User attendance history
- Attendance percentage calculation
- Domain statistics

### 5. Data Validation

- Zod schema validation
- Unique constraints (email, roll)
- Date validation (future events)
- Enum validation (roles, statuses)

### 6. Error Handling

- Consistent error responses
- Validation error details
- Business logic errors
- Database constraint errors

## Security Features

1. **Authentication Required**: All endpoints except signup/signin
2. **Role-Based Access**: Granular permissions per role
3. **Domain Isolation**: Admins can only access their domain
4. **Self-Service Restrictions**: Users can only modify their own data
5. **Closed Event Protection**: Cannot modify attendance for closed events
6. **Unique Constraints**: Prevent duplicate emails and roll numbers
7. **Password Hashing**: Bcrypt for password storage
8. **JWT Tokens**: Secure session management

## Performance Considerations

1. **Efficient Queries**: Use Prisma's include for related data
2. **Filtering**: Support query parameters for filtering
3. **Pagination**: Ready for pagination implementation
4. **Indexing**: Database indexes on foreign keys
5. **Bulk Operations**: Support bulk attendance marking

## Future Enhancements

1. **Pagination**: Add pagination to list endpoints
2. **Sorting**: Add sorting options
3. **Advanced Filters**: Date ranges, multiple statuses
4. **Export**: CSV/PDF export for reports
5. **Notifications**: Email/SMS for attendance updates
6. **Real-time**: WebSocket for live updates
7. **Analytics**: Advanced attendance analytics
8. **Audit Logs**: Track all changes
