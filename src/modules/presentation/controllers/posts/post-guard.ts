import { Actor, ResourceScope, Scope } from '@shared/auth/index.js';
import { PostOwnership } from '../../../domain/entities/post.js';

export type Can = (actor: Actor, feature: string, resource: ResourceScope) => boolean;
export type ScopesOf = (actor: Actor, feature: string) => Scope[];

/**
 * A postagem pode alcançar várias turmas, e `ResourceScope` carrega uma só — então a
 * abrangência TURMA é testada turma a turma, e basta uma passar. A chamada sem `groupId`
 * cobre PROPRIA (autor) e ESCOLA.
 */
export const makePostGuard =
  (can: Can, actor: Actor, feature: string) =>
  (ownership: PostOwnership): boolean =>
    can(actor, feature, { ownerId: ownership.authorId }) ||
    ownership.groupIds.some((groupId) =>
      can(actor, feature, { ownerId: ownership.authorId, groupId }),
    );
