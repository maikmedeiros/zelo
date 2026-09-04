export const POST_TYPES = ['REGISTRO_DIARIO', 'RECADO', 'EVENTO'] as const;

export type PostType = (typeof POST_TYPES)[number];

export const POST_AUDIENCES = ['TURMA', 'ALUNO'] as const;

export type PostAudience = (typeof POST_AUDIENCES)[number];

export const POST_STATUSES = ['RASCUNHO', 'PUBLICADA', 'REMOVIDA'] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

/**
 * O mínimo para autorizar uma escrita: quem é o dono e quais turmas a postagem alcança.
 * Carregado antes da regra, para o guard de abrangência decidir sem trazer a postagem toda.
 */
export interface PostOwnership {
  id: string;
  authorId: string;
  status: PostStatus;
  audience: PostAudience;
  /** Turmas alcançadas — diretas no modo TURMA, via matrícula no modo ALUNO. */
  groupIds: string[];
  hasBody: boolean;
  hasMedia: boolean;
}

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

/** A imagem, como o feed a enxerga. Os bytes vêm por `GET /posts/:postId/media/:mediaId`. */
export interface PostMedia {
  id: string;
  mimeType: string;
  sizeBytes: number;
  order: number;
}

export interface Post {
  id: string;
  audience: PostAudience;
  // Os dois são exclusivos, e é o `audience` que diz qual vale: `TURMA` preenche `classes`
  // e deixa `students` vazio; `ALUNO` faz o inverso. O banco garante isso por trigger.
  classes: PostClass[];
  students: PostStudent[];
  authorId: string;
  authorPersonId: string;
  authorName: string;
  type: PostType;
  title: string | null;
  body: string | null;
  referenceDate: string;
  /** `null` enquanto RASCUNHO — o modelo só exige a data na transição para PUBLICADA. */
  publishedAt: Date | null;
  /**
   * A galeria, embutida para o feed não precisar de uma chamada por postagem. Vem sem o
   * `postId` de cada item, que seria repetir o da postagem que a contém.
   */
  media: PostMedia[];
  commentCount: number;
  reactionCount: number;
  myReaction: string | null;
}
