#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/.env"

# Collections used by the leafy-smart-meters demo
COLLECTIONS=(
  files
  users
  transformed_data_ts
  collection
  accounts
  sessions
  messages
  virtualcollections
  tags
)

DUMP_DIR="$SCRIPT_DIR/dump"

if [ -d "$DUMP_DIR/$SOURCE_DB" ]; then
  read -rp "Dump directory already exists. Overwrite? [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }
  rm -rf "$DUMP_DIR/$SOURCE_DB"
fi

echo "==> Dumping from ist-shared: $SOURCE_DB"

for c in "${COLLECTIONS[@]}"; do
  echo "  dumping $c ..."
  mongodump \
    --uri="$SOURCE_URI" \
    --db="$SOURCE_DB" \
    --collection="$c" \
    --gzip \
    --out="$DUMP_DIR" || echo "  (skipped $c — may not exist)"
done

echo "==> Dump complete: $DUMP_DIR/$SOURCE_DB"
echo "Collections dumped:"
ls "$DUMP_DIR/$SOURCE_DB/" | sed 's/\.bson\.gz$//' | sed 's/\.metadata\.json\.gz$//' | sort -u
