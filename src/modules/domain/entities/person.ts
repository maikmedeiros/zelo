export const PERSON_ROLES = ['student', 'guardian', 'teacher'] as const;

export type PersonRole = (typeof PERSON_ROLES)[number];

/**
 * Quais papéis a pessoa já tem. É o que o cadastro em duas etapas precisa enxergar: antes de
 * criar a Ana de novo, o operador vê que ela já é professora e ainda não é responsável.
 */
export interface PersonRoles {
  student: boolean;
  guardian: boolean;
  teacher: boolean;
}

export interface Person {
  id: string;
  name: string;
  socialName: string | null;
  /** `YYYY-MM-DD`, formatado no SQL: o driver traria `date` como meia-noite local. */
  birthDate: string | null;
  /** Só dígitos. Ausente é o caso comum — criança sem CPF é a regra, não a exceção. */
  cpf: string | null;
  phone: string | null;
  contactEmail: string | null;
  roles: PersonRoles;
  /** Se já existe login para esta pessoa. `usuario.pessoa_id` é UNIQUE: no máximo um. */
  hasUser: boolean;
}
