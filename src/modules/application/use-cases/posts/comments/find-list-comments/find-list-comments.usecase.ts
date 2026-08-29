import { ListCommentsResult } from '../../../../../domain/repositories/i-comment-repository.js';
import { ICommentRepository } from '../../../../../domain/repositories/i-comment-repository.js';
import { IPostRepository } from '../../../../../domain/repositories/i-post-repository.js';
import { assertPostVisible } from '../../media/media-access.js';

export interface ListCommentsInput {
  postId: string;
  page: number;
  limit: number;
  actorId: string;
  viewerId: string | null;
}

export class FindListCommentsUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly commentRepo: ICommentRepository,
  ) {}

  async execute(input: ListCommentsInput): Promise<ListCommentsResult> {
    // O comentário não tem recorte próprio: quem alcança a postagem alcança a conversa dela.
    await assertPostVisible(this.postRepo, input.postId, input.actorId, input.viewerId);

    return this.commentRepo.list({
      postId: input.postId,
      page: input.page,
      limit: input.limit,
    });
  }
}
