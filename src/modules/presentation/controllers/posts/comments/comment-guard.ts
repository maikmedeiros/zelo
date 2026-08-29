import { Actor } from '@shared/auth/index.js';
import { CommentOwnership } from '../../../../domain/entities/comment.js';
import { Can } from '../post-guard.js';

/**
 * Irmão do `makePostGuard`, com o dono trocado: aqui o `ownerId` é o autor do **comentário**,
 * não o da postagem. É o que faz `PROPRIA` significar "o meu comentário" e deixa a moderação
 * por `TURMA` alcançar o comentário alheio na turma que o ator atende.
 */
export const makeCommentGuard =
  (can: Can, actor: Actor, feature: string) =>
  (ownership: CommentOwnership): boolean =>
    can(actor, feature, { ownerId: ownership.authorId }) ||
    ownership.groupIds.some((groupId) =>
      can(actor, feature, { ownerId: ownership.authorId, groupId }),
    );
