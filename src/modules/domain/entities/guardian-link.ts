export const RELATIONSHIPS = ['MAE', 'PAI', 'AVO', 'TIO', 'IRMAO', 'TUTOR_LEGAL', 'OUTRO'] as const;

export type Relationship = (typeof RELATIONSHIPS)[number];

export interface GuardianLink {
  id: string;
  guardianId: string;
  guardianName: string;
  studentId: string;
  studentName: string;
  relationship: Relationship;
  /** Quem pode assinar consentimento de LGPD por esta criança. Nem todo vínculo pode. */
  canConsent: boolean;
  financial: boolean;
  startDate: string;
  /** `null` enquanto vigente. Encerrar é preencher isto, nunca apagar a linha. */
  endDate: string | null;
}
