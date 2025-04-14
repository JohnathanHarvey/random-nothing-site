#!/bin/bash

# Define colors for pretty output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print a styled message
print_message() {
    echo -e "${BLUE}==>${NC} $1"
}

# Print a success message
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Print a warning message
print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

# Print an error message
print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Create backup directory if it doesn't exist
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Get current date and time for backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/lexicon_$TIMESTAMP.db"
BACKUP_FILE_COMPRESSED="$BACKUP_DIR/lexicon_$TIMESTAMP.db.gz"

# Check if database file exists
if [ ! -f "lexicon.db" ]; then
    print_error "Database file 'lexicon.db' not found."
    exit 1
fi

# Option 1: Simple file copy backup
backup_simple() {
    print_message "Creating simple file backup..."
    cp lexicon.db "$BACKUP_FILE"
    if [ $? -eq 0 ]; then
        print_success "Database backed up to $BACKUP_FILE"
    else
        print_error "Failed to backup database."
        exit 1
    fi
}

# Option 2: SQLite's .backup command (more reliable during write operations)
backup_sqlite() {
    print_message "Creating SQLite backup..."
    if command -v sqlite3 >/dev/null 2>&1; then
        sqlite3 lexicon.db ".backup '$BACKUP_FILE'"
        if [ $? -eq 0 ]; then
            print_success "Database backed up to $BACKUP_FILE using SQLite"
        else
            print_error "Failed to backup database with SQLite."
            exit 1
        fi
    else
        print_warning "SQLite3 command not found. Falling back to simple copy."
        backup_simple
    fi
}

# Option 3: Compressed backup to save space
backup_compressed() {
    print_message "Creating compressed backup..."
    if command -v sqlite3 >/dev/null 2>&1; then
        sqlite3 lexicon.db ".dump" | gzip > "$BACKUP_FILE_COMPRESSED"
        if [ $? -eq 0 ]; then
            print_success "Database backed up and compressed to $BACKUP_FILE_COMPRESSED"
        else
            print_error "Failed to create compressed backup."
            exit 1
        fi
    else
        print_warning "SQLite3 command not found. Falling back to simple compressed copy."
        cp lexicon.db - | gzip > "$BACKUP_FILE_COMPRESSED"
    fi
}

# Clean up old backups (keep last 10 by default)
cleanup_old_backups() {
    MAX_BACKUPS=10
    print_message "Cleaning up old backups (keeping last $MAX_BACKUPS)..."

    # Count existing backups
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/lexicon_*.db* 2>/dev/null | wc -l | tr -d ' ')

    # If we have more than MAX_BACKUPS, remove the oldest ones
    if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
        TO_DELETE=$((BACKUP_COUNT - MAX_BACKUPS))
        print_message "Removing $TO_DELETE old backup(s)..."

        ls -tr "$BACKUP_DIR"/lexicon_*.db* | head -n "$TO_DELETE" | xargs rm

        print_success "Old backups removed."
    else
        print_success "No cleanup needed. You have $BACKUP_COUNT backup(s)."
    fi
}

# Verify backup integrity
verify_backup() {
    if [ -f "$BACKUP_FILE" ]; then
        print_message "Verifying backup integrity..."
        sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_success "Backup integrity verified."
        else
            print_warning "Backup may be corrupted. Consider creating a new backup."
        fi
    elif [ -f "$BACKUP_FILE_COMPRESSED" ]; then
        print_message "Compressed backup created. Integrity check skipped."
    fi
}

# Main function with backup method selection
main() {
    print_message "Starting backup of lexicon database..."

    # Determine backup method (can be passed as argument)
    BACKUP_METHOD=${1:-"sqlite"}

    case "$BACKUP_METHOD" in
        "simple")
            backup_simple
            ;;
        "sqlite")
            backup_sqlite
            ;;
        "compressed")
            backup_compressed
            ;;
        *)
            print_error "Unknown backup method: $BACKUP_METHOD"
            print_message "Available methods: simple, sqlite, compressed"
            exit 1
            ;;
    esac

    # Verify and cleanup
    verify_backup
    cleanup_old_backups

    print_message "Backup complete!"
    print_message "To restore from backup, run: sqlite3 lexicon.db '.restore BACKUP_FILE'"
}

# Run backup
main "$@"