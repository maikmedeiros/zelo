export interface SchoolYear {
  id: string;
  year: number;
  /** `YYYY-MM-DD`, formatado no SQL: o driver traria `date` como meia-noite local. */
  startDate: string;
  endDate: string;
  /** Quantas turmas dependem deste ano letivo — é o que trava a remoção. */
  classCount: number;
}
