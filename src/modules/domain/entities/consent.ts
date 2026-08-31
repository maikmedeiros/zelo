export const CONSENT_TYPES = ['IMAGEM_INTERNA', 'IMAGEM_EXTERNA', 'TRATAMENTO_BIOMETRICO'] as const;

export type ConsentType = (typeof CONSENT_TYPES)[number];

export const CONSENT_ORIGINS = [
  'TERMO_MATRICULA',
  'PORTAL_RESPONSAVEL',
  'IMPORTACAO',
  'SOLICITACAO_VERBAL',
] as const;

export type ConsentOrigin = (typeof CONSENT_ORIGINS)[number];

export interface Consent {
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
  startedAt: Date;
  endedAt: Date | null;
  createdAt: Date;
}
