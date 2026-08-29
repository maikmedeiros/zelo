import { PaginatedRow } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';
import { GuardianLink, Relationship } from '../../../domain/entities/guardian-link.js';

export interface GuardianLinkOutput {
  id: string;
  guardianId: string;
  guardianName: string;
  studentId: string;
  studentName: string;
  relationship: Relationship;
  canConsent: boolean;
  financial: boolean;
  startDate: string;
  endDate: string | null;
}

export interface GuardianLinkPersistenceRow extends PaginatedRow {
  ID: string;
  RESPONSAVEL_ID: string;
  NOME_RESPONSAVEL: string;
  ALUNO_ID: string;
  NOME_ALUNO: string;
  PARENTESCO: Relationship;
  PODE_CONSENTIR: boolean;
  FINANCEIRO: boolean;
  DATA_INICIO: string;
  DATA_FIM: string | null;
}

export class GuardianLinkMapper {
  static fromPersistence(row: GuardianLinkPersistenceRow): GuardianLink {
    return {
      id: row.ID,
      guardianId: row.RESPONSAVEL_ID,
      guardianName: formatPersonName(row.NOME_RESPONSAVEL),
      studentId: row.ALUNO_ID,
      studentName: formatPersonName(row.NOME_ALUNO),
      relationship: row.PARENTESCO,
      canConsent: row.PODE_CONSENTIR,
      financial: row.FINANCEIRO,
      startDate: row.DATA_INICIO,
      endDate: row.DATA_FIM,
    };
  }

  static toOutput(link: GuardianLink): GuardianLinkOutput {
    return { ...link };
  }
}
