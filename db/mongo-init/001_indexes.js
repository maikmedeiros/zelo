const COLLECTION = 'logs';
const RETENTION_DAYS = 30;

db.createCollection(COLLECTION);

db[COLLECTION].createIndex(
  { timestamp: 1 },
  { name: 'ttl_timestamp', expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60 },
);

db[COLLECTION].createIndex({ path: 1, timestamp: -1 }, { name: 'path_timestamp' });
db[COLLECTION].createIndex(
  { 'actor.handle': 1, timestamp: -1 },
  { name: 'actor_timestamp', sparse: true },
);
db[COLLECTION].createIndex({ statusCode: 1, timestamp: -1 }, { name: 'status_timestamp' });

print(`[zelo] índices criados em ${db.getName()}.${COLLECTION} (TTL ${RETENTION_DAYS}d)`);
