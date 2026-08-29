import { NotFoundError } from '@shared/errors/index.js';
import { PostOwnership } from '../../../../domain/entities/post.js';
import { IPostRepository } from '../../../../domain/repositories/i-post-repository.js';
import { PostGuard } from '../update-post/update-post.usecase.js';

/**
 * A mídia herda as regras da postagem. Não há recorte próprio: quem pode ver a postagem vê
 * as fotos dela, e quem pode escrever nela anexa e remove.
 *
 * Os dois caminhos abaixo são diferentes de propósito. **Leitura** passa pelo `findById`, que
 * aplica o recorte de audiência inteiro — turma, aluno e autoria. **Escrita** passa pelo
 * `findOwnership` + guard, que é a checagem de dono já usada por `update` e `delete` da
 * postagem. Usar o recorte de leitura para autorizar escrita deixaria qualquer responsável
 * anexar foto à postagem que ele apenas recebeu.
 */

export const assertPostVisible = async (
  postRepo: IPostRepository,
  postId: string,
  actorId: string,
  viewerId: string | null,
): Promise<void> => {
  const post = await postRepo.findById(postId, viewerId, actorId);
  if (!post) throw new NotFoundError({ message: 'Postagem não encontrada' });
};

export const assertPostWritable = async (
  postRepo: IPostRepository,
  postId: string,
  guard: PostGuard,
): Promise<PostOwnership> => {
  const ownership = await postRepo.findOwnership(postId);

  // 404 e não 403: negar por permissão confirmaria que a postagem existe.
  if (!ownership || !guard(ownership)) {
    throw new NotFoundError({ message: 'Postagem não encontrada' });
  }

  return ownership;
};
