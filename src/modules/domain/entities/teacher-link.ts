export const TEACHER_ROLES = ['TITULAR', 'AUXILIAR', 'VOLANTE'] as const;

export type TeacherRole = (typeof TEACHER_ROLES)[number];

export interface TeacherLink {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  role: TeacherRole;
  startDate: string;
  endDate: string | null;
}
