export const POST_TYPES = ['REGISTRO_DIARIO', 'RECADO', 'EVENTO'] as const;

export type PostType = (typeof POST_TYPES)[number];

export interface Post {
  id: string;
  classId: string;
  className: string;
  authorId: string;
  authorName: string;
  type: PostType;
  title: string | null;
  body: string | null;
  referenceDate: string;
  publishedAt: Date;
}
