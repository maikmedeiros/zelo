export const POST_TYPES = ['REGISTRO_DIARIO', 'RECADO', 'EVENTO'] as const;

export type PostType = (typeof POST_TYPES)[number];

export const POST_AUDIENCES = ['TURMA', 'ALUNO'] as const;

export type PostAudience = (typeof POST_AUDIENCES)[number];

export interface PostClass {
  id: string;
  name: string;
}

export interface PostStudent {
  id: string;
  name: string;
  classId: string | null;
  className: string | null;
}

export interface Post {
  id: string;
  audience: PostAudience;
  // Os dois são exclusivos, e é o `audience` que diz qual vale: `TURMA` preenche `classes`
  // e deixa `students` vazio; `ALUNO` faz o inverso. O banco garante isso por trigger.
  classes: PostClass[];
  students: PostStudent[];
  authorId: string;
  authorName: string;
  type: PostType;
  title: string | null;
  body: string | null;
  referenceDate: string;
  publishedAt: Date;
}
