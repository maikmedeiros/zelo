export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  /** `YYYY-MM-DD`. Formatado no SQL — o driver traria `date` como meia-noite local. */
  startDate: string;
  /** `null` enquanto vigente. Encerrar a matrícula é preencher isto, nunca apagar a linha. */
  endDate: string | null;
}
