import { PostgresDatabase } from '@shared/infra/database/index.js';
import { IAlunoRepository } from '../../domain/repositories/i-aluno-repository.js';

const SELECT_IDS_FORA_DA_TURMA = `
  SELECT informado.id::text AS "ID_ALUNO"
  FROM unnest(@alunoIds::uuid[]) AS informado(id)
  WHERE NOT EXISTS (
    SELECT 1
    FROM matricula m
    WHERE m.aluno_id = informado.id
      AND m.turma_id = @turmaId::uuid
      AND m.ativa = true
  );
`;

export class AlunoRepository implements IAlunoRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async findIdsForaDaTurma(turmaId: string, alunoIds: string[]): Promise<string[]> {
    if (alunoIds.length === 0) return [];

    const rows = await this.db.query<{ ID_ALUNO: string }>(SELECT_IDS_FORA_DA_TURMA, {
      turmaId,
      alunoIds,
    });

    return rows.map((row) => row.ID_ALUNO);
  }
}
