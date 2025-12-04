#!/bin/sh
set -e

echo "🔧 Development mode entrypoint..."

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
if ! npx prisma migrate deploy; then
    echo "❌ ERROR: Prisma migrations failed!"
    exit 1
fi

# Generate Prisma client (needed in dev with volume mounts)
echo "🔄 Generating Prisma client..."
if ! npx prisma generate; then
    echo "❌ ERROR: Prisma client generation failed!"
    exit 1
fi

echo "✅ Setup completed successfully"

# Execute the main command passed to the entrypoint
echo "🚀 Starting application: $@"
exec "$@"
