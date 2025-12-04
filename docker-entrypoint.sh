#!/bin/sh
set -e

echo "🚀 Starting application entrypoint..."

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Migrations completed successfully"

# Execute the main command passed to the entrypoint
echo "🚀 Starting application: $@"
exec "$@"
