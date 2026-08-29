export const ACCESS_REASONS = [
  'COORDENACAO',
  'DIRECAO',
  'SECRETARIA',
  'SUBSTITUICAO',
  'ESTAGIO',
  'OUTRO',
] as const;

export type AccessReason = (typeof ACCESS_REASONS)[number];

/**
 * Acesso a turma concedido a quem não é professor dela. É a terceira origem de escopo do
 * modelo, ao lado de `RESPONSAVEL_ALUNO→MATRICULA` e `PROFESSOR_TURMA` — e a única concedida
 * por decisão administrativa, e não por vínculo. Por isso guarda quem concedeu e por quê.
 */
export interface ClassAccess {
  id: string;
  userId: string;
  userName: string;
  classId: string;
  className: string;
  reason: AccessReason;
  justification: string | null;
  grantedById: string;
  grantedByName: string;
  startDate: string;
  endDate: string | null;
}
