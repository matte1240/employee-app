# 🕐 Employee Work Hours Tracker

A modern full-stack time tracking application built with **Next.js 16**, **Prisma**, and **PostgreSQL**.

## 🚀 Getting Started

### Prerequisites

- **Docker** and **Docker Compose**
- **Node.js 20+** (if running locally without Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd employee-app
   ```

2. **Environment Setup**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   *Note: The default settings in `.env.example` are configured for the Docker setup.*

### Running with Docker (Recommended)

This method sets up the database and application automatically.

```bash
# Start the application and database
npm run docker:up

# To rebuild the images (if you made changes)
npm run docker:build

# To stop the application
npm run docker:down
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Running Locally (Development)

If you prefer to run the Next.js app on your host machine but keep the database in Docker:

1. **Start the Database**
   You can use the docker-compose service just for the DB, or run a local Postgres instance.
   ```bash
   # Start only the postgres service
   docker compose up -d postgres
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Run migrations
   npm run prisma:migrate
   
   # Seed the database with initial users
   npm run prisma:seed
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```

## 🔑 Default Credentials

The database seeding process creates the following users:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@example.com` | `Admin123!` |
| **Employee** | `employee@example.com` | `Employee123!` |

## 🛠 Project Structure

- **`/app`**: Next.js App Router pages and API routes
- **`/components`**: Reusable React components
- **`/lib`**: Utility functions, authentication, and database client
- **`/prisma`**: Database schema and migrations
- **`/public`**: Static assets
- **`/types`**: TypeScript type definitions

## 📝 Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server |
| `npm run build` | Build for production |
| `npm run docker:up` | Start full stack in Docker |
| `npm run prisma:studio` | Open Prisma Studio GUI to view data |
| `npm run lint` | Run code linting |

## 📚 Documentation

See the `docs/` folder for more detailed documentation on:
- [Deployment](docs/DEPLOYMENT.md)
- [Configuration](docs/CONFIGURATION.md)
- [Contributing](docs/CONTRIBUTING.md)
