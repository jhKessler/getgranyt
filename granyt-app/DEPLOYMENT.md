# 🚀 Granyt Deployment Guide

This guide covers deploying Granyt in production environments.

## Table of Contents

- [Installation Paths](#installation-paths)
  - [Install Script (Recommended)](#install-script-recommended)
  - [Docker & Kubernetes](#docker--kubernetes)
- [Environment Variables](#environment-variables)
- [Docker Compose](#docker-compose)
- [Kubernetes](#kubernetes)
- [Version Management](#version-management)
- [Updating](#updating)
- [Reverse Proxy Setup](#reverse-proxy-setup)
- [Backup & Restore](#backup--restore)
- [Troubleshooting](#troubleshooting)

---

## Installation Paths

### Install Script (Recommended)

The easiest way to deploy Granyt is using our interactive installation wizard:

```bash
curl -fsSL https://granyt.dev/install.sh | sh
```

Or download and run manually:

```bash
curl -O https://raw.githubusercontent.com/jhkessler/getgranyt/main/granyt-app/scripts/install.sh
chmod +x install.sh
./install.sh
```

📜 **[View the install script source](scripts/install.sh)**

The install wizard will:
1. ✅ Check for Docker (and optionally install it)
2. ✅ Download the required Docker Compose files
3. ✅ Prompt you for your dashboard URL
4. ✅ Automatically generate secure secrets
5. ✅ Create a `.env` configuration file
6. ✅ Start Granyt containers

**Options:**
- `--help` - Show help message
- `--dry-run` - Preview what would be done without making changes

After installation, open `http://your-server:3000` and create your admin account!

---

### Docker & Kubernetes

For manual deployment or more control over your setup, you can deploy using Docker Compose or Kubernetes directly.

> ⚠️ **Before proceeding**, make sure you understand the [Environment Variables](#environment-variables) required for deployment.

---

## Environment Variables

All environment variables needed for deployment. Make sure to configure these in your `.env` file or Kubernetes secrets.

### Required Variables

These variables **must** be set for Granyt to start:

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `POSTGRES_PASSWORD` | Database password | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Auth encryption key (32+ chars) | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Public URL of your Granyt instance | Your domain, e.g., `https://granyt.example.com` |

### Optional Variables

#### Database Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `granyt` | Database username |
| `POSTGRES_DB` | `granyt` | Database name |

#### Application Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `GRANYT_VERSION` | `latest` | Docker image version ([see available versions](#image-tags)) |
| `APP_PORT` | `3000` | Port to expose the app (standalone only) |

#### Email Notifications (SMTP)

Configure these to enable email alerts:

| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | - | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | - | SMTP username |
| `SMTP_PASSWORD` | - | SMTP password |
| `SMTP_FROM_EMAIL` | - | Sender email address |
| `SMTP_FROM_NAME` | `Granyt Alerts` | Sender display name |
| `SMTP_SECURE` | `true` | Use TLS for SMTP |

#### Webhooks

| Variable | Default | Description |
|----------|---------|-------------|
| `GRANYT_WEBHOOK_URL` | - | Global webhook URL (e.g., Slack incoming webhook) |
| `GRANYT_WEBHOOK_SECRET` | - | Secret for signing webhook requests |

#### Analytics (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | - | PostHog API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | PostHog host |

### Generating Secrets

```bash
# Generate BETTER_AUTH_SECRET (required)
openssl rand -base64 32

# Generate a secure database password (required)
openssl rand -base64 24
```

---

## Docker Compose

📜 **Docker Compose files:**
- [docker-compose.standalone.yml](docker-compose.standalone.yml) - Exposes ports, for direct access
- [docker-compose.production.yml](docker-compose.production.yml) - No exposed ports, for use behind reverse proxy

### Architecture Overview

The Docker Compose setup consists of **3 services**:

#### 1. PostgreSQL Database (`postgres`)

Stores all Granyt data with persistent volume storage.

```yaml
postgres:
  image: postgres:17-alpine
  volumes:
    - postgres-data:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U granyt -d granyt"]
```

#### 2. Database Migrations (`migrations`)

Runs once on startup to apply database schema changes. Uses an init container pattern.

```yaml
migrations:
  image: ghcr.io/jhkessler/granyt-app:latest-migrations
  depends_on:
    postgres:
      condition: service_healthy
  restart: "no"  # Run once and exit
```

#### 3. Next.js Application (`app`)

The main Granyt web application.

```yaml
app:
  image: ghcr.io/jhkessler/granyt-app:latest
  ports:
    - "3000:3000"  # Only in standalone version
  depends_on:
    migrations:
      condition: service_completed_successfully
```

### Quick Start with Docker Compose

1. **Download the compose file:**
   ```bash
   curl -O https://raw.githubusercontent.com/jhkessler/getgranyt/main/granyt-app/docker-compose.standalone.yml
   ```

2. **Create your `.env` file** with [required variables](#environment-variables):
   ```bash
   POSTGRES_PASSWORD=your-secure-password-here
   BETTER_AUTH_SECRET=your-32-char-secret-key-here
   BETTER_AUTH_URL=https://granyt.example.com
   ```

3. **Start Granyt:**
   ```bash
   docker compose -f docker-compose.standalone.yml up -d
   ```

4. **Check logs:**
   ```bash
   docker compose -f docker-compose.standalone.yml logs -f
   ```

### Standalone vs Production

| Feature | Standalone | Production |
|---------|------------|------------|
| Port exposed | Yes (`APP_PORT`, default 3000) | No |
| Use case | Direct access, development | Behind reverse proxy |
| File | `docker-compose.standalone.yml` | `docker-compose.production.yml` |

For production behind a reverse proxy, use `docker-compose.production.yml` and configure your proxy to connect to:
- Container: `granyt-app-prod`
- Port: `3000`
- Network: `granyt-network`

---

## Kubernetes

For Kubernetes deployments, use the Docker images directly with your preferred orchestration method.

> 📋 Make sure to configure all [Environment Variables](#environment-variables) in your Kubernetes secrets.

### Docker Images

| Image | Purpose |
|-------|---------|
| `ghcr.io/jhkessler/granyt-app:latest` | Main application |
| `ghcr.io/jhkessler/granyt-app:latest-migrations` | Database migrations (init container) |

### Example Deployment

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: granyt-secrets
type: Opaque
stringData:
  # Required - see Environment Variables section
  database-url: "postgresql://granyt:YOUR_PASSWORD@postgres:5432/granyt?schema=public"
  better-auth-secret: "your-32-char-secret-key-here"
  better-auth-url: "https://granyt.example.com"
  # Optional - SMTP settings for email alerts
  smtp-host: ""
  smtp-user: ""
  smtp-password: ""
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: granyt-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: granyt
  template:
    metadata:
      labels:
        app: granyt
    spec:
      initContainers:
        # Run migrations before starting the app
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
            - name: BETTER_AUTH_SECRET
              valueFrom:
                secretKeyRef:
                  name: granyt-secrets
                  key: better-auth-secret
            - name: BETTER_AUTH_URL
              valueFrom:
                secretKeyRef:
                  name: granyt-secrets
                  key: better-auth-url
            - name: NEXT_PUBLIC_APP_URL
              valueFrom:
                secretKeyRef:
                  name: granyt-secrets
                  key: better-auth-url
            - name: NODE_ENV
              value: "production"
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 40
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: granyt-service
spec:
  selector:
    app: granyt
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

### PostgreSQL in Kubernetes

You can either:
1. **Use an external managed database** (recommended for production) - AWS RDS, GCP Cloud SQL, Azure Database for PostgreSQL
2. **Deploy PostgreSQL in the cluster** using a Helm chart like [Bitnami PostgreSQL](https://github.com/bitnami/charts/tree/main/bitnami/postgresql)

For managed databases, update your `DATABASE_URL` secret with the connection string provided by your cloud provider.

### Ingress Example

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: granyt-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - granyt.example.com
      secretName: granyt-tls
  rules:
    - host: granyt.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: granyt-service
                port:
                  number: 80
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

In your `.env` file (see [Environment Variables](#environment-variables)):

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

> ℹ️ **Note**: Simply restarting containers (`docker compose restart`) will **not** update to newer versions. You must explicitly pull the latest images as shown below.

Database migrations run automatically on startup. The migrations container will apply any pending schema changes before the app starts, ensuring your database is always in sync with the application version.

### Update to Latest

```bash
# Pull latest images
docker compose -f docker-compose.standalone.yml pull

# Restart with new images (migrations run automatically)
docker compose -f docker-compose.standalone.yml up -d
```

### Update to Specific Version

1. Edit `.env` (see [Environment Variables](#environment-variables)):
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

When using `docker-compose.production.yml`, configure your reverse proxy to forward traffic to the Granyt container.

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

Verify your [Environment Variables](#environment-variables) are correct and PostgreSQL is running:
```bash
docker compose -f docker-compose.standalone.yml ps
```

#### Port already in use

Change the port in `.env` (see [Environment Variables](#environment-variables)):
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
