# Conlang Lexicon Manager

A web-based tool for constructing and managing a lexicon for constructed languages.

## Current Implementation

The application consists of:
- Client-side web app with forms for adding morphemes and words
- Python Flask server with SQLite database for persistent storage
- Search functionality to find words and morphemes

## Setup with Virtual Environment

### Prerequisites
- Python 3.8+ installed on your macOS
- pipx (recommended for global tool installation)

### Setting Up with pipx and venv

1. Install pipx if you don't have it already:
```bash
# Install pipx using Homebrew
brew install pipx
pipx ensurepath
```

2. Create a virtual environment for the project:
```bash
# Navigate to your project directory
cd /Users/bart/Code/random-nothing-site

# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate
```

3. Install required dependencies in your virtual environment:
```bash
# Make sure your virtual environment is activated
pip install flask flask-cors
```

4. Create a requirements.txt file for easier dependency management:
```bash
pip freeze > requirements.txt
```

5. Start the server from the project root:
```bash
# Make sure your virtual environment is activated
python3 api/server.py
```

The server will start on port 5000 and be accessible at: `http://localhost:5000/api`

### Managing Your Virtual Environment

- To activate the virtual environment: `source venv/bin/activate`
- To deactivate when you're done: `deactivate`
- To reinstall dependencies on a new system: `pip install -r requirements.txt`

## Running the Application

1. Start the server (make sure your virtual environment is activated):
```bash
source venv/bin/activate
python3 api/server.py
```

2. Open the application in a web browser:
   - You can simply open the `index.html` file directly in your browser
   - Or serve it using a simple HTTP server: `python -m http.server`

The web application is configured to connect to your local server at `http://localhost:5000/api`.

## Backup and Restore

The lexicon manager includes a backup script (`backup.sh`) that creates timestamped backups of your SQLite database.

### Running Backups Manually

You can run backups manually using the following commands:

```bash
# Default backup method (using SQLite's native backup command)
./backup.sh

# Simple file copy backup
./backup.sh simple

# Compressed backup (saves disk space)
./backup.sh compressed
```

### Automating Backups with launchd (macOS)

To schedule automatic backups using macOS's launchd:

1. Create a plist file for the backup job:

```bash
# Create the LaunchAgents directory if it doesn't exist
mkdir -p ~/Library/LaunchAgents

# Create the plist file
cat > ~/Library/LaunchAgents/com.conlanglexicon.backup.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.conlanglexicon.backup</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/bart/Code/random-nothing-site/backup.sh</string>
        <string>compressed</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>2</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>WorkingDirectory</key>
    <string>/Users/bart/Code/random-nothing-site</string>
    <key>StandardOutPath</key>
    <string>/Users/bart/Code/random-nothing-site/backups/backup.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/bart/Code/random-nothing-site/backups/backup_error.log</string>
</dict>
</plist>
EOF
```

2. Load the launchd job:

```bash
launchctl load ~/Library/LaunchAgents/com.conlanglexicon.backup.plist
```

This will run a compressed backup every day at 2:00 AM.

3. To unload (disable) the scheduled backup:

```bash
launchctl unload ~/Library/LaunchAgents/com.conlanglexicon.backup.plist
```

### Restoring from Backup

If you need to restore your database from a backup:

1. For standard backups:

```bash
# Make sure the server is not running
sqlite3 lexicon.db '.restore backups/lexicon_20250413_123456.db'
```

2. For compressed backups:

```bash
# Make sure the server is not running
gunzip -c backups/lexicon_20250413_123456.db.gz | sqlite3 lexicon.db
```

Replace `20250413_123456` with the timestamp of the backup you want to restore.

3. Verify the restoration:

```bash
# Check that the database is valid
sqlite3 lexicon.db "PRAGMA integrity_check;"

# Optional: count the number of entries
sqlite3 lexicon.db "SELECT COUNT(*) FROM morphemes;"
sqlite3 lexicon.db "SELECT COUNT(*) FROM words;"
```

## Development

For development purposes, you might want to install additional tools using pipx:

```bash
# Install useful Python tools globally without conflicts
pipx install black       # Code formatter
pipx install flake8      # Linter
pipx install pytest      # Testing framework
```

## Client Configuration

If you need to modify the server connection settings, update the API_BASE_URL in js/app.js:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```
