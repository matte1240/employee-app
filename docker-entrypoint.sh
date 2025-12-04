#!/bin/sh
set -e

echo "🚀 Starting application entrypoint..."

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
if ! npx prisma migrate deploy; then
    echo "❌ ERROR: Prisma migrations failed!"
    exit 1
fi

echo "✅ Migrations completed successfully"

# Execute the main command passed to the entrypoint
echo "🚀 Starting application: $@"
exec "$@"
