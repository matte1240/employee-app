#!/bin/bash

# Backup Cleanup Script
# Removes old backups based on retention policy

set -e

# Configuration
BACKUP_DIR="backups/database"
DEFAULT_RETENTION_DAYS=30
DEFAULT_MIN_BACKUPS=7

# Get retention policy from arguments or use defaults
RETENTION_DAYS=${1:-$DEFAULT_RETENTION_DAYS}
MIN_BACKUPS=${2:-$DEFAULT_MIN_BACKUPS}

echo "🧹 Starting backup cleanup..."
echo "   Retention policy: Keep backups from last $RETENTION_DAYS days"
echo "   Minimum backups to keep: $MIN_BACKUPS"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "ℹ️  No backup directory found. Nothing to clean up."
    exit 0
fi

# Count total backups
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | wc -l)
echo "   Total backups found: $TOTAL_BACKUPS"

if [ "$TOTAL_BACKUPS" -eq 0 ]; then
    echo "ℹ️  No backups found. Nothing to clean up."
    exit 0
fi

# If total backups is less than minimum, don't delete anything
if [ "$TOTAL_BACKUPS" -le "$MIN_BACKUPS" ]; then
    echo "✅ Total backups ($TOTAL_BACKUPS) is within minimum ($MIN_BACKUPS). No cleanup needed."
    exit 0
fi

# Find backups older than retention period
OLD_BACKUPS=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS | sort)
OLD_BACKUP_COUNT=$(echo "$OLD_BACKUPS" | grep -c "backup_" || echo "0")

echo "   Old backups found: $OLD_BACKUP_COUNT"

if [ "$OLD_BACKUP_COUNT" -eq 0 ]; then
    echo "✅ No old backups to remove."
    exit 0
fi

# Calculate how many backups will remain after deletion
REMAINING_BACKUPS=$((TOTAL_BACKUPS - OLD_BACKUP_COUNT))

if [ "$REMAINING_BACKUPS" -lt "$MIN_BACKUPS" ]; then
    # Need to keep some old backups to maintain minimum
    BACKUPS_TO_DELETE=$((TOTAL_BACKUPS - MIN_BACKUPS))
    
    if [ "$BACKUPS_TO_DELETE" -le 0 ]; then
        echo "✅ Cannot delete backups: would go below minimum ($MIN_BACKUPS)"
        exit 0
    fi
    
    echo "   Adjusting: Deleting only $BACKUPS_TO_DELETE oldest backups to maintain minimum"
    
    # Get the oldest backups to delete (sorted by modification time)
    BACKUPS_TO_REMOVE=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -printf '%T+ %p\n' | sort | head -n $BACKUPS_TO_DELETE | cut -d' ' -f2-)
else
    # Can delete all old backups
    BACKUPS_TO_REMOVE="$OLD_BACKUPS"
    BACKUPS_TO_DELETE=$OLD_BACKUP_COUNT
fi

echo ""
echo "📋 Backups to be deleted:"
echo "$BACKUPS_TO_REMOVE" | while read -r backup; do
    if [ -n "$backup" ]; then
        BACKUP_DATE=$(stat -c %y "$backup" | cut -d' ' -f1)
        BACKUP_SIZE=$(du -h "$backup" | cut -f1)
        BACKUP_NAME=$(basename "$backup")
        echo "   - $BACKUP_NAME (${BACKUP_DATE}, ${BACKUP_SIZE})"
    fi
done

echo ""
read -p "Delete $BACKUPS_TO_DELETE backup(s)? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Cleanup cancelled"
    exit 0
fi

# Delete the backups
DELETED_COUNT=0
TOTAL_SIZE=0

echo ""
echo "🗑️  Deleting old backups..."

echo "$BACKUPS_TO_REMOVE" | while read -r backup; do
    if [ -n "$backup" ] && [ -f "$backup" ]; then
        SIZE=$(stat -c %s "$backup")
        rm "$backup"
        echo "   ✓ Deleted $(basename "$backup")"
        DELETED_COUNT=$((DELETED_COUNT + 1))
        TOTAL_SIZE=$((TOTAL_SIZE + SIZE))
    fi
done

# Recalculate remaining backups
REMAINING=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | wc -l)

echo ""
echo "🎉 Cleanup completed!"
echo "   Deleted: $BACKUPS_TO_DELETE backups"
echo "   Remaining: $REMAINING backups"
