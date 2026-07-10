#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/.env"

echo "==> Source ($SOURCE_DB on ist-shared):"
mongosh "$SOURCE_URI/$SOURCE_DB" --quiet --eval '
  db.getCollectionNames().forEach(c => {
    const n = db.getCollection(c).countDocuments({});
    print(c.padEnd(40), n);
  });
'

echo ""
echo "==> Target ($TARGET_DB on ist-prod):"
mongosh "$TARGET_URI/$TARGET_DB" --quiet --eval '
  db.getCollectionNames().forEach(c => {
    const n = db.getCollection(c).countDocuments({});
    print(c.padEnd(40), n);
  });
'

echo ""
echo "==> Search index status on target:"
mongosh "$TARGET_URI/$TARGET_DB" --quiet --eval '
  db.getCollectionNames().forEach(c => {
    try {
      const idx = db.getCollection(c).getSearchIndexes();
      if (idx.length) idx.forEach(i => print(c, i.name, i.status));
    } catch(e) {}
  });
'
