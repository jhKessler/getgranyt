<p align="center">
  <img src="public/logo.png" width="200" alt="Granyt Logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PostgreSQL-17-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

<h1 align="center">Granyt App</h1>

<p align="center">
  <strong>Web dashboard for Granyt - the modern, open-source Airflow observability platform</strong><br>
  A Next.js application for monitoring, debugging, and configuring your data pipelines
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-contributing">Contributing</a>
</p>

> **Note:** This is the web dashboard component of Granyt. For the complete project overview and installation guide, see the [main README](../README.md).

---

## ✨ Features

- **📊 DAG Monitoring** - Real-time visibility into your data pipelines with run history, duration trends, and success rates
- **🚨 Smart Alerts** - Configurable alerts for failures, SLA breaches, and pipeline anomalies with email, Slack, and webhook notifications
- **🐛 Error Tracking** - Centralized error aggregation with fingerprinting and stack trace analysis
- **🔑 API Key Management** - Generate and manage API keys for SDK authentication
- **🌙 Dark Mode** - Beautiful UI with light and dark theme support
- **🐳 Docker Ready** - One-command deployment with Docker Compose


![DAG Overview](../images/demo.png)


---

## 🏗️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL 17 + Prisma ORM |
| **Styling** | Tailwind CSS + shadcn/ui |
| **API** | tRPC |
| **Auth** | better-auth |
| **State** | Zustand, TanStack Query |

---

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Download the docker-compose file
curl -O https://raw.githubusercontent.com/jhkessler/getgranyt/main/granyt-app/docker-compose.yml

# Create a .env file with required variables
cat > .env << EOF
POSTGRES_PASSWORD=$(openssl rand -hex 24)
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
BETTER_AUTH_URL=http://localhost:3000
EOF

# Start with Docker Compose
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000) and create your first account!

> For production deployment with SMTP, reverse proxy setup, and more options, see the [Deployment Guide](DEPLOYMENT.md).

### Local Development

```bash
# Prerequisites: Node.js 20+, Docker

# Start PostgreSQL
docker compose up -d postgres

# Install dependencies
npm install

# Setup database
npm run db:generate
npm run db:push
npm run db:seed  # Creates demo data (save the generated credentials!)

# Start development server
npm run dev
```

### Development Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run test         # Run tests (Vitest)
npm run lint         # Run ESLint
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Run migrations
npm run db:seed      # Seed demo data
```

---

## 📁 Project Structure

```
granyt-app/
├── prisma/              # Database schema (split into multiple .prisma files)
│   └── seed/            # Seed data scripts
├── migrations/          # Prisma migrations
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── api/         # REST API endpoints (/api/v1/*)
│   │   ├── dashboard/   # Main dashboard pages
│   │   │   └── _components/  # Page-specific components
│   │   └── (marketing)/ # Landing pages
│   ├── components/      # React components
│   │   ├── ui/          # shadcn/ui components
│   │   └── shared/      # Shared components
│   ├── lib/             # Utilities, hooks, and config
│   └── server/          # Backend logic
│       ├── routers/     # tRPC routers
│       └── services/    # Business logic (one folder per domain)
└── docker-compose.*.yml # Docker configurations
```

---

## 📦 Installation

### Prerequisites

- **Docker** (recommended) or Node.js 20+

### Production Deployment

See the [Deployment Guide](DEPLOYMENT.md) for detailed production setup instructions including:

- Docker Compose deployment
- Environment configuration
- SSL/TLS setup with reverse proxy
- Scaling considerations

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | ✅ | Database password |
| `BETTER_AUTH_SECRET` | ✅ | Auth secret key (min 32 chars) |
| `BETTER_AUTH_URL` | ✅ | Public URL of your app |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public URL for client |
| `SMTP_*` | ❌ | Email configuration for alerts |

## 🔧 Configuration

### Connecting Airflow

1. Create an API key in Settings → API Keys
2. Install the Granyt SDK in your Airflow environment:

   The Granyt SDK is a Python listener that must be installed where your Airflow workers and scheduler run. It automatically captures DAG and task execution events and sends them to your Granyt dashboard.

   Install the SDK in your Airflow environment's Python (e.g., add to your `requirements.txt` or install directly in your Airflow container/virtualenv):

```bash
pip install granyt-sdk
```
3. Set environment variables:

```bash
export GRANYT_API_URL=https://your-granyt-instance.com
export GRANYT_API_KEY=granyt_xxxx
```

### Alert Configuration

Granyt supports multiple notification channels:

- **Email** - SMTP configuration for email alerts
- **Webhooks** - POST to any URL with customizable payload
- **Resend** - Native Resend integration

Configure in Settings → Notifications.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Run migrations
```

## � Contact

- **GitHub:** [@jhkessler](https://github.com/jhkessler)
- **Email:** johnny@granyt.dev
- **Issues:** [GitHub Issues](https://github.com/jhkessler/getgranyt/issues)

## �📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [better-auth](https://github.com/better-auth/better-auth) for authentication
- [Recharts](https://recharts.org/) for charting

---

<p align="center">
  <a href="../README.md">← Back to main README</a>
</p>
