# HRIS Backend

A REST API for a Human Resource Information System (HRIS) built with [NestJS](https://nestjs.com/), TypeORM, and PostgreSQL. It handles employee management, attendance tracking, and job positions with JWT-based authentication.

---

## Tech Stack

- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL via TypeORM
- **Authentication:** JWT (passport-jwt) with token blacklisting
- **Validation:** class-validator + class-transformer
- **File Uploads:** Multer (profile photos)

---

## Prerequisites

- Node.js >= 18
- PostgreSQL database

---

## Project Setup

```bash
npm install
```

Create a `.env` file in the project root with the following variables:

```env
PORT=8000

DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=hris_db

JWT_SECRET_KEY=your_jwt_secret
```

Run database migrations:

```bash
npm run migration:run
```

---

## Running the App

```bash
# development (watch mode)
npm run start:dev

# production
npm run build
npm run start:prod
```

The server starts on `http://localhost:8000` (or the `PORT` env value).

Static profile photos are served at `/uploads/profile_photo/<filename>`.

---

## API Endpoints

> All protected routes require `Authorization: Bearer <token>` header.
> Only `@company.co.id` email addresses are accepted for registration and login.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Register a new user |
| POST | `/auth/login` | Public | Login and receive a JWT |
| POST | `/auth/logout` | JWT | Invalidate current token |

**Register / Login body:**
```json
{
  "name": "John Doe",
  "email": "john@company.co.id",
  "password": "secret123",
  "phone_number": "08123456789",
  "role": "employee"
}
```
`role` is optional (`employee` | `admin`), defaults to `employee`.

---

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users` | Admin | List all users (paginated, filter by `name`) |
| GET | `/users/:id` | JWT | Get a single user |
| POST | `/users` | Admin | Create a user |
| PATCH | `/users/:id` | Self / Admin | Update a user |

**Query params for `GET /users`:** `name`, `page` (default 1), `limit` (default 10), `order` (default `desc`)

**`PATCH /users/:id`** accepts `multipart/form-data` with a `profile_photo` file field (images only, max 2 MB). Admins can update all fields; employees can only update `phone_number` and `profile_photo`.

---

### Attendances

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/attendances` | Admin | List all attendance records (paginated, filterable) |
| GET | `/attendances/:id` | Owner | Get attendance records for a specific user |
| POST | `/attendances/check-in` | JWT | Record check-in for the current user |
| POST | `/attendances/check-out` | JWT | Record check-out for the current user |

**Query params for `GET /attendances`:** `page`, `limit`, `order`, `userId`, `startDate`, `endDate`, `isLate`

Check-in is marked **late** if it occurs after 07:00. Only one attendance record is allowed per user per day.

---

### Positions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/positions` | Admin | Create a new job position |

**Body:**
```json
{ "name": "Software Engineer" }
```

---

## Database Schema

```
positions
  id, name, created_at, updated_at

users
  id, name, email (unique), password (bcrypt), phone_number,
  photo_url, role (employee|admin), position_id (FK → positions),
  created_at, updated_at

attendances
  id, user_id (FK → users), attendance_date, check_in,
  check_out, is_late, created_at, updated_at
  UNIQUE (user_id, attendance_date)

notifications
  id, user_id (FK → users), message, is_read, created_at
```

---

## Database Migrations

```bash
# Apply all pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Generate a new migration from entity changes
npm run migration:generate --name=<MigrationName>
```

---

## Tests

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Coverage
npm run test:cov
```

