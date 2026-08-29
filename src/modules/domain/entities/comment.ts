export const COMMENT_STATUSES = [
  'PUBLICADO',
  'REMOVIDO_PELO_AUTOR',
  'REMOVIDO_PELA_ESCOLA',
] as const;

export type CommentStatus = (typeof COMMENT_STATUSES)[number];

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  /**
   * `null` quando o comentário foi removido. A linha continua no banco — apagá-la destruiria
   * a prova de que a moderação aconteceu —, mas o texto não sai mais para ninguém. O que a
   * família vê é a lápide: existiu um comentário aqui, e ele foi retirado.
   */
  body: string | null;
  status: CommentStatus;
  /** Só na remoção pela escola, e é obrigatório ali. */
  removalReason: string | null;
  createdAt: Date;
  editedAt: Date | null;
}

/** O que a remoção precisa saber antes de decidir se pode e de que forma. */
export interface CommentOwnership {
  id: string;
  postId: string;
  authorId: string;
  status: CommentStatus;
  /** As turmas da postagem — é por elas que a moderação de TURMA alcança o comentário. */
  groupIds: string[];
}
