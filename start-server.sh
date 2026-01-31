#!/bin/sh
set -e

echo "🚀 Starting Next.js server..."
echo "📍 Host: ${HOSTNAME:-0.0.0.0}"
echo "🔌 Port: ${PORT:-3000}"

# Start the Next.js standalone server
exec node server.js
