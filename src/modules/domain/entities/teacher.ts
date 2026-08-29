export interface Teacher {
  id: string;
  personId: string;
  personName: string;
  cpf: string | null;
  registration: string | null;
  education: string | null;
  active: boolean;
  /** Quantas turmas com vínculo vigente. */
  classCount: number;
}
