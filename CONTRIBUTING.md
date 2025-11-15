# 🤝 Contributing to Employee Work Hours Tracker

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

---

## 🎯 Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git
- Basic knowledge of Next.js, React, and Prisma

### Setup Development Environment

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/employee-app.git
cd employee-app

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your local database URL

# 4. Start database (Docker)
docker compose up postgres -d

# 5. Run migrations
npx prisma migrate dev

# 6. Seed test data
npm run prisma:seed

# 7. Start development server
npm run dev
```

---

## 🌿 Branch Strategy

```
main (production)
  ↓
dev (development)
  ↓
feature/your-feature-name
```

### Working on a Feature

```bash
# Create feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/add-export-pdf

# Make your changes
# ...

# Commit with conventional commits
git add .
git commit -m "feat(export): add PDF export functionality"

# Push to your fork
git push origin feature/add-export-pdf

# Create Pull Request to dev branch
```

---

## 📝 Commit Message Convention

We use **Conventional Commits** for clear changelog generation:

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (dependencies, build, etc.)
- **ci**: CI/CD changes

### Examples

```bash
# Feature
git commit -m "feat(dashboard): add monthly filter dropdown"

# Bug fix
git commit -m "fix(auth): resolve session timeout issue on mobile"

# Documentation
git commit -m "docs(readme): update Docker installation steps"

# Refactor
git commit -m "refactor(api): simplify hours calculation logic"

# Breaking change
git commit -m "feat(api)!: change time entry response format

BREAKING CHANGE: hoursWorked is now returned as number instead of string"
```

---

## 🔍 Code Style

### TypeScript
- Use TypeScript strict mode
- Define explicit types for function parameters and returns
- Avoid `any` type unless absolutely necessary
- Use interfaces for object shapes, types for unions/intersections

### React Components
```tsx
// ✅ Good
interface Props {
  userId: string;
  onSave: (data: TimeEntry) => void;
}

export default function TimeEntryForm({ userId, onSave }: Props) {
  // Component logic
}

// ❌ Bad
export default function TimeEntryForm(props: any) {
  // Component logic
}
```

### API Routes
```typescript
// ✅ Good - Zod validation
const createSchema = z.object({
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hoursWorked: z.number().min(0).max(24),
});

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  // ...
}
```

### Prisma Queries
- Always convert Decimal to number for JSON responses
- Use transactions for multi-step operations
- Include proper error handling

```typescript
// ✅ Good
const entries = await prisma.timeEntry.findMany({ where: { userId } });
return entries.map(e => ({
  ...e,
  hoursWorked: parseFloat(e.hoursWorked.toString())
}));

// ❌ Bad - Decimal not converted
return entries; // Causes JSON serialization errors
```

---

## 🧪 Testing

### Before Submitting PR

```bash
# 1. Lint
npm run lint

# 2. Build
npm run build

# 3. Test Docker build
docker build -t test-build .

# 4. Verify Prisma schema
npx prisma validate
npx prisma format
```

### Manual Testing Checklist
- [ ] Login works with test credentials
- [ ] Employee can log hours for current month
- [ ] Admin can view all users
- [ ] Export to Excel works
- [ ] Session timeout after 30 minutes
- [ ] Mobile responsive layout works
- [ ] Docker container starts successfully

---

## 📋 Pull Request Process

### 1. Before Creating PR

- [ ] Code follows style guidelines
- [ ] All tests pass locally
- [ ] Docker build succeeds
- [ ] Documentation updated (if needed)
- [ ] Conventional commit messages used
- [ ] Branch is up-to-date with `dev`

### 2. PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2

## Testing
How to test these changes

## Screenshots (if applicable)
Add screenshots here

## Related Issues
Closes #123
```

### 3. Review Process

1. Automated checks must pass (linting, build)
2. At least one approval from maintainer
3. All comments addressed
4. Squash merge to `dev` branch

---

## 🐛 Reporting Bugs

### Before Submitting

1. Check if issue already exists
2. Test on latest version
3. Verify it's reproducible

### Bug Report Template

```markdown
**Describe the bug**
Clear description of what happened

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g., Ubuntu 22.04]
- Browser: [e.g., Chrome 120]
- Docker version: [e.g., 24.0.0]
- Node version: [e.g., 20.10.0]

**Additional context**
Any other relevant information
```

---

## 💡 Suggesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
What you want to happen

**Describe alternatives you've considered**
Other solutions you've thought about

**Additional context**
Mockups, examples, etc.
```

---

## 📁 Project Structure Guidelines

### Adding New Components

```
components/
  ├── dashboard/           # Dashboard-specific components
  │   └── new-component.tsx
  ├── shared/              # Reusable components
  │   └── button.tsx
  └── forms/               # Form components
      └── time-entry-form.tsx
```

### Adding New API Routes

```
app/api/
  └── new-feature/
      ├── route.ts         # GET, POST handlers
      └── [id]/
          └── route.ts     # Dynamic routes
```

### Adding Database Models

1. Update `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name add_new_model`
3. Update seed file if needed: `prisma/seed.ts`

---

## 🔐 Security

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead, email: your-email@example.com

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

---

## 📚 Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs/)
- [NextAuth Docs](https://next-auth.js.org/)
- [Tailwind Docs](https://tailwindcss.com/docs)

### Project Docs
- [README.md](README.md) - Overview
- [docs/RELEASE_GUIDE.md](docs/RELEASE_GUIDE.md) - Release process
- [docs/DOCKER.md](docs/DOCKER.md) - Docker setup
- [docs/BACKUP_STRATEGY.md](docs/BACKUP_STRATEGY.md) - Backups

---

## 🏆 Recognition

Contributors will be recognized in:
- GitHub Contributors page
- Release notes (for significant features)
- Project documentation

---

## ❓ Questions?

- Open a [Discussion](https://github.com/matte1240/employee-app/discussions)
- Check existing [Issues](https://github.com/matte1240/employee-app/issues)
- Review [Documentation](docs/)

---

**Thank you for contributing! 🎉**
