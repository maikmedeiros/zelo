export const CLASS_SHIFTS = ['MANHA', 'TARDE', 'INTEGRAL'] as const;

export type ClassShift = (typeof CLASS_SHIFTS)[number];

export interface Class {
  id: string;
  name: string;
  segment: string;
  shift: ClassShift;
  schoolYearId: string;
  /** O ano em si, e não só o id: sem ele o cliente precisaria de uma segunda ida. */
  schoolYear: number;
  /** Matrículas vigentes — é o que trava a remoção. */
  studentCount: number;
}
