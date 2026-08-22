export interface IAlunoRepository {
  findIdsForaDaTurma(turmaId: string, alunoIds: string[]): Promise<string[]>;
}
