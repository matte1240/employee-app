#!/bin/bash

# Database Restore Script
# Restores PostgreSQL database from a backup file

set -e

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Configuration
BACKUP_DIR="backups/database"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "❌ ERROR: No backup file specified"
    echo ""
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    if [ -d "$BACKUP_DIR" ]; then
        ls -1t "$BACKUP_DIR" | head -10
    else
        echo "   No backups found in $BACKUP_DIR"
    fi
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "❌ ERROR: Backup file not found: $BACKUP_DIR/$BACKUP_FILE"
    exit 1
fi

# Parse DATABASE_URL to extract connection details
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

echo "⚠️  WARNING: This will restore the database and OVERWRITE existing data!"
echo "   Database: $DB_NAME"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Backup: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

# Set password for psql
export PGPASSWORD="$DB_PASS"

echo ""
echo "🔄 Starting database restore..."

# Decompress if needed
TEMP_SQL_FILE=""
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "   Decompressing backup..."
    TEMP_SQL_FILE="/tmp/restore_$(date +%s).sql"
    gunzip -c "$BACKUP_DIR/$BACKUP_FILE" > "$TEMP_SQL_FILE"
    SQL_FILE="$TEMP_SQL_FILE"
else
    SQL_FILE="$BACKUP_DIR/$BACKUP_FILE"
fi

# Drop existing connections to the database
echo "   Terminating existing connections..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" > /dev/null 2>&1 || true

# Drop and recreate database
echo "   Dropping existing database..."
dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" --if-exists

echo "   Creating new database..."
createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"

# Restore the backup
echo "   Restoring data..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$SQL_FILE"; then
    echo "✅ Database restored successfully!"
else
    echo "❌ ERROR: Restore failed"
    
    # Cleanup temp file if it exists
    if [ -n "$TEMP_SQL_FILE" ] && [ -f "$TEMP_SQL_FILE" ]; then
        rm "$TEMP_SQL_FILE"
    fi
    
    unset PGPASSWORD
    exit 1
fi

# Cleanup temp file if it exists
if [ -n "$TEMP_SQL_FILE" ] && [ -f "$TEMP_SQL_FILE" ]; then
    rm "$TEMP_SQL_FILE"
    echo "   Cleaned up temporary files"
fi

# Unset password
unset PGPASSWORD

echo ""
echo "🎉 Restore completed successfully!"
echo "   You may need to run migrations: npm run prisma:deploy"
