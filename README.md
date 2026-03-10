# HRIS Backend

A REST API for a Human Resource Information System (HRIS) built with [NestJS](https://nestjs.com/), TypeORM, and PostgreSQL. It handles employee management, attendance tracking, and job positions with JWT-based authentication and real-time WebSocket notifications.

---

## Tech Stack

- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL via TypeORM
- **Authentication:** JWT (passport-jwt) with token blacklisting
- **Validation:** class-validator + class-transformer
- **File Uploads:** Multer (profile photos)
- **Real-time Notifications:** WebSockets via Socket.IO (`@nestjs/websockets`)
- **Message Queue:** RabbitMQ via `@nestjs/microservices` (event logging)
- **API Documentation:** Swagger / OpenAPI (`@nestjs/swagger`)

---

## Prerequisites

- Node.js >= 18 (local development only)
- Docker & Docker Compose

---

## Docker Setup (Recommended)

The full stack — NestJS app and PostgreSQL — runs via Docker Compose. RabbitMQ must be available on the shared `hris-network` (see below).

### 1. Create the external Docker network (one-time)

The compose file uses an external network. Create it once before first run:

```bash
docker network create hris-network
```

### 2. Create your local env file

```bash
cp .env.docker.example .env.docker.local
```

Then edit `.env.docker.local` with your actual credentials. This file is ignored by git and never committed.

Key variables to review:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST_PORT` | Host port exposed for PostgreSQL | `5432` |
| `DB_PASSWORD` | PostgreSQL password | `change_me` |
| `JWT_SECRET_KEY` | JWT signing secret | `change_me` |
| `OFFICE_TIMEZONE` | Timezone for attendance rules | `Asia/Jakarta` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | see example file |
| `RABBITMQ_URL` | RabbitMQ AMQP connection URL | `amqp://guest:guest@hris-rabbitmq:5672` |

### 3. Run the full stack

```bash
docker compose --env-file .env.docker.local up -d
```

This starts:
- **NestJS app** on `http://localhost:8000`
- **PostgreSQL** on `localhost:${DB_HOST_PORT}` (default `5432`)

> **Note:** RabbitMQ is expected to be running and reachable on `hris-network` at the hostname `hris-rabbitmq`. Start it separately or adjust `RABBITMQ_URL` to match your setup.

### 4. Run database migrations

```bash
docker compose --env-file .env.docker.local exec app npm run migration:run
```

### 5. View logs

```bash
# All services
docker compose --env-file .env.docker.local logs -f

# Single service
docker compose --env-file .env.docker.local logs -f app
```

### 6. Stop services

```bash
docker compose --env-file .env.docker.local down

# Stop and remove all volumes (resets database)
docker compose --env-file .env.docker.local down -v
```

---

## Local Development Setup

Run the database in Docker and the app locally with hot reload.

### 1. Start the database

```bash
docker compose --env-file .env.docker.local up -d postgres
```

### 2. Create local app env

```bash
cp .env-example .env
```

Edit `.env` — set `DB_PORT` to match `DB_HOST_PORT` in your `.env.docker.local` (default `5432`).

### 3. Install and run

```bash
npm install
npm run migration:run
npm run start:dev
```

The server starts on `http://localhost:8000` (or the `PORT` env value).

### Production build (without Docker)

```bash
npm run build
npm run start:prod
```

---

## DB Manager Connection

When using Docker, connect your DB manager to:

| Field    | Value                              |
|----------|------------------------------------|
| Host     | `localhost`                        |
| Port     | value of `DB_HOST_PORT` (default `5432`) |
| Database | `hris_db`                          |
| Username | `hris_user`                        |
| Password | value from `.env.docker.local`     |

Static profile photos are served at `/uploads/profile_photo/<filename>`.

---

## API Documentation (Swagger)

Once the server is running, interactive API documentation is available at:

```
http://localhost:8000/api/docs
```

The Swagger UI lists all endpoints grouped by tag (**Auth**, **Users**, **Attendances**, **Positions**) with full request/response schemas. To test protected routes directly from the UI:

1. Call `POST /auth/login` to obtain a JWT token.
2. Click the **Authorize** button (🔒) at the top of the page.
3. Enter `Bearer <your_token>` and confirm.

Authorization persists across page refreshes (`persistAuthorization: true`).

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

**`POST /users`** and **`PATCH /users/:id`** both accept `multipart/form-data` with an optional `profile_photo` file field (images only — jpeg, png, webp, gif — max 2 MB). Admins can update all fields; employees can only update `phone_number` and `profile_photo`.

---

### Attendances

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/attendances` | Admin | List all attendance records (paginated, filterable) |
| GET | `/attendances/:id` | Owner | Get attendance records for a specific user |
| POST | `/attendances/check-in` | JWT | Record check-in for the current user |
| POST | `/attendances/check-out` | JWT | Record check-out for the current user |

**Query params for `GET /attendances`:** `page`, `limit`, `order`, `userId`, `startDate`, `endDate`, `isLate`

Check-in is marked **late** if it occurs after **07:00** in the configured office timezone. Check-out is only allowed from **17:00** onwards. Only one attendance record is allowed per user per day. The office timezone is controlled by the `OFFICE_TIMEZONE` environment variable (default: `Asia/Jakarta`).

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

Notifications are delivered in real-time via a **WebSocket gateway** (Socket.IO). Admins receive push notifications (e.g., on employee check-in) through the `admin-notification` event. Attendance events are also published to RabbitMQ (`log_event`) for downstream logging consumers.

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

