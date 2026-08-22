// Executado pelo entrypoint do MongoDB no PRIMEIRO boot (volume vazio), contra o banco de
// MONGO_INITDB_DATABASE.
//
// Existe para fechar a lacuna que a arquitetura marca como pré-requisito de deploy: a
// aplicação NUNCA cria índice e NUNCA remove documento de log. Sem o índice TTL a coleção
// cresce indefinidamente até estourar o disco.
//
// Em homolog/produção este arquivo NÃO roda — crie o índice à mão antes de ligar a flag.

const COLLECTION = 'logs';
const RETENTION_DAYS = 30;

db.createCollection(COLLECTION);

// TTL: o MongoDB remove sozinho documento cujo `timestamp` passou da retenção.
db[COLLECTION].createIndex(
  { timestamp: 1 },
  { name: 'ttl_timestamp', expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60 },
);

// Índices de consulta — o log só serve se for pesquisável. Espelham as três perguntas que
// se faz numa investigação: o que aconteceu nesta rota, o que este ator fez, o que falhou.
db[COLLECTION].createIndex({ path: 1, timestamp: -1 }, { name: 'path_timestamp' });
db[COLLECTION].createIndex(
  { 'actor.handle': 1, timestamp: -1 },
  { name: 'actor_timestamp', sparse: true },
);
db[COLLECTION].createIndex({ statusCode: 1, timestamp: -1 }, { name: 'status_timestamp' });

print(`[zelo] índices criados em ${db.getName()}.${COLLECTION} (TTL ${RETENTION_DAYS}d)`);
