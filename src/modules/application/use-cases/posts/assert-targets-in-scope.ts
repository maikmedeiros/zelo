import { ForbiddenError } from '@shared/errors/index.js';
import { IPostRepository } from '../../../domain/repositories/i-post-repository.js';

/**
 * Endereçar uma postagem é escrita, e a abrangência vale aqui como vale na leitura: só se
 * escreve para as turmas do próprio escopo. Sem isto, `CREATE:POST:TURMA` viraria
 * `CREATE:POST:ESCOLA` na prática — bastaria mandar o id de qualquer turma no corpo.
 *
 * O escopo usado é o mesmo da leitura (as três origens), e não só o de equipe: abrangência
 * `TURMA` significa "as minhas turmas", e ter duas definições dela seria uma armadilha.
 * Restringir a escrita a professor e acesso concedido é trocar `TURMA_NO_ESCOPO` por
 * `TURMA_DA_EQUIPE` nas duas consultas do repositório.
 */
export const assertTargetsInScope = async (
  postRepo: IPostRepository,
  actorId: string,
  classIds: string[],
  studentIds: string[],
): Promise<void> => {
  const foraDeEscopo = [
    ...(classIds.length > 0 ? await postRepo.findClassesOutOfScope(classIds, actorId) : []),
    ...(studentIds.length > 0 ? await postRepo.findStudentsOutOfScope(studentIds, actorId) : []),
  ];

  if (foraDeEscopo.length > 0) {
    throw new ForbiddenError({
      message: 'Destinatário fora do seu escopo',
      cause: { outOfScope: foraDeEscopo },
    });
  }
};
