import { PaginatedRow } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';
import {
  ConsentOrigin,
  ConsentState,
  ConsentType,
  StudentConsentStatus,
} from '../../../../domain/entities/consent.js';

export interface ConsentStateOutput {
  type: ConsentType;
  consentId: string | null;
  granted: boolean | null;
  origin: ConsentOrigin | null;
  startedAt: string | null;
}

export interface StudentConsentStatusOutput {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  consents: ConsentStateOutput[];
}

interface ConsentStateRow {
  TIPO: ConsentType;
  ID: string | null;
  CONCEDIDO: boolean | null;
  ORIGEM: ConsentOrigin | null;
  VIGENCIA_INICIO: string | null;
}

export interface ClassConsentPersistenceRow extends PaginatedRow {
  ALUNO_ID: string;
  NOME_ALUNO: string;
  TURMA_ID: string;
  NOME_TURMA: string;
  CONSENTIMENTOS: ConsentStateRow[] | null;
}

const toState = (row: ConsentStateRow): ConsentState => ({
  type: row.TIPO,
  consentId: row.ID,
  granted: row.CONCEDIDO,
  origin: row.ORIGEM,
  startedAt: row.VIGENCIA_INICIO === null ? null : new Date(row.VIGENCIA_INICIO),
});

export class ClassConsentMapper {
  static fromPersistence(row: ClassConsentPersistenceRow): StudentConsentStatus {
    return {
      studentId: row.ALUNO_ID,
      studentName: formatPersonName(row.NOME_ALUNO),
      classId: row.TURMA_ID,
      className: row.NOME_TURMA,
      consents: (row.CONSENTIMENTOS ?? []).map(toState),
    };
  }

  static toOutput(status: StudentConsentStatus): StudentConsentStatusOutput {
    return {
      ...status,
      consents: status.consents.map((state) => ({
        ...state,
        startedAt: state.startedAt?.toISOString() ?? null,
      })),
    };
  }
}
