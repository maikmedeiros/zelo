import { PostgresDatabase } from '@shared/infra/database/index.js';
import { ITurmaRepository, TurmaVisivel } from '../../domain/repositories/i-turma-repository.js';

interface TurmaPersistenceRow {
  ID_TURMA: string;
  TURMA: string;
}

const SELECT_TURMAS_VISIVEIS = `
  SELECT DISTINCT t.id::text AS "ID_TURMA", t.nome AS "TURMA"
  FROM turma t
  WHERE t.ativa = true
    AND (
      EXISTS (
        SELECT 1
        FROM usuario u
        INNER JOIN responsavel_aluno ra ON ra.responsavel_id = u.id
        INNER JOIN matricula m ON m.aluno_id = ra.aluno_id AND m.ativa = true
        WHERE u.handle = @handle AND u.ativo = true AND m.turma_id = t.id
      )
      OR EXISTS (
        SELECT 1
        FROM usuario u
        INNER JOIN turma_professor tp ON tp.professor_id = u.id
        WHERE u.handle = @handle AND u.ativo = true AND tp.turma_id = t.id
      )
    )
  ORDER BY t.nome;
`;

const SELECT_TURMA_EXISTS = `
  SELECT 1 AS "EXISTE" FROM turma WHERE id = @id::uuid AND ativa = true;
`;

export class TurmaRepository implements ITurmaRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async listVisiveisPara(handle: string): Promise<TurmaVisivel[]> {
    const rows = await this.db.query<TurmaPersistenceRow>(SELECT_TURMAS_VISIVEIS, { handle });
    return rows.map((row) => ({ id: row.ID_TURMA, nome: row.TURMA }));
  }

  async exists(id: string): Promise<boolean> {
    const rows = await this.db.query<{ EXISTE: number }>(SELECT_TURMA_EXISTS, { id });
    return rows.length > 0;
  }
}
