import { PaginatedRow } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';
import { Consent, ConsentOrigin, ConsentType } from '../../../../domain/entities/consent.js';

export interface ConsentOutput {
  id: string;
  studentId: string;
  type: ConsentType;
  granted: boolean;
  origin: ConsentOrigin;
  recordedById: string;
  recordedByName: string;
  guardianId: string | null;
  guardianName: string | null;
  documentKey: string | null;
  note: string | null;
  startedAt: string;
  endedAt: string | null;
  /** Derivado de `endedAt`: poupa o cliente de reimplementar a regra da vigência. */
  current: boolean;
  createdAt: string;
}

export interface ConsentPersistenceRow extends PaginatedRow {
  ID: string;
  ALUNO_ID: string;
  TIPO: ConsentType;
  CONCEDIDO: boolean;
  ORIGEM: ConsentOrigin;
  REGISTRADO_POR: string;
  NOME_REGISTRADOR: string;
  RESPONSAVEL_ID: string | null;
  NOME_RESPONSAVEL: string | null;
  DOCUMENTO_CHAVE: string | null;
  OBSERVACAO: string | null;
  VIGENCIA_INICIO: Date;
  VIGENCIA_FIM: Date | null;
  CRIADO_EM: Date;
}

export class ConsentMapper {
  static fromPersistence(row: ConsentPersistenceRow): Consent {
    return {
      id: row.ID,
      studentId: row.ALUNO_ID,
      type: row.TIPO,
      granted: row.CONCEDIDO,
      origin: row.ORIGEM,
      recordedById: row.REGISTRADO_POR,
      recordedByName: formatPersonName(row.NOME_REGISTRADOR),
      guardianId: row.RESPONSAVEL_ID,
      guardianName: row.NOME_RESPONSAVEL === null ? null : formatPersonName(row.NOME_RESPONSAVEL),
      documentKey: row.DOCUMENTO_CHAVE,
      note: row.OBSERVACAO,
      startedAt: row.VIGENCIA_INICIO,
      endedAt: row.VIGENCIA_FIM,
      createdAt: row.CRIADO_EM,
    };
  }

  static toOutput(consent: Consent): ConsentOutput {
    return {
      ...consent,
      startedAt: consent.startedAt.toISOString(),
      endedAt: consent.endedAt?.toISOString() ?? null,
      current: consent.endedAt === null,
      createdAt: consent.createdAt.toISOString(),
    };
  }
}
