# Docker Setup Guide for HRIS Backend

This guide explains how to set up and run the HRIS backend using Docker.

## Overview

The Docker setup includes:
- **NestJS Application** - Runs on port `8000`
- **PostgreSQL Database** - Runs on port `5432`
- **RabbitMQ** - Runs on ports `5672` (AMQP) and `15672` (Management UI)

## Files

- `Dockerfile` - Multi-stage build for the NestJS application
- `docker-compose.yml` - Production environment setup
- `docker-compose.dev.yml` - Development environment setup (database & queue only)
- `.dockerignore` - Files to exclude from Docker build
- `rabbitmq.conf` - RabbitMQ configuration

## Prerequisites

- Docker installed and running
- Docker Compose installed (usually comes with Docker Desktop)

## Getting Started

### Option 1: Production Setup (Full Stack with App)

Run the complete stack including the app, database, and RabbitMQ:

```bash
docker-compose up -d
```

This will:
- Build the NestJS application
- Start PostgreSQL container
- Start RabbitMQ container
- Start the NestJS app container

The application will be available at `http://localhost:8000`
RabbitMQ Management UI: `http://localhost:15672` (guest/guest)

### Option 2: Development Setup (Database & Queue Only)

If you want to run the app locally but use containerized dependencies:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Then run the app locally:

```bash
npm install
npm run start:dev
```

## Common Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### Stop and remove volumes (clean database)
```bash
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f rabbitmq
```

### Run migrations
```bash
docker-compose exec app npm run migration:run
```

### Access PostgreSQL CLI
```bash
docker-compose exec postgres psql -U hris_user -d hris_db
```

### Rebuild the application image
```bash
docker-compose build --no-cache
```

### Execute a command in running container
```bash
docker-compose exec app npm run <command>
```

## Environment Variables

The following environment variables are set in the containers:

- `NODE_ENV`: production
- `PORT`: 8000
- `DB_HOST`: postgres
- `DB_PORT`: 5432
- `DB_USERNAME`: hris_user
- `DB_PASSWORD`: hris_password
- `DB_NAME`: hris_db
- `JWT_SECRET_KEY`: sangatrahasiasekarang
- `OFFICE_TIMEZONE`: Asia/Jakarta

**Important:** For production, update sensitive variables like `DB_PASSWORD` and `JWT_SECRET_KEY` in the `docker-compose.yml` file or use a `.env` file.

## Health Checks

All services include health checks:
- App: HTTP GET to `/health` endpoint
- PostgreSQL: `pg_isready` command
- RabbitMQ: `rabbitmq-diagnostics ping` command

## Networking

Services communicate via the `hris-network` bridge network:
- The app can reach PostgreSQL at `postgres:5432`
- The app can reach RabbitMQ at `rabbitmq:5672`

## Troubleshooting

### Database connection refused
- Ensure PostgreSQL container is running: `docker-compose ps`
- Check PostgreSQL logs: `docker-compose logs postgres`
- Wait for health check to pass (may take 30-40 seconds on first start)

### Application fails to start
- Check app logs: `docker-compose logs app`
- Ensure migrations are run: `docker-compose exec app npm run migration:run`
- Check database credentials match in docker-compose.yml

### RabbitMQ not responding
- Check RabbitMQ logs: `docker-compose logs rabbitmq`
- Access management UI: http://localhost:15672 (guest/guest)

### Port conflicts
If ports are already in use, modify the `ports` section in `docker-compose.yml`:
```yaml
ports:
  - "8001:8000"  # Map host port 8001 to container port 8000
```

## Development Workflow

1. **Setup containers** (one time):
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Install dependencies** (one time):
   ```bash
   npm install
   ```

3. **Run migrations** (one time):
   ```bash
   npm run migration:run
   ```

4. **Start development server**:
   ```bash
   npm run start:dev
   ```

5. **Make changes** - Files auto-reload with watch mode

6. **Stop containers** when done:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

## Production Deployment

Before deploying to production:

1. Update sensitive environment variables in `docker-compose.yml`
2. Set `NODE_ENV` to `production` (already set)
3. Use strong JWT secret and database passwords
4. Set appropriate ALLOWED_ORIGINS
5. Configure proper logging and monitoring
6. Use persistent volumes for data backup

To deploy:
```bash
docker-compose -f docker-compose.yml up -d
```

## Docker Support for Multiple Platforms

The Dockerfile uses Alpine Linux for smaller image size. To build for specific platforms:

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t hris-backend:latest .
```
