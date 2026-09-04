import { PaginatedRow } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';
import { JournalEntry, JournalEntryStatus } from '../../../../domain/entities/journal-entry.js';

export interface JournalEntryOutput {
  id: string;
  studentId: string;
  classId: string;
  className: string;
  authorId: string;
  /** A foto vive em `/people/:personId/photo`: sem isto o cliente não a alcança. */
  authorPersonId: string;
  authorName: string;
  repliesToId: string | null;
  text: string | null;
  referenceDate: string;
  status: JournalEntryStatus;
  removalReason: string | null;
  removedAt: string | null;
  editedAt: string | null;
  createdAt: string;
}

export interface JournalEntryPersistenceRow extends PaginatedRow {
  ID: string;
  ALUNO_ID: string;
  TURMA_ID: string;
  NOME_TURMA: string;
  AUTOR_ID: string;
  AUTOR_PESSOA_ID: string;
  NOME_AUTOR: string;
  RESPONDE_A_ID: string | null;
  TEXTO: string | null;
  DATA_REFERENCIA: string;
  STATUS: JournalEntryStatus;
  MOTIVO_REMOCAO: string | null;
  REMOVIDO_EM: Date | null;
  EDITADO_EM: Date | null;
  CRIADO_EM: Date;
}

export class JournalEntryMapper {
  static fromPersistence(row: JournalEntryPersistenceRow): JournalEntry {
    return {
      id: row.ID,
      studentId: row.ALUNO_ID,
      classId: row.TURMA_ID,
      className: row.NOME_TURMA,
      authorId: row.AUTOR_ID,
      authorPersonId: row.AUTOR_PESSOA_ID,
      authorName: formatPersonName(row.NOME_AUTOR),
      repliesToId: row.RESPONDE_A_ID,
      text: row.TEXTO,
      referenceDate: row.DATA_REFERENCIA,
      status: row.STATUS,
      removalReason: row.MOTIVO_REMOCAO,
      removedAt: row.REMOVIDO_EM,
      editedAt: row.EDITADO_EM,
      createdAt: row.CRIADO_EM,
    };
  }

  static toOutput(entry: JournalEntry): JournalEntryOutput {
    return {
      ...entry,
      removedAt: entry.removedAt?.toISOString() ?? null,
      editedAt: entry.editedAt?.toISOString() ?? null,
      createdAt: entry.createdAt.toISOString(),
    };
  }
}
