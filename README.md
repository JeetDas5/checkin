# CheckIn

A comprehensive attendance tracking system built with Next.js, Prisma, and PostgreSQL. This application provides role-based access control for managing events, users, and attendance records across different domains.

## Features

- Role-based access control (SUPER_ADMIN, ADMIN, USER)
- Domain-based organization management
- Event creation and lifecycle management
- Single and bulk attendance marking
- Attendance statistics and reports
- User management with domain assignment
- Comprehensive API with authentication
- Email Verification with OTP

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with bcrypt
- **Validation**: Zod
- **Emails**: Unosend

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file with:

```
DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_jwt_secret"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
UNOSEND_API_KEY="your-unosend-api-key"
```

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. Generate Prisma client:

```bash
npx prisma generate
```

6. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Documentation

Complete API documentation is available in the `docs` folder:

- **[API Documentation](docs/API_DOCUMENTATION.md)** - Detailed API reference with examples
- **[API Architecture](docs/API_ARCHITECTURE.md)** - System architecture and design patterns
- **[OTP Verification](docs/OTP_VERIFICATION.md)** - Detailed guide on the OTP system

## Project Structure

```
attendance-tracker/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── otp/          # OTP endpoints
│   │   │   ├── domains/      # Domain management
│   │   │   ├── events/       # Event management
│   │   │   ├── attendance/   # Attendance tracking
│   │   │   └── users/        # User management
│   │   └── ...
│   ├── components/           # React components
│   ├── lib/                  # Utilities and helpers
│   │   ├── auth/            # Authentication utilities
│   │   ├── email/           # Email service (Unosend)
│   │   ├── validators/      # Zod validation schemas
│   │   ├── utils/           # General utilities (including OTP)
│   │   └── prisma.js        # Prisma client
│   └── generated/           # Generated Prisma client
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
└── docs/                    # API documentation
```

## Database Schema

The application uses the following main models:

- **Domain** - Organizational units (e.g., Technical, Marketing)
- **User** - System users with roles (SUPER_ADMIN, ADMIN, USER)
- **Event** - Attendance events with open/closed status
- **Attendance** - Attendance records linking users to events

See `prisma/schema.prisma` for the complete schema.

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - User login
- `GET /api/auth/me` - Get current user

### OTP Verification

- `POST /api/otp/send` - Send verification OTP
- `POST /api/otp/verify` - Verify OTP code
- `POST /api/otp/resend` - Resend OTP code

### Domains

- `GET /api/domains` - List all domains
- `POST /api/domains` - Create domain (SUPER_ADMIN)
- `GET /api/domains/[id]` - Get domain details
- `DELETE /api/domains/[id]` - Delete domain (SUPER_ADMIN)

### Events

- `GET /api/events` - List events
- `POST /api/events` - Create event (ADMIN+)
- `GET /api/events/[id]` - Get event details
- `PATCH /api/events/[id]` - Update event (ADMIN+)
- `POST /api/events/[id]/close` - Close event (ADMIN+)
- `POST /api/events/[id]/open` - Reopen event (ADMIN+)
- `GET /api/events/[id]/attendance` - Get event attendance

### Attendance

- `GET /api/attendance` - List attendance records
- `POST /api/attendance` - Mark attendance (ADMIN+)
- `GET /api/attendance/[id]` - Get attendance record
- `PATCH /api/attendance/[id]` - Update attendance (ADMIN+)
- `DELETE /api/attendance/[id]` - Delete attendance (ADMIN+)

### Users

- `GET /api/users` - List users
- `GET /api/users/[id]` - Get user details
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user (SUPER_ADMIN)
- `GET /api/users/[id]/attendance` - Get user attendance stats

For detailed API documentation, see [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

Lead Developer: [JeetDas](https://github.com/JeetDas5)

Built with ❤️ for Konnexions
