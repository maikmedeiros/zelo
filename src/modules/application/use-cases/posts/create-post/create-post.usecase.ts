import { InternalServerError } from '@shared/errors/index.js';
import { IDatabaseTransaction } from '@shared/protocols/index.js';
import { Post } from '../../../../domain/entities/post.js';
import {
  CreatePostData,
  IPostRepository,
} from '../../../../domain/repositories/i-post-repository.js';
import { assertTargetsInScope } from '../assert-targets-in-scope.js';

export class CreatePostUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly db: IDatabaseTransaction,
  ) {}

  async execute(data: CreatePostData): Promise<Post> {
    await assertTargetsInScope(this.postRepo, data.authorId, data.classIds, data.studentIds);

    // Postagem e audiência na mesma transação: o trigger `postagem_audiencia_coerente` é
    // DEFERRABLE e só julga no COMMIT, então gravar uma sem a outra não passa.
    const postId = await this.db.transaction(() => this.postRepo.create(data));

    const post = await this.postRepo.findById(postId, null, data.authorId);
    if (!post) {
      throw new InternalServerError({ message: 'Postagem gravada mas não relida' });
    }

    return post;
  }
}
