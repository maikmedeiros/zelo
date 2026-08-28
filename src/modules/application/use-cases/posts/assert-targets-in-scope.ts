import { ForbiddenError } from '@shared/errors/index.js';
import { IPostRepository } from '../../../domain/repositories/i-post-repository.js';

/**
 * Endereçar uma postagem é escrita, e a abrangência vale aqui como vale na leitura: só se
 * escreve para as turmas do próprio escopo. Sem isto, `CREATE:POST:TURMA` viraria
 * `CREATE:POST:ESCOLA` na prática — bastaria mandar o id de qualquer turma no corpo.
 *
 * O escopo de escrita é MAIS ESTREITO que o de leitura, e de propósito: só `PROFESSOR_TURMA`
 * e `ACESSO_TURMA`. A ferramenta é a escola comunicando com as famílias — o responsável lê e
 * comenta, não publica. O caminho dele para a turma (matrícula do filho) daria acesso de
 * escrita sobre as outras crianças da sala, e isso não é o produto.
 *
 * No modo ALUNO a regra é a mesma vista pelo aluno: só se endereça a criança matriculada em
 * turma onde o ator é equipe.
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
