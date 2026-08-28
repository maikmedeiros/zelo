import {
  IPostRepository,
  ListPostsFilters,
  ListPostsResult,
} from '../../../../domain/repositories/i-post-repository.js';

export class FindListPostsUseCase {
  constructor(private readonly postRepo: IPostRepository) {}

  execute(filters: ListPostsFilters): Promise<ListPostsResult> {
    return this.postRepo.list(filters);
  }
}
