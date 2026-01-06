<p align="center">
  <img src="https://img.shields.io/github/license/jhkessler/getgranyt?style=for-the-badge" alt="MIT License" />
  <img src="https://img.shields.io/github/v/release/jhkessler/getgranyt?style=for-the-badge" alt="Latest Release" />
  <img src="https://img.shields.io/github/actions/workflow/status/jhkessler/getgranyt/ci.yml?style=for-the-badge" alt="Build Status" />
  <img src="https://img.shields.io/badge/Airflow-2.5--2.10-017CEE?style=for-the-badge&logo=apache-airflow" alt="Airflow Support" />
</p>

<h1 align="center">🔍 Granyt</h1>

<p align="center">
  <strong>Open-source data pipeline observability platform for Apache Airflow</strong><br>
  Monitor, debug, and optimize your DAGs with real-time insights
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-documentation">Documentation</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 🖼️ Screenshot

<!-- TODO: Add screenshot of the dashboard -->
![Granyt Dashboard](docs/screenshots/dashboard-placeholder.png)

---

## ✨ Features

- **📊 DAG Monitoring** - Real-time visibility into your data pipelines with run history, duration trends, and success rates
- **🚨 Smart Alerts** - Configurable alerts for failures, SLA breaches, and pipeline anomalies with email, Slack, and webhook notifications
- **🐛 Error Tracking** - Centralized error aggregation with fingerprinting and stack trace analysis
- **🔗 Lineage Tracking** - Automatic data lineage capture via OpenLineage integration
- **📈 Metrics Collection** - Automatic extraction of metrics from popular operators (Snowflake, BigQuery, dbt, S3, and more)
- **🐳 Docker Ready** - One-command deployment with Docker Compose

---

## 🚀 Quick Start

### 1. Deploy the Granyt App

```bash
# Download the docker-compose file
curl -O https://raw.githubusercontent.com/jhkessler/getgranyt/main/granyt-app/docker-compose.standalone.yml

# Create a .env file with required variables
cat > .env << EOF
POSTGRES_PASSWORD=$(openssl rand -base64 24)
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
BETTER_AUTH_URL=http://localhost:3000
EOF

# Start with Docker Compose
docker compose -f docker-compose.standalone.yml up -d
```

Open [http://localhost:3000](http://localhost:3000) and create your account.

> For production deployment with SMTP, reverse proxy setup, and more options, see the [Deployment Guide](./granyt-app/DEPLOYMENT.md).

### 2. Install the SDK in Airflow

The Granyt SDK is a Python listener that must be installed where your Airflow workers and scheduler run. It automatically captures DAG and task execution events and sends them to your Granyt dashboard.

Install the SDK in your Airflow environment's Python (e.g., add to your `requirements.txt` or install directly in your Airflow container/virtualenv):

```bash
pip install granyt-sdk
```

### 3. Configure the SDK

Set environment variables in your Airflow environment:

```bash
export GRANYT_ENDPOINT="https://granyt.yourdomain.com"
export GRANYT_API_KEY="your-api-key"  # Get this from the Granyt dashboard
```

That's it! The SDK automatically captures lineage and errors from your DAGs.

---

## 📁 Project Structure

This monorepo contains two main components:

| Component | Description | Documentation |
|-----------|-------------|---------------|
| **[granyt-app](./granyt-app)** | Next.js web dashboard for monitoring and configuration | [README](./granyt-app/README.md) |
| **[granyt-sdk](./granyt-sdk)** | Python SDK for Apache Airflow integration | [README](./granyt-sdk/README.md) |

### How They Work Together

```
┌─────────────────────────────────────────────────────────────────┐
│                     Apache Airflow                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   DAG 1     │  │   DAG 2     │  │   DAG 3     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         │               │               │                        │
│         └───────────────┼───────────────┘                        │
│                         │                                        │
│              ┌──────────▼──────────┐                             │
│              │    granyt-sdk       │  ← Automatic capture        │
│              │  (Python package)   │                             │
│              └──────────┬──────────┘                             │
└─────────────────────────┼───────────────────────────────────────┘
                          │ REST API
                          ▼
              ┌───────────────────────┐
              │     granyt-app        │  ← Web dashboard
              │   (Next.js + DB)      │
              └───────────────────────┘
```

---

## 📚 Documentation

| Resource | Description |
|----------|-------------|
| [granyt-app README](./granyt-app/README.md) | Web app setup, tech stack, and development |
| [granyt-sdk README](./granyt-sdk/README.md) | SDK installation, configuration, and usage |
| [Deployment Guide](./granyt-app/DEPLOYMENT.md) | Production deployment options |
| [Contributing Guide](./granyt-app/CONTRIBUTING.md) | How to contribute to Granyt |
| [Security Policy](./granyt-app/SECURITY.md) | Security practices and reporting |
| [Operator Adapters](./granyt-sdk/docs/operator_adapters.md) | Supported Airflow operators |

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./granyt-app/CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with ❤️ for the data engineering community</strong>
</p>
