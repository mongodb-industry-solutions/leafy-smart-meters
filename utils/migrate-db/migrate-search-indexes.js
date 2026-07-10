// migrate-search-indexes.js
// Usage:
//   mongosh --quiet \
//     --eval "var SOURCE_URI='...', SOURCE_DB='...', TARGET_URI='...', TARGET_DB='...';" \
//     migrate-search-indexes.js
//
// Note: leafy-smart-meters does not currently use Atlas Search or Vector Search indexes.
// This script is included per the migration guide for completeness and future-proofing.

const sourceConn = Mongo(SOURCE_URI);
const sourceDb = sourceConn.getDB(SOURCE_DB);

const targetConn = Mongo(TARGET_URI);
const targetDb = targetConn.getDB(TARGET_DB);

const collections = sourceDb.getCollectionNames().filter(c => !c.startsWith("system."));

let created = 0, skipped = 0, failed = 0;

for (const collName of collections) {
  const sourceColl = sourceDb.getCollection(collName);
  let indexes;
  try {
    indexes = sourceColl.getSearchIndexes();
  } catch (e) {
    // Collection may not support search indexes
    continue;
  }

  if (!indexes || indexes.length === 0) continue;

  const targetColl = targetDb.getCollection(collName);
  let existingIndexes;
  try {
    existingIndexes = targetColl.getSearchIndexes();
  } catch (e) {
    existingIndexes = [];
  }
  const existingNames = new Set(existingIndexes.map(i => i.name));

  for (const idx of indexes) {
    if (existingNames.has(idx.name)) {
      print(`SKIP  ${collName}.${idx.name} (already exists)`);
      skipped++;
      continue;
    }

    try {
      targetColl.createSearchIndex({
        name: idx.name,
        type: idx.type,
        definition: idx.latestDefinition || idx.definition,
      });
      print(`CREATE  ${collName}.${idx.name}`);
      created++;
    } catch (e) {
      print(`FAIL  ${collName}.${idx.name}: ${e.message}`);
      failed++;
    }
  }
}

print(`\nSummary: ${created} created, ${skipped} skipped, ${failed} failed`);
