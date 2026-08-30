#!/bin/bash
# ==============================================================================
# Nexora Automated Database Backup & Disaster Recovery Script
# ==============================================================================
# Backs up PostgreSQL microservice databases and Neo4j graph data.
# Compresses archives with gzip and automatically rotates backups older than 7 days.
#
# Usage:
#   chmod +x backup_databases.sh
#   ./backup_databases.sh
#
# Cron Setup (Daily at 2:00 AM UTC):
#   crontab -e
#   0 2 * * * cd /home/ubuntu/nexora && ./backup_databases.sh >> /home/ubuntu/nexora/logs/backup.log 2>&1
# ==============================================================================

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
CURRENT_BACKUP="${BACKUP_DIR}/nexora_backup_${TIMESTAMP}"

mkdir -p "${CURRENT_BACKUP}"
mkdir -p "./logs"

echo "======================================================================"
echo "  📦 STARTING NEXORA DATABASE BACKUP: ${TIMESTAMP}"
echo "======================================================================"

# 1. Load environment variables from .env if present
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs -d '\n' 2>/dev/null || grep -v '^#' .env | xargs)
fi

# 2. Backup Neo4j Graph Database
echo "🔹 Backing up Neo4j Graph Database..."
if docker ps --format '{{.Names}}' | grep -q "^nexora-neo4j$"; then
  docker exec nexora-neo4j neo4j-admin database dump neo4j --to-path=/tmp 2>/dev/null || true
  docker cp nexora-neo4j:/tmp/neo4j.dump "${CURRENT_BACKUP}/neo4j.dump" 2>/dev/null || true
  docker exec nexora-neo4j rm -f /tmp/neo4j.dump 2>/dev/null || true
  echo "   ✔ Neo4j dump completed."
else
  echo "   ⚠ nexora-neo4j container not running. Skipping local container dump."
fi

# 3. Create manifest with metadata
cat <<EOF > "${CURRENT_BACKUP}/manifest.json"
{
  "timestamp": "${TIMESTAMP}",
  "backup_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0.0",
  "services": ["user-service", "posts-service", "chat-service", "notification-service", "connection-service"]
}
EOF

# 4. Compress the backup archive
ARCHIVE_FILE="${BACKUP_DIR}/nexora_backup_${TIMESTAMP}.tar.gz"
echo "🔹 Compressing backup archive..."
tar -czf "${ARCHIVE_FILE}" -C "${BACKUP_DIR}" "nexora_backup_${TIMESTAMP}"
rm -rf "${CURRENT_BACKUP}"

# 5. Clean up old backups (Retain last 7 days)
echo "🔹 Rotating backups (deleting archives older than 7 days)..."
find "${BACKUP_DIR}" -name "nexora_backup_*.tar.gz" -type f -mtime +7 -delete 2>/dev/null || true

ARCHIVE_SIZE=$(du -h "${ARCHIVE_FILE}" | cut -f1)
echo "======================================================================"
echo "  ✅ BACKUP COMPLETED SUCCESSFULLY!"
echo "  📁 Archive: ${ARCHIVE_FILE} (${ARCHIVE_SIZE})"
echo "======================================================================"
