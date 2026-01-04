# Contributing to Granyt

First off, thank you for considering contributing to Granyt! It's people like you that make Granyt such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Be respectful and inclusive
- Be patient and welcoming to newcomers
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

When creating a bug report, include as much detail as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Include your environment** (OS, Node.js version, Docker version, etc.)

### 💡 Suggesting Features

Feature requests are welcome! Please provide:

- **Use case** - Why do you need this feature?
- **Expected behavior** - What should happen?
- **Alternatives considered** - Are there other ways to achieve this?

### 🔧 Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes** and add tests if applicable
4. **Run tests**: `npm test`
5. **Run linting**: `npm run lint`
6. **Commit your changes** with a clear message
7. **Push to your fork** and submit a pull request

#### Commit Message Guidelines

We follow conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Formatting, missing semicolons, etc.
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add webhook notification channel
fix: resolve race condition in metric aggregation
docs: update API documentation for lineage endpoint
```

### 🧪 Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/granyt.git
cd granyt/granyt-app

# Install dependencies
npm install

# Start PostgreSQL
docker compose up -d postgres

# Setup database
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

### 📁 Project Structure

Understanding the codebase:

```
src/
├── app/              # Next.js App Router
│   ├── api/          # REST API routes
│   │   └── v1/       # Public API endpoints
│   ├── dashboard/    # Authenticated app pages
│   └── (marketing)/  # Public landing pages
├── components/       # React components
│   ├── ui/           # shadcn/ui primitives
│   └── shared/       # Reusable business components
├── lib/              # Utilities & configuration
├── server/           # Backend logic
│   ├── routers/      # tRPC routers
│   └── services/     # Business logic
└── styles/           # Global CSS
```

### 🎨 Code Style

- We use **TypeScript** - please maintain type safety
- Follow **ESLint** rules - run `npm run lint`
- Use **Prettier** for formatting (integrated with ESLint)
- Write **meaningful variable names** - clarity over brevity
- Add **comments** for complex logic
- Keep functions **small and focused**

### 🧪 Testing

- Write tests for new features
- Run tests before submitting: `npm test`
- Maintain or improve code coverage

### 📖 Documentation

- Update README.md if you change functionality
- Add JSDoc comments for public APIs
- Update API documentation for endpoint changes

## Questions?

Feel free to open an issue with the `question` label if you need help!

---

Thank you for contributing! 🎉
