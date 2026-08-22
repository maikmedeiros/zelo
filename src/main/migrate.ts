import { pgConnection } from '@config/database.js';
import { runMigrations } from '@shared/infra/database/index.js';

// Mesmo migrator do boot, como passo isolado de deploy: é o caminho de produção, onde
// `DB_AUTO_MIGRATE` fica desligada para que N réplicas não disputem o DDL ao subir.
await runMigrations(pgConnection);
