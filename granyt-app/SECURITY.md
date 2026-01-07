# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Granyt seriously. If you believe you've found a security vulnerability, please report it responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please send an email to: **johnny@granyt.dev** (or create a private security advisory on GitHub)

Include the following information:

1. **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass)
2. **Location** - File path and line numbers if known
3. **Steps to reproduce** - Detailed steps to reproduce the issue
4. **Impact** - What can an attacker achieve?
5. **Suggested fix** - If you have one

### What to Expect

- **Acknowledgment** within 48 hours
- **Status update** within 7 days
- **Resolution timeline** based on severity

We kindly ask that you:

- Give us reasonable time to fix the issue before public disclosure
- Avoid accessing or modifying user data
- Act in good faith

### Scope

The following are **in scope**:

- The Granyt application code
- Authentication/authorization issues
- Data exposure vulnerabilities
- Injection vulnerabilities
- Cross-site scripting (XSS)

The following are **out of scope**:

- Vulnerabilities in third-party dependencies (report to upstream)
- Social engineering attacks
- Physical security issues
- DoS attacks

## Security Best Practices for Users

### Production Deployment

1. **Use strong secrets**
   ```bash
   # Generate secure BETTER_AUTH_SECRET
   openssl rand -hex 32
   
   # Use a strong PostgreSQL password
   openssl rand -hex 24
   ```

2. **Use HTTPS** - Always deploy behind a reverse proxy with TLS

3. **Keep dependencies updated**
   ```bash
   npm audit
   npm update
   ```

4. **Restrict database access** - Don't expose PostgreSQL publicly

5. **Enable email verification** if using email notifications

### API Key Security

- Store API keys securely (use secrets management)
- Rotate keys periodically
- Use environment-specific keys (don't use prod keys in dev)
- Never commit API keys to version control

## Security Features

Granyt includes the following security features:

- ✅ Password hashing with scrypt
- ✅ API key hashing with SHA-256
- ✅ CSRF protection via better-auth
- ✅ Input validation with Zod
- ✅ SQL injection protection via Prisma ORM
- ✅ XSS protection headers
- ✅ SSRF protection for webhooks
- ✅ Organization-based access control

## Known Limitations

- **No rate limiting** - Consider adding rate limiting at the reverse proxy level
- **No 2FA** - Two-factor authentication is not yet implemented

---

Thank you for helping keep Granyt and its users safe! 🔒
