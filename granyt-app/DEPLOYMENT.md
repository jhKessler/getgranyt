# 🚀 Granyt Deployment Guide

This guide covers deploying Granyt in production environments.

## Table of Contents

- [Quick Start](#quick-start)
- [Deployment Options](#deployment-options)
- [Configuration](#configuration)
- [Version Management](#version-management)
- [Updating](#updating)
- [Reverse Proxy Setup](#reverse-proxy-setup)
- [Backup & Restore](#backup--restore)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

The fastest way to deploy Granyt:

```bash
# 1. Download the docker-compose file
curl -O https://raw.githubusercontent.com/jhkessler/getgranyt/main/granyt-app/docker-compose.standalone.yml

# 2. Download the environment template
curl -O https://raw.githubusercontent.com/jhkessler/getgranyt/main/granyt-app/.env.standalone.example
mv .env.standalone.example .env

# 3. Edit the .env file with your settings
nano .env

# 4. Start Granyt
docker compose -f docker-compose.standalone.yml up -d

# 5. Check logs
docker compose -f docker-compose.standalone.yml logs -f
```

Open `http://your-server:3000` and create your admin account!

---

## Deployment Options

### Option 1: Docker Compose (Recommended)

Best for: Single server deployments, small to medium workloads.

This is the recommended approach for most users. The `docker-compose.standalone.yml` file includes:
- PostgreSQL 17 database with persistent storage
- Automatic database migrations
- The Granyt application

### Option 2: Kubernetes

For Kubernetes deployments, you can use the Docker images directly:

```yaml
# Example Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: granyt-app
spec:
  replicas: 1
  template:
    spec:
      initContainers:
        - name: migrations
          image: ghcr.io/jhkessler/granyt-app:latest-migrations
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: granyt-secrets
                  key: database-url
      containers:
        - name: app
          image: ghcr.io/jhkessler/granyt-app:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: granyt-secrets
                  key: database-url
```

---

## Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | Database password | `super-secure-password-123` |
| `BETTER_AUTH_SECRET` | Auth encryption key (32+ chars) | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Public URL of your Granyt instance | `https://granyt.example.com` |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `granyt` | Database username |
| `POSTGRES_DB` | `granyt` | Database name |
| `GRANYT_VERSION` | `latest` | Image version to use |
| `APP_PORT` | `3000` | Port to expose the app |
| `SMTP_HOST` | - | SMTP server for email alerts |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | - | SMTP username |
| `SMTP_PASSWORD` | - | SMTP password |
| `SMTP_FROM_EMAIL` | - | Sender email address |
| `SMTP_FROM_NAME` | `Granyt Alerts` | Sender name |
| `SMTP_SECURE` | `true` | Use TLS for SMTP |
| `GRANYT_WEBHOOK_URL` | - | Global webhook URL (e.g., Slack) |
| `GRANYT_WEBHOOK_SECRET` | - | Secret for signing webhook requests |

### Generating Secrets

```bash
# Generate BETTER_AUTH_SECRET
openssl rand -base64 32

# Generate a secure database password
openssl rand -base64 24
```

---

## Version Management

### Image Tags

Granyt publishes multiple image tags:

| Tag | Description | Use Case |
|-----|-------------|----------|
| `latest` | Most recent build from main | Production (recommended) |
| `dev` | Most recent build from dev branch | Testing pre-release |
| `1.0.0` | Specific version | Production (pinned) |
| `1.0` | Major.minor version | Auto-update patch versions |
| `sha-abc123` | Git commit SHA | Debugging specific builds |
| `dev-abc123` | Dev branch commit SHA | Testing specific dev builds |

### Pinning Versions (Recommended for Production)

In your `.env` file:

```bash
# Pin to a specific version
GRANYT_VERSION=1.0.0
```

This ensures:
- Predictable deployments
- No surprise breaking changes
- Controlled update process

### Available Versions

Check available versions at:
https://github.com/jhkessler/getgranyt/pkgs/container/granyt-app

### Testing with Dev Builds

To test pre-release features before they hit `latest`:

```bash
# In your .env file
GRANYT_VERSION=dev
```

> ⚠️ **Warning**: Dev builds may be unstable. Use only for testing.

---

## Updating

### Update to Latest

```bash
# Pull latest images
docker compose -f docker-compose.standalone.yml pull

# Restart with new images (migrations run automatically)
docker compose -f docker-compose.standalone.yml up -d
```

### Update to Specific Version

1. Edit `.env`:
   ```bash
   GRANYT_VERSION=1.1.0
   ```

2. Pull and restart:
   ```bash
   docker compose -f docker-compose.standalone.yml pull
   docker compose -f docker-compose.standalone.yml up -d
   ```

### Rollback

1. Edit `.env` with the previous version:
   ```bash
   GRANYT_VERSION=1.0.0
   ```

2. Restart:
   ```bash
   docker compose -f docker-compose.standalone.yml up -d
   ```

> ⚠️ **Note**: Database migrations are forward-only. Rolling back the app version won't revert database changes.

---

## Reverse Proxy Setup

### Nginx

```nginx
server {
    listen 80;
    server_name granyt.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name granyt.example.com;

    ssl_certificate /etc/letsencrypt/live/granyt.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/granyt.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Caddy

```caddy
granyt.example.com {
    reverse_proxy localhost:3000
}
```

### Traefik (Docker labels)

Add to your `docker-compose.standalone.yml`:

```yaml
services:
  app:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.granyt.rule=Host(`granyt.example.com`)"
      - "traefik.http.routers.granyt.tls=true"
      - "traefik.http.routers.granyt.tls.certresolver=letsencrypt"
```

---

## Backup & Restore

### Backup Database

```bash
# Create a backup
docker exec granyt-postgres pg_dump -U granyt granyt > backup_$(date +%Y%m%d_%H%M%S).sql

# Or compressed
docker exec granyt-postgres pg_dump -U granyt granyt | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore Database

```bash
# Stop the app first
docker compose -f docker-compose.standalone.yml stop app

# Restore from backup
cat backup.sql | docker exec -i granyt-postgres psql -U granyt granyt

# Or from compressed backup
gunzip -c backup.sql.gz | docker exec -i granyt-postgres psql -U granyt granyt

# Start the app
docker compose -f docker-compose.standalone.yml start app
```

### Automated Backups

Create a cron job for daily backups:

```bash
# Add to crontab (crontab -e)
0 2 * * * docker exec granyt-postgres pg_dump -U granyt granyt | gzip > /backups/granyt_$(date +\%Y\%m\%d).sql.gz
```

---

## Troubleshooting

### View Logs

```bash
# All services
docker compose -f docker-compose.standalone.yml logs -f

# Specific service
docker compose -f docker-compose.standalone.yml logs -f app
docker compose -f docker-compose.standalone.yml logs -f postgres
docker compose -f docker-compose.standalone.yml logs -f migrations
```

### Common Issues

#### Migrations fail to run

Check if PostgreSQL is ready:
```bash
docker compose -f docker-compose.standalone.yml logs postgres
```

The migrations container waits for PostgreSQL to be healthy before running.

#### App can't connect to database

Verify the DATABASE_URL is correct and PostgreSQL is running:
```bash
docker compose -f docker-compose.standalone.yml ps
```

#### Port already in use

Change the port in `.env`:
```bash
APP_PORT=3001
```

#### Out of disk space

Clean up old Docker resources:
```bash
docker system prune -a
```

### Health Check

```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{"status":"ok"}
```

### Reset Everything

> ⚠️ **Warning**: This will delete all data!

```bash
# Stop and remove everything
docker compose -f docker-compose.standalone.yml down -v

# Start fresh
docker compose -f docker-compose.standalone.yml up -d
```

---

## Support

- 📖 [Documentation](https://github.com/jhkessler/getgranyt)
- 🐛 [Issue Tracker](https://github.com/jhkessler/getgranyt/issues)
- 💬 [Discussions](https://github.com/jhkessler/getgranyt/discussions)
