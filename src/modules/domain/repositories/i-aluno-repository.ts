export interface IAlunoRepository {
  /** Ids, entre os informados, que NÃO estão matriculados na turma. Vazio = todos válidos. */
  findIdsForaDaTurma(turmaId: string, alunoIds: string[]): Promise<string[]>;
}
