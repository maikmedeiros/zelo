// Coleções de log do Zelo. O PostgreSQL não guarda log nenhum — é aqui que ele vive.
// A divisão vem do modelo (zelo_v2_2.dbml, seção MONGODB).

const DIAS = 24 * 60 * 60;

// ── log_acesso ───────────────────────────────────────────────────────────────
// Toda decisão de autorização, concedida OU negada. É a evidência do capítulo de
// resultados: a contagem de acessos NEGADOS é o que demonstra o isolamento por turma.
// Sem TTL — retido enquanto durar a matrícula.
db.createCollection('log_acesso');
db.log_acesso.createIndex({ ts: -1 }, { name: 'ts' });
db.log_acesso.createIndex({ concedido: 1, ts: -1 }, { name: 'concedido_ts' });
db.log_acesso.createIndex({ usuario_id: 1, ts: -1 }, { name: 'usuario_ts' });
db.log_acesso.createIndex({ recurso: 1, recurso_id: 1, ts: -1 }, { name: 'recurso_ts' });

// ── log_auditoria ────────────────────────────────────────────────────────────
// Alterações em entidade sensível (consentimento, acesso a turma, papel de usuário), com
// o antes e o depois. Sem TTL: é o que responde "quem mudou isto, e quando".
db.createCollection('log_auditoria');
db.log_auditoria.createIndex({ ts: -1 }, { name: 'ts' });
db.log_auditoria.createIndex({ entidade: 1, entidade_id: 1, ts: -1 }, { name: 'entidade_ts' });
db.log_auditoria.createIndex({ usuario_id: 1, ts: -1 }, { name: 'usuario_ts' });

// ── log_aplicacao ────────────────────────────────────────────────────────────
// Erro, job e métrica. Único com descarte automático: é diagnóstico, não prova.
db.createCollection('log_aplicacao');
db.log_aplicacao.createIndex({ ts: 1 }, { name: 'ttl_ts', expireAfterSeconds: 90 * DIAS });
db.log_aplicacao.createIndex({ nivel: 1, ts: -1 }, { name: 'nivel_ts' });
db.log_aplicacao.createIndex({ trace_id: 1 }, { name: 'trace', sparse: true });

// ── logs ─────────────────────────────────────────────────────────────────────
// Log de request/response do middleware (MONGO_LOG_COLLECTION). Ainda separado das três
// acima porque não carrega a decisão de autorização; consolidá-lo em `log_acesso` depende
// da reescrita do authz para o modelo v2.
db.createCollection('logs');
db.logs.createIndex({ timestamp: 1 }, { name: 'ttl_timestamp', expireAfterSeconds: 30 * DIAS });
db.logs.createIndex({ path: 1, timestamp: -1 }, { name: 'path_timestamp' });
db.logs.createIndex({ statusCode: 1, timestamp: -1 }, { name: 'status_timestamp' });

print(`[zelo] coleções de log criadas em ${db.getName()}`);
