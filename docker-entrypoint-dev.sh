#!/bin/sh
set -e

echo "🔧 Development mode entrypoint..."

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

# Generate Prisma client (needed in dev with volume mounts)
echo "🔄 Generating Prisma client..."
npx prisma generate

echo "✅ Setup completed successfully"

# Execute the main command passed to the entrypoint
echo "🚀 Starting application: $@"
exec "$@"
