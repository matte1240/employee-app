#!/bin/bash

# Database Backup Script
# Backs up PostgreSQL database with timestamp and compression

set -e

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Configuration
BACKUP_DIR="backups/database"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Parse DATABASE_URL to extract connection details
# Format: postgresql://user:password@host:port/database
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not found in environment"
    exit 1
fi

# Extract database connection details from DATABASE_URL
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."
echo "   Database: $DB_NAME"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Timestamp: $TIMESTAMP"

# Set password for pg_dump
export PGPASSWORD="$DB_PASS"

# Perform backup
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_DIR/$BACKUP_FILE"; then
    echo "✅ Database dump created successfully"
    
    # Compress the backup
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    echo "✅ Backup compressed: $COMPRESSED_FILE"
    
    # Get file size
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$COMPRESSED_FILE" | cut -f1)
    echo "   Size: $BACKUP_SIZE"
    
    # Count total backups
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR" | wc -l)
    echo "   Total backups: $BACKUP_COUNT"
    
    echo "🎉 Backup completed successfully!"
    echo "   Location: $BACKUP_DIR/$COMPRESSED_FILE"
else
    echo "❌ ERROR: Backup failed"
    exit 1
fi

# Unset password
unset PGPASSWORD
