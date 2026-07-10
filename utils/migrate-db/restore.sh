#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/.env"

DUMP_DIR="$SCRIPT_DIR/dump"

if [ ! -d "$DUMP_DIR/$SOURCE_DB" ]; then
  echo "Error: Dump directory not found at $DUMP_DIR/$SOURCE_DB"
  echo "Run dump.sh first."
  exit 1
fi

echo "==> Restoring to ist-prod: $TARGET_DB"
echo "WARNING: This will drop existing collections on the target."
read -rp "Continue? [y/N] " confirm
[[ "$confirm" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }

mongorestore \
  --uri="$TARGET_URI/$TARGET_DB?authSource=admin" \
  --gzip \
  --drop \
  --nsFrom="${SOURCE_DB}.*" \
  --nsTo="${TARGET_DB}.*" \
  "$DUMP_DIR/$SOURCE_DB"

echo "==> Restore complete."
echo ""
echo "Verifying document counts on target..."
mongosh "$TARGET_URI/$TARGET_DB" --quiet --eval '
  db.getCollectionNames().forEach(c => {
    const n = db.getCollection(c).countDocuments({});
    print(c.padEnd(40), n);
  });
'
