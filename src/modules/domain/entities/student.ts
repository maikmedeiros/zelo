export interface Student {
  id: string;
  personId: string;
  personName: string;
  /** `YYYY-MM-DD`. Formatado no SQL — o driver traria `date` como meia-noite local. */
  birthDate: string | null;
  /** Matrícula da escola, quando existe. Não é o id nem o vínculo com a turma. */
  code: string | null;
  notes: string | null;
  active: boolean;
  /** A turma vigente. `null` enquanto o aluno não foi matriculado. */
  classId: string | null;
  className: string | null;
}
